import { mutation } from "../_generated/server";
import { requireMemberProfile } from "../authz";
import { logAction } from "../audit";
import { generateReferenceNumber } from "../accounts/helpers";

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// Redeems the caller's entire pending commission balance in one go — no
// per-row picking, same idea as "cash out" rather than the dividend
// per-payout redeem.
export const redeem = mutation({
  args: {},
  handler: async (ctx, {}) => {
    const caller = await requireMemberProfile(ctx);

    const pending = await ctx.db
      .query("commissions")
      .withIndex("by_member_status", (q) =>
        q.eq("memberId", caller.memberId!).eq("status", "pending")
      )
      .collect();

    if (pending.length === 0) {
      throw new Error("No commission available to redeem");
    }

    const total = round2(pending.reduce((sum, row) => sum + row.amount, 0));

    const savingsAccount = await ctx.db
      .query("accounts")
      .withIndex("by_member_type", (q) =>
        q.eq("memberId", caller.memberId!).eq("type", "savings")
      )
      .first();
    if (!savingsAccount) throw new Error("No savings account found");

    const balanceBefore = savingsAccount.balance;
    const balanceAfter = round2(balanceBefore + total);
    await ctx.db.patch(savingsAccount._id, { balance: balanceAfter });

    await ctx.db.insert("transactions", {
      accountId: savingsAccount._id,
      memberId: caller.memberId!,
      type: "commission_credit",
      amount: total,
      balanceBefore,
      balanceAfter,
      description: `Referral commission redeemed (${pending.length} item${pending.length === 1 ? "" : "s"})`,
      referenceNumber: generateReferenceNumber(),
      processedBy: caller._id,
      channel: "system",
      status: "completed",
    });

    for (const row of pending) {
      await ctx.db.patch(row._id, { status: "redeemed" });
    }

    await logAction(ctx, {
      userId: caller._id,
      action: "commission.redeem",
      entityType: "member",
      entityId: caller.memberId!,
      details: { amount: total, count: pending.length },
    });

    return { amount: total };
  },
});
