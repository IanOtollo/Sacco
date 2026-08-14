import { v } from "convex/values";
import { query } from "../_generated/server";
import { requireAdmin, requireUser } from "../authz";

function currentMonthString(): string {
  return new Date().toISOString().slice(0, 7);
}

export const getByMonth = query({
  args: { month: v.string() },
  handler: async (ctx, { month }) => {
    await requireAdmin(ctx);

    const members = await ctx.db
      .query("members")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    const contributions = await ctx.db
      .query("contributions")
      .withIndex("by_month", (q) => q.eq("month", month))
      .collect();

    const byMember = new Map(contributions.map((c) => [c.memberId, c]));
    const isPastMonth = month < currentMonthString();

    return members
      .map((m) => {
        const c = byMember.get(m._id);
        return {
          memberId: m._id,
          memberNumber: m.memberNumber,
          name: `${m.firstName} ${m.lastName}`,
          savingsAmount: c?.savingsAmount ?? 0,
          sharesAmount: c?.sharesAmount ?? 0,
          totalAmount: c?.totalAmount ?? 0,
          status: c ? c.status : isPastMonth ? "defaulted" : "pending",
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
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
    return contributions.sort((a, b) => b.month.localeCompare(a.month));
  },
});
