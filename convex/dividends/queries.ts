import { v } from "convex/values";
import { query } from "../_generated/server";
import { requireTreasurer, requireUser } from "../authz";

export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireTreasurer(ctx);
    const dividends = await ctx.db.query("dividends").collect();
    return dividends.sort((a, b) => b._creationTime - a._creationTime);
  },
});

export const getPayouts = query({
  args: { dividendId: v.id("dividends") },
  handler: async (ctx, { dividendId }) => {
    await requireTreasurer(ctx);
    const payouts = await ctx.db
      .query("dividendPayouts")
      .withIndex("by_dividend", (q) => q.eq("dividendId", dividendId))
      .collect();

    return await Promise.all(
      payouts.map(async (p) => {
        const member = await ctx.db.get(p.memberId);
        return {
          ...p,
          memberName: member ? `${member.firstName} ${member.lastName}` : "—",
          memberNumber: member?.memberNumber ?? "—",
        };
      })
    );
  },
});

export const getMyPayouts = query({
  args: {},
  handler: async (ctx) => {
    const caller = await requireUser(ctx);
    if (!caller.memberId) return [];
    const payouts = await ctx.db
      .query("dividendPayouts")
      .withIndex("by_member", (q) => q.eq("memberId", caller.memberId!))
      .collect();

    return await Promise.all(
      payouts.map(async (p) => {
        const dividend = await ctx.db.get(p.dividendId);
        return { ...p, financialYear: dividend?.financialYear ?? "—" };
      })
    );
  },
});
