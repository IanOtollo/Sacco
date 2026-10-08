import { internalMutation, MutationCtx } from "../_generated/server";

type AccountType = "savings" | "shares_long_term" | "shares_short_term" | "shares_capital";

const FIELD: Record<AccountType, "savings" | "sharesLongTerm" | "sharesShortTerm" | "sharesCapital"> = {
  savings: "savings",
  shares_long_term: "sharesLongTerm",
  shares_short_term: "sharesShortTerm",
  shares_capital: "sharesCapital",
};

// Running totals of every member balance by account type, so the admin
// dashboard reads one small row instead of summing every account. Every
// place that changes an account balance calls adjustPool with the delta in
// the same mutation (so it's transactional); reconcilePools recomputes from
// the accounts hourly and corrects any drift.
export async function adjustPool(ctx: MutationCtx, type: AccountType, delta: number) {
  if (delta === 0) return;
  const row = await ctx.db
    .query("poolTotals")
    .withIndex("by_key", (q) => q.eq("key", "main"))
    .first();
  // No row yet — the first reconcile creates it from the accounts.
  if (!row) return;
  const field = FIELD[type];
  await ctx.db.patch(row._id, {
    [field]: Math.round((row[field] + delta) * 100) / 100,
  });
}

export const reconcilePools = internalMutation({
  args: {},
  handler: async (ctx) => {
    const accounts = await ctx.db.query("accounts").collect();
    const totals = { savings: 0, sharesLongTerm: 0, sharesShortTerm: 0, sharesCapital: 0 };
    for (const a of accounts) totals[FIELD[a.type as AccountType]] += a.balance;
    for (const k of Object.keys(totals) as (keyof typeof totals)[]) {
      totals[k] = Math.round(totals[k] * 100) / 100;
    }

    const row = await ctx.db
      .query("poolTotals")
      .withIndex("by_key", (q) => q.eq("key", "main"))
      .first();
    if (row) await ctx.db.patch(row._id, totals);
    else await ctx.db.insert("poolTotals", { key: "main", ...totals });
  },
});
