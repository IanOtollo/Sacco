import { v } from "convex/values";
import { query } from "../_generated/server";
import { requireTreasurer, requireUser } from "../authz";

export const listTypes = query({
  args: {},
  handler: async (ctx) => {
    await requireTreasurer(ctx);
    const types = await ctx.db.query("contributionTypes").collect();

    const withStats = await Promise.all(
      types.map(async (t) => {
        const contributions = await ctx.db
          .query("contributions")
          .withIndex("by_type", (q) => q.eq("contributionTypeId", t._id))
          .collect();
        const totalCollected = contributions.reduce((s, c) => s + c.amount, 0);
        const memberCount = new Set(contributions.map((c) => c.memberId)).size;
        return {
          ...t,
          totalCollected,
          memberCount,
          contributionCount: contributions.length,
        };
      })
    );

    return withStats.sort((a, b) => b._creationTime - a._creationTime);
  },
});

export const getType = query({
  args: { typeId: v.id("contributionTypes") },
  handler: async (ctx, { typeId }) => {
    await requireTreasurer(ctx);
    return await ctx.db.get(typeId);
  },
});

export const listByType = query({
  args: { typeId: v.id("contributionTypes") },
  handler: async (ctx, { typeId }) => {
    await requireTreasurer(ctx);
    const contributions = await ctx.db
      .query("contributions")
      .withIndex("by_type", (q) => q.eq("contributionTypeId", typeId))
      .collect();

    contributions.sort((a, b) => b._creationTime - a._creationTime);

    return await Promise.all(
      contributions.map(async (c) => {
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

async function assertCanViewMember(
  ctx: Parameters<typeof requireUser>[0],
  memberId: string
) {
  const caller = await requireUser(ctx);
  const isSelf = caller.role === "member" && caller.memberId === memberId;
  const isAdmin = caller.role === "admin" || caller.role === "super_admin";
  if (!isSelf && !isAdmin) throw new Error("Not authorized");
}

export const getByMember = query({
  args: { memberId: v.id("members") },
  handler: async (ctx, { memberId }) => {
    await assertCanViewMember(ctx, memberId);
    const contributions = await ctx.db
      .query("contributions")
      .withIndex("by_member", (q) => q.eq("memberId", memberId))
      .collect();

    contributions.sort((a, b) => b._creationTime - a._creationTime);

    return await Promise.all(
      contributions.map(async (c) => {
        const type = await ctx.db.get(c.contributionTypeId);
        return { ...c, typeName: type?.name ?? "—" };
      })
    );
  },
});
