import { internalMutation } from "../_generated/server";

const SIX_MONTHS_MS = 6 * 30 * 24 * 60 * 60 * 1000;

export const checkDormantAccounts = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - SIX_MONTHS_MS;

    const activeMembers = await ctx.db
      .query("members")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    for (const member of activeMembers) {
      const recentTransaction = await ctx.db
        .query("transactions")
        .withIndex("by_member", (q) => q.eq("memberId", member._id))
        .order("desc")
        .first();

      const lastActivity = recentTransaction?._creationTime ?? member._creationTime;
      if (lastActivity < cutoff) {
        await ctx.db.patch(member._id, { status: "dormant" });
      }
    }
  },
});
