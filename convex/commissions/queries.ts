import { query } from "../_generated/server";
import { requireMemberProfile } from "../authz";

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export const getMySummary = query({
  args: {},
  handler: async (ctx) => {
    const caller = await requireMemberProfile(ctx);
    const rows = await ctx.db
      .query("commissions")
      .withIndex("by_member", (q) => q.eq("memberId", caller.memberId!))
      .collect();

    let pending = 0;
    let redeemed = 0;
    for (const row of rows) {
      if (row.status === "pending") pending = round2(pending + row.amount);
      else redeemed = round2(redeemed + row.amount);
    }

    return { pending, redeemed, total: round2(pending + redeemed) };
  },
});

export const getMyHistory = query({
  args: {},
  handler: async (ctx) => {
    const caller = await requireMemberProfile(ctx);
    const rows = await ctx.db
      .query("commissions")
      .withIndex("by_member", (q) => q.eq("memberId", caller.memberId!))
      .collect();

    rows.sort((a, b) => b._creationTime - a._creationTime);

    return await Promise.all(
      rows.map(async (r) => {
        const relatedMember = r.relatedMemberId ? await ctx.db.get(r.relatedMemberId) : null;
        return {
          ...r,
          relatedMemberName: relatedMember
            ? `${relatedMember.firstName} ${relatedMember.lastName}`
            : null,
        };
      })
    );
  },
});
