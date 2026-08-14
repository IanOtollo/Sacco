import { v } from "convex/values";
import { query } from "../_generated/server";
import { requireUser } from "../authz";

async function assertCanViewMember(
  ctx: Parameters<typeof requireUser>[0],
  memberId: string
) {
  const caller = await requireUser(ctx);
  const isSelf = caller.role === "member" && caller.memberId === memberId;
  const isAdmin = caller.role === "admin" || caller.role === "super_admin";
  if (!isSelf && !isAdmin) {
    throw new Error("Not authorized");
  }
  return caller;
}

export const getByMember = query({
  args: { memberId: v.id("members") },
  handler: async (ctx, { memberId }) => {
    await assertCanViewMember(ctx, memberId);
    return await ctx.db
      .query("accounts")
      .withIndex("by_member", (q) => q.eq("memberId", memberId))
      .collect();
  },
});

export const getStatement = query({
  args: { accountId: v.id("accounts"), limit: v.optional(v.number()) },
  handler: async (ctx, { accountId, limit }) => {
    const account = await ctx.db.get(accountId);
    if (!account) return [];
    await assertCanViewMember(ctx, account.memberId);

    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_account", (q) => q.eq("accountId", accountId))
      .order("desc")
      .take(limit ?? 50);

    return transactions;
  },
});
