import { v } from "convex/values";
import { internalMutation } from "../_generated/server";
import { paymentMatchesClaim } from "./helpers";

// Set MPESA_AUTO_TRACK=true on the Convex deployment once the paybill
// callbacks are live. From then on every paybill payment adds to the Sacco's
// Money in M-Pesa by itself, and admin-recorded M-Pesa repayments stop adding
// it a second time.
export function mpesaAutoTrackEnabled(): boolean {
  return process.env.MPESA_AUTO_TRACK === "true";
}

// Daraja sends TransTime as yyyyMMddHHmmss in East Africa Time.
function parseTransTime(raw: string): string {
  const m = /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/.exec(raw);
  return m
    ? `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}+03:00`
    : new Date().toISOString();
}

// A paybill payment confirmed by Safaricom (C2B Confirmation). Idempotent on
// the M-Pesa transaction code, so a retried callback never counts twice.
export const recordC2B = internalMutation({
  args: {
    transId: v.string(),
    transTime: v.string(),
    amount: v.number(),
    billRef: v.string(),
    msisdn: v.optional(v.string()),
    payerName: v.string(),
    orgBalance: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const transId = args.transId.trim().toUpperCase();
    if (!transId || !Number.isFinite(args.amount) || args.amount <= 0) {
      throw new Error("Invalid M-Pesa payment payload");
    }

    const existing = await ctx.db
      .query("mpesaPayments")
      .withIndex("by_transId", (q) => q.eq("transId", transId))
      .first();
    if (existing) return { duplicate: true };

    // Verify a waiting claim only when exactly one matches, so a payment is
    // never tied to the wrong member.
    const candidates = (
      await ctx.db
        .query("depositClaims")
        .withIndex("by_status", (q) => q.eq("status", "pending"))
        .collect()
    ).filter(
      (c) =>
        !c.mpesaVerified &&
        paymentMatchesClaim(
          { transId, amount: args.amount, payerName: args.payerName },
          c
        )
    );
    const claim = candidates.length === 1 ? candidates[0] : undefined;
    const claimMatches = !!claim;

    const paidAt = parseTransTime(args.transTime);
    const paymentId = await ctx.db.insert("mpesaPayments", {
      transId,
      paidAt,
      amount: args.amount,
      billRef: args.billRef,
      msisdn: args.msisdn,
      payerName: args.payerName,
      orgBalance: args.orgBalance,
      matchedClaimId: claimMatches ? claim!._id : undefined,
    });

    // The claim arrived before its own callback — it is now verified.
    if (claim && claimMatches) {
      await ctx.db.patch(claim._id, { mpesaVerified: true });
    }

    if (mpesaAutoTrackEnabled()) {
      await ctx.db.insert("treasuryEntries", {
        channel: "mpesa",
        kind: "in",
        amount: args.amount,
        note: `Paybill payment ${transId}${args.payerName ? ` — ${args.payerName}` : ""}`,
        entryDate: paidAt.slice(0, 10),
        source: "mpesa_c2b",
      });
    }

    return { duplicate: false, paymentId };
  },
});
