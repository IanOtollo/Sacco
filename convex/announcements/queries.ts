import { query } from "../_generated/server";
import { requireAdmin, requireUser } from "../authz";

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const announcements = await ctx.db.query("announcements").collect();
    return announcements.sort((a, b) => b._creationTime - a._creationTime);
  },
});

export const listForMe = query({
  args: {},
  handler: async (ctx) => {
    const caller = await requireUser(ctx);
    const published = await ctx.db
      .query("announcements")
      .withIndex("by_published", (q) => q.eq("isPublished", true))
      .collect();

    const now = new Date().toISOString();
    const visible = published.filter((a) => {
      const matchesAudience =
        a.targetAudience === "all" ||
        (a.targetAudience === "members" && caller.role === "member") ||
        (a.targetAudience === "admins" &&
          (caller.role === "admin" || caller.role === "super_admin"));
      const notExpired = !a.expiresAt || a.expiresAt > now;
      return matchesAudience && notExpired;
    });

    return visible.sort((a, b) => b._creationTime - a._creationTime);
  },
});
