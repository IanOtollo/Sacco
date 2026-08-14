import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { requireAdmin } from "../authz";
import { logAction } from "../audit";
import { notify } from "../notifications/helpers";
import { generateReferenceNumber } from "../accounts/helpers";
import { MutationCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";

async function creditAccount(
  ctx: MutationCtx,
  args: {
    memberId: Id<"members">;
    type: "savings" | "shares";
    amount: number;
    month: string;
    processedBy: Id<"users">;
  }
) {
  if (args.amount <= 0) return;
  const account = await ctx.db
    .query("accounts")
    .withIndex("by_member_type", (q) =>
      q.eq("memberId", args.memberId).eq("type", args.type)
    )
    .first();
  if (!account) return;

  const balanceBefore = account.balance;
  const balanceAfter = balanceBefore + args.amount;
  await ctx.db.patch(account._id, { balance: balanceAfter });

  await ctx.db.insert("transactions", {
    accountId: account._id,
    memberId: args.memberId,
    type: args.type === "shares" ? "share_purchase" : "deposit",
    amount: args.amount,
    balanceBefore,
    balanceAfter,
    description: `Monthly contribution — ${args.month}`,
    referenceNumber: generateReferenceNumber(),
    processedBy: args.processedBy,
    channel: "cash",
    status: "completed",
  });
}

export const record = mutation({
  args: {
    memberId: v.id("members"),
    month: v.string(),
    savingsAmount: v.number(),
    sharesAmount: v.number(),
    receiptNumber: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const member = await ctx.db.get(args.memberId);
    if (!member) throw new Error("Member not found");

    const totalAmount = args.savingsAmount + args.sharesAmount;
    if (totalAmount <= 0) {
      throw new Error("Enter a savings or shares amount");
    }

    await creditAccount(ctx, {
      memberId: args.memberId,
      type: "savings",
      amount: args.savingsAmount,
      month: args.month,
      processedBy: admin._id,
    });
    await creditAccount(ctx, {
      memberId: args.memberId,
      type: "shares",
      amount: args.sharesAmount,
      month: args.month,
      processedBy: admin._id,
    });

    const existing = await ctx.db
      .query("contributions")
      .withIndex("by_member_month", (q) =>
        q.eq("memberId", args.memberId).eq("month", args.month)
      )
      .first();

    const patch = {
      savingsAmount: (existing?.savingsAmount ?? 0) + args.savingsAmount,
      sharesAmount: (existing?.sharesAmount ?? 0) + args.sharesAmount,
      totalAmount: (existing?.totalAmount ?? 0) + totalAmount,
      status: "paid" as const,
      paidAt: new Date().toISOString(),
      receiptNumber: args.receiptNumber,
      processedBy: admin._id,
    };

    if (existing) {
      await ctx.db.patch(existing._id, patch);
    } else {
      await ctx.db.insert("contributions", {
        memberId: args.memberId,
        month: args.month,
        ...patch,
      });
    }

    if (member.userId) {
      await notify(ctx, {
        recipientUserId: member.userId,
        title: "Contribution recorded",
        message: `Your ${args.month} contribution of KES ${totalAmount.toLocaleString()} has been recorded.`,
        type: "payment_received",
        relatedEntityType: "contribution",
        relatedEntityId: args.memberId,
      });
    }

    await logAction(ctx, {
      userId: admin._id,
      action: "contribution.record",
      entityType: "contribution",
      entityId: args.memberId,
      details: { month: args.month, totalAmount },
    });
  },
});
