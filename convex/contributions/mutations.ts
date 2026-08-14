import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { requireTreasurer } from "../authz";
import { logAction } from "../audit";
import { notify } from "../notifications/helpers";
import { generateReferenceNumber } from "../accounts/helpers";

export const createType = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await requireTreasurer(ctx);

    const existing = await ctx.db
      .query("contributionTypes")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();
    if (existing) throw new Error(`A contribution type named "${args.name}" already exists`);

    const typeId = await ctx.db.insert("contributionTypes", {
      name: args.name,
      description: args.description,
      isActive: true,
      createdBy: admin._id,
    });

    await logAction(ctx, {
      userId: admin._id,
      action: "contributionType.create",
      entityType: "contributionType",
      entityId: typeId,
      details: { name: args.name },
    });

    return typeId;
  },
});

export const setTypeActive = mutation({
  args: { typeId: v.id("contributionTypes"), isActive: v.boolean() },
  handler: async (ctx, { typeId, isActive }) => {
    const admin = await requireTreasurer(ctx);
    await ctx.db.patch(typeId, { isActive });

    await logAction(ctx, {
      userId: admin._id,
      action: "contributionType.setActive",
      entityType: "contributionType",
      entityId: typeId,
      details: { isActive },
    });
  },
});

export const record = mutation({
  args: {
    contributionTypeId: v.id("contributionTypes"),
    memberId: v.id("members"),
    amount: v.number(),
    month: v.optional(v.string()),
    receiptNumber: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await requireTreasurer(ctx);

    if (args.amount <= 0) {
      throw new Error("Enter an amount greater than zero");
    }

    const type = await ctx.db.get(args.contributionTypeId);
    if (!type) throw new Error("Contribution type not found");

    const member = await ctx.db.get(args.memberId);
    if (!member) throw new Error("Member not found");

    const savingsAccount = await ctx.db
      .query("accounts")
      .withIndex("by_member_type", (q) =>
        q.eq("memberId", args.memberId).eq("type", "savings")
      )
      .first();

    if (savingsAccount) {
      const balanceBefore = savingsAccount.balance;
      const balanceAfter = balanceBefore + args.amount;
      await ctx.db.patch(savingsAccount._id, { balance: balanceAfter });

      await ctx.db.insert("transactions", {
        accountId: savingsAccount._id,
        memberId: args.memberId,
        type: "deposit",
        amount: args.amount,
        balanceBefore,
        balanceAfter,
        description: `Contribution — ${type.name}`,
        referenceNumber: generateReferenceNumber(),
        processedBy: admin._id,
        channel: "cash",
        status: "completed",
      });
    }

    const contributionId = await ctx.db.insert("contributions", {
      contributionTypeId: args.contributionTypeId,
      memberId: args.memberId,
      amount: args.amount,
      month: args.month,
      status: "paid",
      paidAt: new Date().toISOString(),
      receiptNumber: args.receiptNumber,
      processedBy: admin._id,
    });

    if (member.userId) {
      await notify(ctx, {
        recipientUserId: member.userId,
        title: "Contribution recorded",
        message: `Your contribution of KES ${args.amount.toLocaleString()} to "${type.name}" has been recorded.`,
        type: "payment_received",
        relatedEntityType: "contribution",
        relatedEntityId: contributionId,
      });
    }

    await logAction(ctx, {
      userId: admin._id,
      action: "contribution.record",
      entityType: "contribution",
      entityId: contributionId,
      details: { contributionTypeId: args.contributionTypeId, amount: args.amount },
    });

    return contributionId;
  },
});
