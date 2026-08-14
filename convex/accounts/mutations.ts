import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { requireAdmin } from "../authz";
import { logAction } from "../audit";
import { notify } from "../notifications/helpers";
import { generateReferenceNumber } from "./helpers";

const channelValidator = v.union(
  v.literal("cash"),
  v.literal("mpesa"),
  v.literal("bank_transfer"),
  v.literal("system")
);

export const deposit = mutation({
  args: {
    memberId: v.id("members"),
    type: v.union(v.literal("savings"), v.literal("shares")),
    amount: v.number(),
    channel: channelValidator,
    receiptNumber: v.optional(v.string()),
    narration: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);

    if (args.amount <= 0) {
      throw new Error("Amount must be greater than zero");
    }

    const member = await ctx.db.get(args.memberId);
    if (!member) throw new Error("Member not found");

    const account = await ctx.db
      .query("accounts")
      .withIndex("by_member_type", (q) =>
        q.eq("memberId", args.memberId).eq("type", args.type)
      )
      .first();
    if (!account) throw new Error("Account not found");

    const balanceBefore = account.balance;
    const balanceAfter = balanceBefore + args.amount;

    await ctx.db.patch(account._id, { balance: balanceAfter });

    const transactionType =
      args.type === "shares" ? "share_purchase" : "deposit";

    await ctx.db.insert("transactions", {
      accountId: account._id,
      memberId: args.memberId,
      type: transactionType,
      amount: args.amount,
      balanceBefore,
      balanceAfter,
      description:
        args.narration ??
        `${args.type === "shares" ? "Share purchase" : "Deposit"} via ${args.channel}`,
      referenceNumber: generateReferenceNumber(),
      processedBy: admin._id,
      channel: args.channel,
      status: "completed",
      receiptNumber: args.receiptNumber,
      narration: args.narration,
    });

    await logAction(ctx, {
      userId: admin._id,
      action: "account.deposit",
      entityType: "account",
      entityId: account._id,
      details: { amount: args.amount, type: args.type },
    });

    if (member.userId) {
      await notify(ctx, {
        recipientUserId: member.userId,
        title: "Deposit received",
        message: `A deposit of KES ${args.amount.toLocaleString()} was credited to your ${args.type} account.`,
        type: "payment_received",
        relatedEntityType: "account",
        relatedEntityId: account._id,
      });
    }

    return { balanceAfter };
  },
});

export const withdraw = mutation({
  args: {
    memberId: v.id("members"),
    type: v.union(v.literal("savings"), v.literal("shares")),
    amount: v.number(),
    channel: channelValidator,
    receiptNumber: v.optional(v.string()),
    narration: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);

    if (args.amount <= 0) {
      throw new Error("Amount must be greater than zero");
    }

    const member = await ctx.db.get(args.memberId);
    if (!member) throw new Error("Member not found");

    const account = await ctx.db
      .query("accounts")
      .withIndex("by_member_type", (q) =>
        q.eq("memberId", args.memberId).eq("type", args.type)
      )
      .first();
    if (!account) throw new Error("Account not found");

    const balanceBefore = account.balance;
    const balanceAfter = balanceBefore - args.amount;

    if (balanceAfter < account.minimumBalance) {
      throw new Error(
        `Withdrawal would breach the minimum balance of KES ${account.minimumBalance.toLocaleString()}`
      );
    }

    await ctx.db.patch(account._id, { balance: balanceAfter });

    const transactionType =
      args.type === "shares" ? "share_withdrawal" : "withdrawal";

    await ctx.db.insert("transactions", {
      accountId: account._id,
      memberId: args.memberId,
      type: transactionType,
      amount: args.amount,
      balanceBefore,
      balanceAfter,
      description:
        args.narration ??
        `${args.type === "shares" ? "Share withdrawal" : "Withdrawal"} via ${args.channel}`,
      referenceNumber: generateReferenceNumber(),
      processedBy: admin._id,
      channel: args.channel,
      status: "completed",
      receiptNumber: args.receiptNumber,
      narration: args.narration,
    });

    await logAction(ctx, {
      userId: admin._id,
      action: "account.withdraw",
      entityType: "account",
      entityId: account._id,
      details: { amount: args.amount, type: args.type },
    });

    if (member.userId) {
      await notify(ctx, {
        recipientUserId: member.userId,
        title: "Withdrawal processed",
        message: `KES ${args.amount.toLocaleString()} was withdrawn from your ${args.type} account.`,
        type: "account_update",
        relatedEntityType: "account",
        relatedEntityId: account._id,
      });
    }

    return { balanceAfter };
  },
});
