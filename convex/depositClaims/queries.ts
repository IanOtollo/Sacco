import { query } from "../_generated/server";
import { requireMemberProfile, requireTreasurer } from "../authz";

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const caller = await requireMemberProfile(ctx);
    const claims = await ctx.db
      .query("depositClaims")
      .withIndex("by_member", (q) => q.eq("memberId", caller.memberId!))
      .order("desc")
      .take(100);
    return claims;
  },
});

export const listPending = query({
  args: {},
  handler: async (ctx) => {
    await requireTreasurer(ctx);
    const claims = await ctx.db
      .query("depositClaims")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .order("desc")
      .collect();

    return await Promise.all(
      claims.map(async (c) => {
        const member = await ctx.db.get(c.memberId);
        return {
          ...c,
          memberName: member ? `${member.firstName} ${member.lastName}` : "—",
          memberNumber: member?.memberNumber ?? "—",
        };
      })
    );
  },
});

export const countPending = query({
  args: {},
  handler: async (ctx) => {
    await requireTreasurer(ctx);
    const claims = await ctx.db
      .query("depositClaims")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();
    return claims.length;
  },
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    await requireTreasurer(ctx);
    // Newest 500 only, so the page stays fast as history accumulates.
    const sorted = await ctx.db.query("depositClaims").order("desc").take(500);

    return await Promise.all(
      sorted.map(async (c) => {
        const member = await ctx.db.get(c.memberId);
        return {
          ...c,
          memberName: member ? `${member.firstName} ${member.lastName}` : "—",
          memberNumber: member?.memberNumber ?? "—",
        };
      })
    );
  },
});
