import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { requireMemberProfile, requireTreasurer } from "../authz";
import { logAction } from "../audit";
import { notify } from "../notifications/helpers";
import { creditAccountBalance } from "../accounts/helpers";

const accountTypeValidator = v.union(
  v.literal("savings"),
  v.literal("shares_long_term"),
  v.literal("shares_short_term"),
  v.literal("shares_capital")
);

const channelValidator = v.union(
  v.literal("cash"),
  v.literal("mpesa"),
  v.literal("bank_transfer")
);

const ACCOUNT_TYPE_LABEL: Record<string, string> = {
  savings: "savings",
  shares_long_term: "long-term shares",
  shares_short_term: "short-term shares",
  shares_capital: "capital shares",
};

// Member self-reports a deposit they made — stays pending until the
// treasurer cross-checks the transaction reference and approves it.
export const submit = mutation({
  args: {
    accountType: accountTypeValidator,
    amount: v.number(),
    channel: channelValidator,
    transactionReference: v.string(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const caller = await requireMemberProfile(ctx);

    if (args.amount <= 0) {
      throw new Error("Amount must be greater than zero");
    }
    if (!args.transactionReference.trim()) {
      throw new Error("Enter the M-Pesa or bank transaction reference");
    }

    const claimId = await ctx.db.insert("depositClaims", {
      memberId: caller.memberId!,
      accountType: args.accountType,
      amount: args.amount,
      channel: args.channel,
      transactionReference: args.transactionReference.trim(),
      note: args.note,
      status: "pending",
      submittedBy: caller._id,
    });

    await logAction(ctx, {
      userId: caller._id,
      action: "depositClaim.submit",
      entityType: "depositClaim",
      entityId: claimId,
      details: { accountType: args.accountType, amount: args.amount },
    });

    const staff = await ctx.db.query("users").collect();
    for (const s of staff) {
      const isAdmin = s.role === "admin" || s.role === "super_admin";
      const isTreasurer = s.committeeRole === "treasurer";
      if (isAdmin || isTreasurer) {
        await notify(ctx, {
          recipientUserId: s._id,
          title: "Deposit claim submitted",
          message: `A member reported a deposit of KES ${args.amount.toLocaleString()} to their ${ACCOUNT_TYPE_LABEL[args.accountType]} account — awaiting review.`,
          type: "system",
          relatedEntityType: "depositClaim",
          relatedEntityId: claimId,
          actionUrl: isAdmin ? "/admin/deposit-claims" : "/portal/deposit-claims",
        });
      }
    }

    return { claimId };
  },
});

export const approve = mutation({
  args: { claimId: v.id("depositClaims") },
  handler: async (ctx, { claimId }) => {
    const treasurer = await requireTreasurer(ctx);
    const claim = await ctx.db.get(claimId);
    if (!claim) throw new Error("Deposit claim not found");
    if (claim.status !== "pending") {
      throw new Error("This claim has already been reviewed");
    }

    const member = await ctx.db.get(claim.memberId);
    if (!member) throw new Error("Member not found");

    await creditAccountBalance(ctx, {
      memberId: claim.memberId,
      type: claim.accountType,
      amount: claim.amount,
      channel: claim.channel,
      description: `Deposit claim approved — ref ${claim.transactionReference}`,
      processedBy: treasurer._id,
    });

    await ctx.db.patch(claimId, {
      status: "approved",
      reviewedBy: treasurer._id,
      reviewedAt: new Date().toISOString(),
    });

    await logAction(ctx, {
      userId: treasurer._id,
      action: "depositClaim.approve",
      entityType: "depositClaim",
      entityId: claimId,
      details: { amount: claim.amount, accountType: claim.accountType },
    });

    if (member.userId) {
      await notify(ctx, {
        recipientUserId: member.userId,
        title: "Deposit approved",
        message: `Your deposit of KES ${claim.amount.toLocaleString()} to ${ACCOUNT_TYPE_LABEL[claim.accountType]} has been confirmed and credited.`,
        type: "payment_received",
        relatedEntityType: "depositClaim",
        relatedEntityId: claimId,
      });
    }
  },
});

export const reject = mutation({
  args: { claimId: v.id("depositClaims"), reason: v.string() },
  handler: async (ctx, { claimId, reason }) => {
    const treasurer = await requireTreasurer(ctx);
    const claim = await ctx.db.get(claimId);
    if (!claim) throw new Error("Deposit claim not found");
    if (claim.status !== "pending") {
      throw new Error("This claim has already been reviewed");
    }

    await ctx.db.patch(claimId, {
      status: "rejected",
      reviewedBy: treasurer._id,
      reviewedAt: new Date().toISOString(),
      rejectionReason: reason,
    });

    await logAction(ctx, {
      userId: treasurer._id,
      action: "depositClaim.reject",
      entityType: "depositClaim",
      entityId: claimId,
      details: { reason },
    });

    const member = await ctx.db.get(claim.memberId);
    if (member?.userId) {
      await notify(ctx, {
        recipientUserId: member.userId,
        title: "Deposit claim declined",
        message: `Your deposit claim of KES ${claim.amount.toLocaleString()} was declined: ${reason}`,
        type: "system",
        relatedEntityType: "depositClaim",
        relatedEntityId: claimId,
      });
    }
  },
});

// Treasurer/admin records a deposit directly — no need to wait on a member
// to submit a claim first. Inserted already "approved" so it still shows
// up in the same review history.
export const recordDirect = mutation({
  args: {
    memberId: v.id("members"),
    accountType: accountTypeValidator,
    amount: v.number(),
    channel: channelValidator,
    transactionReference: v.string(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const treasurer = await requireTreasurer(ctx);

    if (args.amount <= 0) {
      throw new Error("Amount must be greater than zero");
    }

    const member = await ctx.db.get(args.memberId);
    if (!member) throw new Error("Member not found");

    await creditAccountBalance(ctx, {
      memberId: args.memberId,
      type: args.accountType,
      amount: args.amount,
      channel: args.channel,
      description: `Deposit recorded by treasurer — ref ${args.transactionReference}`,
      processedBy: treasurer._id,
    });

    const claimId = await ctx.db.insert("depositClaims", {
      memberId: args.memberId,
      accountType: args.accountType,
      amount: args.amount,
      channel: args.channel,
      transactionReference: args.transactionReference.trim(),
      note: args.note,
      status: "approved",
      submittedBy: treasurer._id,
      reviewedBy: treasurer._id,
      reviewedAt: new Date().toISOString(),
    });

    await logAction(ctx, {
      userId: treasurer._id,
      action: "depositClaim.recordDirect",
      entityType: "depositClaim",
      entityId: claimId,
      details: { amount: args.amount, accountType: args.accountType },
    });

    if (member.userId) {
      await notify(ctx, {
        recipientUserId: member.userId,
        title: "Deposit recorded",
        message: `KES ${args.amount.toLocaleString()} has been credited to your ${ACCOUNT_TYPE_LABEL[args.accountType]} account.`,
        type: "payment_received",
        relatedEntityType: "depositClaim",
        relatedEntityId: claimId,
      });
    }

    return { claimId };
  },
});
