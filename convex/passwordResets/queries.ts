import { query } from "../_generated/server";
import { requireAdmin } from "../authz";

export const listPending = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const requests = await ctx.db
      .query("passwordResetRequests")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .order("desc")
      .collect();

    return await Promise.all(
      requests.map(async (r) => {
        const member = await ctx.db.get(r.memberId);
        return {
          ...r,
          memberName: member ? `${member.firstName} ${member.lastName}` : "—",
          memberNumber: member?.memberNumber ?? "—",
        };
      })
    );
  },
});
