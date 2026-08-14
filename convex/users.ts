import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { logAction } from "./audit";
import { requireUser } from "./authz";

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    return await ctx.db.get(userId);
  },
});

// Called once by the client right after a successful sign-in, so every
// login leaves an audit footprint (Convex Auth's own sign-in flow has no
// hook to log from server-side).
export const recordLogin = mutation({
  args: {},
  handler: async (ctx) => {
    const caller = await requireUser(ctx);
    await logAction(ctx, {
      userId: caller._id,
      action: "auth.login",
      entityType: "user",
      entityId: caller._id,
      details: {},
    });
  },
});

export const setFirstLoginComplete = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    await ctx.db.patch(userId, { isFirstLogin: false });
  },
});

export const logPinChange = internalMutation({
  args: { userId: v.id("users"), action: v.string() },
  handler: async (ctx, { userId, action }) => {
    await logAction(ctx, {
      userId,
      action,
      entityType: "user",
      entityId: userId,
      details: {},
    });
  },
});
