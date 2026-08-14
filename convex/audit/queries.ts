import { v } from "convex/values";
import { query } from "../_generated/server";
import { requireAdmin } from "../authz";

export const list = query({
  args: {
    action: v.optional(v.string()),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
  },
  handler: async (ctx, { action, startDate, endDate }) => {
    await requireAdmin(ctx);

    let entries = action
      ? await ctx.db
          .query("auditLog")
          .withIndex("by_action", (q) => q.eq("action", action))
          .collect()
      : await ctx.db.query("auditLog").collect();

    if (startDate) {
      const start = new Date(startDate).getTime();
      entries = entries.filter((e) => e._creationTime >= start);
    }
    if (endDate) {
      const end = new Date(endDate).getTime() + 24 * 60 * 60 * 1000;
      entries = entries.filter((e) => e._creationTime < end);
    }

    entries.sort((a, b) => b._creationTime - a._creationTime);
    entries = entries.slice(0, 300);

    const userIds = [...new Set(entries.map((e) => e.userId))];
    const users = await Promise.all(userIds.map((id) => ctx.db.get(id)));
    const userById = new Map(userIds.map((id, i) => [id, users[i]]));

    return entries.map((e) => ({
      ...e,
      userName: userById.get(e.userId)?.name ?? "—",
    }));
  },
});
