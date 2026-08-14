import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { logAction } from "./audit";

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    return await ctx.db.get(userId);
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
