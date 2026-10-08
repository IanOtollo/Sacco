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

    // Index range + descending order + take(): reads at most 300 rows
    // however large the log grows, instead of loading it all and sorting.
    const start = startDate ? new Date(startDate).getTime() : undefined;
    const end = endDate ? new Date(endDate).getTime() + 24 * 60 * 60 * 1000 : undefined;

    const entries = action
      ? await ctx.db
          .query("auditLog")
          .withIndex("by_action", (q) => {
            const base = q.eq("action", action);
            if (start !== undefined && end !== undefined)
              return base.gte("_creationTime", start).lt("_creationTime", end);
            if (start !== undefined) return base.gte("_creationTime", start);
            if (end !== undefined) return base.lt("_creationTime", end);
            return base;
          })
          .order("desc")
          .take(300)
      : await ctx.db
          .query("auditLog")
          .withIndex("by_creation_time", (q) => {
            if (start !== undefined && end !== undefined)
              return q.gte("_creationTime", start).lt("_creationTime", end);
            if (start !== undefined) return q.gte("_creationTime", start);
            if (end !== undefined) return q.lt("_creationTime", end);
            return q;
          })
          .order("desc")
          .take(300);

    const userIds = [...new Set(entries.map((e) => e.userId))];
    const users = await Promise.all(userIds.map((id) => ctx.db.get(id)));
    const userById = new Map(userIds.map((id, i) => [id, users[i]]));

    return entries.map((e) => ({
      ...e,
      userName: userById.get(e.userId)?.name ?? "—",
    }));
  },
});
