import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { requireUser } from "../authz";

export const markRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, { notificationId }) => {
    const caller = await requireUser(ctx);
    const notification = await ctx.db.get(notificationId);
    if (!notification || notification.recipientUserId !== caller._id) {
      throw new Error("Not authorized");
    }
    await ctx.db.patch(notificationId, { isRead: true });
  },
});

export const markAllRead = mutation({
  args: {},
  handler: async (ctx) => {
    const caller = await requireUser(ctx);
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_recipient_read", (q) =>
        q.eq("recipientUserId", caller._id).eq("isRead", false)
      )
      .collect();
    for (const n of unread) {
      await ctx.db.patch(n._id, { isRead: true });
    }
  },
});
