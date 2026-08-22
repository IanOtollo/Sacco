import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { requireTreasurer, requireMemberProfile } from "../authz";
import { logAction } from "../audit";
import { notify } from "../notifications/helpers";
import { generateReferenceNumber } from "../accounts/helpers";

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export const declare = mutation({
  args: {
    financialYear: v.string(),
    round: v.union(v.literal("first"), v.literal("second")),
    totalPool: v.number(),
    ratePercent: v.number(),
  },
  handler: async (ctx, args) => {
    const admin = await requireTreasurer(ctx);

    const dividendId = await ctx.db.insert("dividends", {
      financialYear: args.financialYear,
      round: args.round,
      totalPool: args.totalPool,
      ratePercent: args.ratePercent,
      declaredDate: new Date().toISOString().slice(0, 10),
      status: "declared",
      declaredBy: admin._id,
    });

    // Dividends are paid on share capital specifically — the traditional
    // Sacco definition of a member's ownership stake. Long-term/short-term
    // shares are separate savings-style products, not dividend-bearing.
    const sharesAccounts = await ctx.db
      .query("accounts")
      .withIndex("by_member_type")
      .filter((q) => q.eq(q.field("type"), "shares_capital"))
      .collect();

    let payoutCount = 0;
    for (const account of sharesAccounts) {
      if (account.balance <= 0) continue;
      const amount = round2(account.balance * (args.ratePercent / 100));
      if (amount <= 0) continue;

      await ctx.db.insert("dividendPayouts", {
        dividendId,
        memberId: account.memberId,
        sharesBalance: account.balance,
        amount,
        creditedToAccount: account._id,
        status: "pending",
      });
      payoutCount++;
    }

    await logAction(ctx, {
      userId: admin._id,
      action: "dividend.declare",
      entityType: "dividend",
      entityId: dividendId,
      details: { ...args, payoutCount },
    });

    return { dividendId, payoutCount };
  },
});

export const distribute = mutation({
  args: { dividendId: v.id("dividends") },
  handler: async (ctx, { dividendId }) => {
    const admin = await requireTreasurer(ctx);
    const dividend = await ctx.db.get(dividendId);
    if (!dividend) throw new Error("Dividend not found");
    if (dividend.status !== "declared") {
      throw new Error("Only declared dividends can be distributed");
    }
    if ((dividend.round ?? "first") !== "first") {
      throw new Error(
        "Second-round dividends aren't bulk-distributed — each member redeems their own share from the portal"
      );
    }

    await ctx.db.patch(dividendId, { status: "processing" });

    const payouts = await ctx.db
      .query("dividendPayouts")
      .withIndex("by_dividend", (q) => q.eq("dividendId", dividendId))
      .collect();

    let credited = 0;
    for (const payout of payouts) {
      if (payout.status !== "pending") continue;
      const account = await ctx.db.get(payout.creditedToAccount);
      if (!account) {
        await ctx.db.patch(payout._id, { status: "failed" });
        continue;
      }

      const savingsAccount = await ctx.db
        .query("accounts")
        .withIndex("by_member_type", (q) =>
          q.eq("memberId", payout.memberId).eq("type", "savings")
        )
        .first();
      if (!savingsAccount) {
        await ctx.db.patch(payout._id, { status: "failed" });
        continue;
      }

      const balanceBefore = savingsAccount.balance;
      const balanceAfter = round2(balanceBefore + payout.amount);
      await ctx.db.patch(savingsAccount._id, { balance: balanceAfter });

      await ctx.db.insert("transactions", {
        accountId: savingsAccount._id,
        memberId: payout.memberId,
        type: "dividend_credit",
        amount: payout.amount,
        balanceBefore,
        balanceAfter,
        description: `Dividend (1st share) — ${dividend.financialYear}`,
        referenceNumber: generateReferenceNumber(),
        processedBy: admin._id,
        channel: "system",
        status: "completed",
      });

      await ctx.db.patch(payout._id, { status: "credited" });
      credited++;

      const member = await ctx.db.get(payout.memberId);
      if (member?.userId) {
        await notify(ctx, {
          recipientUserId: member.userId,
          title: "Dividend credited",
          message: `KES ${payout.amount.toLocaleString()} has been credited to your savings account for ${dividend.financialYear}.`,
          type: "payment_received",
          relatedEntityType: "dividend",
          relatedEntityId: dividendId,
        });
      }
    }

    await ctx.db.patch(dividendId, { status: "distributed" });

    await logAction(ctx, {
      userId: admin._id,
      action: "dividend.distribute",
      entityType: "dividend",
      entityId: dividendId,
      details: { credited },
    });

    return { credited };
  },
});

export const redeem = mutation({
  args: { payoutId: v.id("dividendPayouts") },
  handler: async (ctx, { payoutId }) => {
    const caller = await requireMemberProfile(ctx);

    const payout = await ctx.db.get(payoutId);
    if (!payout) throw new Error("Payout not found");
    if (payout.memberId !== caller.memberId) {
      throw new Error("This payout doesn't belong to you");
    }
    if (payout.status !== "pending") {
      throw new Error("This dividend has already been redeemed");
    }

    const dividend = await ctx.db.get(payout.dividendId);
    if (!dividend) throw new Error("Dividend not found");
    if ((dividend.round ?? "first") !== "second") {
      throw new Error("Only second-round dividends are redeemed individually");
    }
    if (dividend.status === "cancelled") {
      throw new Error("This dividend has been cancelled");
    }

    const savingsAccount = await ctx.db
      .query("accounts")
      .withIndex("by_member_type", (q) =>
        q.eq("memberId", payout.memberId).eq("type", "savings")
      )
      .first();
    if (!savingsAccount) throw new Error("No savings account found");

    const balanceBefore = savingsAccount.balance;
    const balanceAfter = round2(balanceBefore + payout.amount);
    await ctx.db.patch(savingsAccount._id, { balance: balanceAfter });

    await ctx.db.insert("transactions", {
      accountId: savingsAccount._id,
      memberId: payout.memberId,
      type: "dividend_credit",
      amount: payout.amount,
      balanceBefore,
      balanceAfter,
      description: `Dividend (2nd share) — ${dividend.financialYear}`,
      referenceNumber: generateReferenceNumber(),
      processedBy: caller._id,
      channel: "system",
      status: "completed",
    });

    await ctx.db.patch(payoutId, { status: "credited" });

    await logAction(ctx, {
      userId: caller._id,
      action: "dividend.redeem",
      entityType: "dividendPayout",
      entityId: payoutId,
      details: { amount: payout.amount, financialYear: dividend.financialYear },
    });

    return { amount: payout.amount };
  },
});

export const cancel = mutation({
  args: { dividendId: v.id("dividends") },
  handler: async (ctx, { dividendId }) => {
    const admin = await requireTreasurer(ctx);
    const dividend = await ctx.db.get(dividendId);
    if (!dividend) throw new Error("Dividend not found");
    if (dividend.status !== "declared") {
      throw new Error("Only declared (undistributed) dividends can be cancelled");
    }
    await ctx.db.patch(dividendId, { status: "cancelled" });

    await logAction(ctx, {
      userId: admin._id,
      action: "dividend.cancel",
      entityType: "dividend",
      entityId: dividendId,
      details: {},
    });
  },
});
