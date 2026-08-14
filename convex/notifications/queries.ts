import { v } from "convex/values";
import { query } from "../_generated/server";
import { requireUser } from "../authz";

export const getMine = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    const caller = await requireUser(ctx);
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_recipient", (q) => q.eq("recipientUserId", caller._id))
      .order("desc")
      .take(limit ?? 50);
    return notifications;
  },
});

export const getUnreadCount = query({
  args: {},
  handler: async (ctx) => {
    const caller = await requireUser(ctx);
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_recipient_read", (q) =>
        q.eq("recipientUserId", caller._id).eq("isRead", false)
      )
      .collect();
    return unread.length;
  },
});
