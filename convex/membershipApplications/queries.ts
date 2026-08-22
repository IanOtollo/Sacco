import { query } from "../_generated/server";
import { requireAdmin } from "../authz";

export const countPending = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const applications = await ctx.db
      .query("membershipApplications")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();
    return applications.length;
  },
});

export const listPending = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const applications = await ctx.db
      .query("membershipApplications")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .order("desc")
      .collect();

    return await Promise.all(
      applications.map(async (a) => {
        const invitor = a.invitorMemberId ? await ctx.db.get(a.invitorMemberId) : null;
        return {
          ...a,
          invitorName: invitor ? `${invitor.firstName} ${invitor.lastName}` : null,
          invitorMemberNumber: invitor?.memberNumber ?? null,
        };
      })
    );
  },
});
