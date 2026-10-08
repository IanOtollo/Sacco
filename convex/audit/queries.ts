import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { query } from "../_generated/server";
import { requireAdmin } from "../authz";

export const list = query({
  args: {
    paginationOpts: paginationOptsValidator,
    action: v.optional(v.string()),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
  },
  handler: async (ctx, { paginationOpts, action, startDate, endDate }) => {
    await requireAdmin(ctx);

    // Index range + descending order + pagination: each page reads only its
    // own rows, so the log can grow without slowing the page down.
    const start = startDate ? new Date(startDate).getTime() : undefined;
    const end = endDate ? new Date(endDate).getTime() + 24 * 60 * 60 * 1000 : undefined;

    const result = action
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
          .paginate(paginationOpts)
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
          .paginate(paginationOpts);

    const entries = result.page;
    const userIds = [...new Set(entries.map((e) => e.userId))];
    const users = await Promise.all(userIds.map((id) => ctx.db.get(id)));
    const userById = new Map(userIds.map((id, i) => [id, users[i]]));

    return {
      ...result,
      page: entries.map((e) => ({
        ...e,
        userName: userById.get(e.userId)?.name ?? "—",
      })),
    };
  },
});
