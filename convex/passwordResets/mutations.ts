import { v } from "convex/values";
import { mutation, action, internalMutation, internalQuery } from "../_generated/server";
import { modifyAccountCredentials } from "@convex-dev/auth/server";
import { requireAdmin, requireAdminInAction } from "../authz";
import { normalizeNationalId } from "../../lib/national-id";
import { generateDefaultPassword } from "../members/helpers";
import { logAction, logSystemAction } from "../audit";
import { notify } from "../notifications/helpers";
import { internal } from "../_generated/api";

// Public, unauthenticated — reachable from the logged-out login screen.
// Always returns the same generic result regardless of whether the ID
// matched an account, so the endpoint can't be used to enumerate members.
export const requestReset = mutation({
  args: {
    nationalId: v.string(),
    note: v.optional(v.string()),
    // Honeypot — real users never see or fill this field; bots that
    // auto-fill every input do. Silently no-op if it's non-empty.
    website: v.optional(v.string()),
  },
  returns: v.object({ ok: v.boolean() }),
  handler: async (ctx, { nationalId, note, website }) => {
    if (website) {
      return { ok: true };
    }

    let normalized: string;
    try {
      normalized = normalizeNationalId(nationalId);
    } catch {
      return { ok: true };
    }

    const member = await ctx.db
      .query("members")
      .withIndex("by_nationalId", (q) => q.eq("nationalId", normalized))
      .first();

    if (!member || !member.userId) {
      return { ok: true };
    }

    const existingPending = await ctx.db
      .query("passwordResetRequests")
      .withIndex("by_member", (q) => q.eq("memberId", member._id))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .first();

    if (!existingPending) {
      const requestId = await ctx.db.insert("passwordResetRequests", {
        memberId: member._id,
        nationalId: normalized,
        note,
        status: "pending",
      });

      await logSystemAction(ctx, {
        action: "passwordReset.request",
        entityType: "passwordResetRequest",
        entityId: requestId,
        details: { memberId: member._id },
      });

      const admins = await ctx.db.query("users").collect();
      for (const admin of admins) {
        if (admin.role === "super_admin" || admin.role === "admin") {
          await notify(ctx, {
            recipientUserId: admin._id,
            title: "Password reset request",
            message: `${member.firstName} ${member.lastName} (${member.memberNumber}) requested a password reset.`,
            type: "system",
            relatedEntityType: "member",
            relatedEntityId: member._id,
          });
        }
      }
    }

    return { ok: true };
  },
});

export const getRequestForReview = internalQuery({
  args: { requestId: v.id("passwordResetRequests") },
  handler: async (ctx, { requestId }) => {
    const request = await ctx.db.get(requestId);
    if (!request) return null;
    const member = await ctx.db.get(request.memberId);
    if (!member || !member.userId) return null;
    const user = await ctx.db.get(member.userId);
    if (!user || !user.email) return null;
    return { request, member, user };
  },
});

export const finalizeApproval = internalMutation({
  args: {
    requestId: v.id("passwordResetRequests"),
    reviewedBy: v.id("users"),
  },
  handler: async (ctx, { requestId, reviewedBy }) => {
    const request = await ctx.db.get(requestId);
    if (!request) throw new Error("Request not found");

    await ctx.db.patch(requestId, {
      status: "approved",
      reviewedBy,
      reviewedAt: new Date().toISOString(),
    });

    const member = await ctx.db.get(request.memberId);
    if (member?.userId) {
      await ctx.db.patch(member.userId, { isFirstLogin: true });
      await notify(ctx, {
        recipientUserId: member.userId,
        title: "Password reset approved",
        message:
          "Your password reset was approved. Contact your Sacco administrator for your new temporary password.",
        type: "system",
        relatedEntityType: "member",
        relatedEntityId: member._id,
      });
    }

    await logAction(ctx, {
      userId: reviewedBy,
      action: "passwordReset.approve",
      entityType: "passwordResetRequest",
      entityId: requestId,
      details: { memberId: request.memberId },
    });
  },
});

// Runs as an action because rotating the auth credential requires action
// context, same reason members.mutations.registerMember is an action.
export const approve = action({
  args: { requestId: v.id("passwordResetRequests") },
  returns: v.object({ nationalId: v.string(), password: v.string() }),
  handler: async (ctx, { requestId }): Promise<{ nationalId: string; password: string }> => {
    const admin = await requireAdminInAction(ctx);

    const found = await ctx.runQuery(
      internal.passwordResets.mutations.getRequestForReview,
      { requestId }
    );
    if (!found) throw new Error("Request not found or already resolved");
    if (found.request.status !== "pending") {
      throw new Error("This request has already been reviewed");
    }

    const password = generateDefaultPassword();

    await modifyAccountCredentials(ctx, {
      provider: "password",
      account: { id: found.user.email!, secret: password },
    });

    await ctx.runMutation(internal.passwordResets.mutations.finalizeApproval, {
      requestId,
      reviewedBy: admin._id,
    });

    return { nationalId: found.member.nationalId, password };
  },
});

export const reject = mutation({
  args: { requestId: v.id("passwordResetRequests"), reason: v.string() },
  handler: async (ctx, { requestId, reason }) => {
    const admin = await requireAdmin(ctx);
    const request = await ctx.db.get(requestId);
    if (!request) throw new Error("Request not found");
    if (request.status !== "pending") {
      throw new Error("This request has already been reviewed");
    }

    await ctx.db.patch(requestId, {
      status: "rejected",
      reviewedBy: admin._id,
      reviewedAt: new Date().toISOString(),
      rejectionReason: reason,
    });

    const member = await ctx.db.get(request.memberId);
    if (member?.userId) {
      await notify(ctx, {
        recipientUserId: member.userId,
        title: "Password reset declined",
        message: `Your password reset request was declined: ${reason}`,
        type: "system",
        relatedEntityType: "member",
        relatedEntityId: member._id,
      });
    }

    await logAction(ctx, {
      userId: admin._id,
      action: "passwordReset.reject",
      entityType: "passwordResetRequest",
      entityId: requestId,
      details: { memberId: request.memberId, reason },
    });
  },
});
