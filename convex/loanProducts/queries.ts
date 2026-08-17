import { v } from "convex/values";
import { query } from "../_generated/server";
import { requireAdmin, requireUser } from "../authz";

export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const products = await ctx.db.query("loanProducts").collect();
    return products.sort((a, b) => a.name.localeCompare(b.name));
  },
});

// Used only by the member self-service loan application form — excludes
// the internal "Non-Member Loan" placeholder product (code NMEM), which
// exists solely to satisfy loans.productId for admin-issued non-member
// loans and isn't something a member should ever pick themselves.
export const listActive = query({
  args: {},
  handler: async (ctx) => {
    await requireUser(ctx);
    const products = await ctx.db
      .query("loanProducts")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
    return products
      .filter((p) => p.code !== "NMEM")
      .sort((a, b) => a.name.localeCompare(b.name));
  },
});

export const getById = query({
  args: { productId: v.id("loanProducts") },
  handler: async (ctx, { productId }) => {
    await requireUser(ctx);
    return await ctx.db.get(productId);
  },
});
