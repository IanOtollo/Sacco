import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { requireAdmin } from "../authz";
import { logAction } from "../audit";
import { notify } from "../notifications/helpers";
import { generateReferenceNumber } from "../accounts/helpers";

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export const declare = mutation({
  args: {
    financialYear: v.string(),
    totalPool: v.number(),
    ratePercent: v.number(),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);

    const dividendId = await ctx.db.insert("dividends", {
      financialYear: args.financialYear,
      totalPool: args.totalPool,
      ratePercent: args.ratePercent,
      declaredDate: new Date().toISOString().slice(0, 10),
      status: "declared",
      declaredBy: admin._id,
    });

    const sharesAccounts = await ctx.db
      .query("accounts")
      .withIndex("by_member_type")
      .filter((q) => q.eq(q.field("type"), "shares"))
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
    const admin = await requireAdmin(ctx);
    const dividend = await ctx.db.get(dividendId);
    if (!dividend) throw new Error("Dividend not found");
    if (dividend.status !== "declared") {
      throw new Error("Only declared dividends can be distributed");
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
        description: `Dividend — ${dividend.financialYear}`,
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

export const cancel = mutation({
  args: { dividendId: v.id("dividends") },
  handler: async (ctx, { dividendId }) => {
    const admin = await requireAdmin(ctx);
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
