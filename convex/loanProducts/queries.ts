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

export const listActive = query({
  args: {},
  handler: async (ctx) => {
    await requireUser(ctx);
    const products = await ctx.db
      .query("loanProducts")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
    return products.sort((a, b) => a.name.localeCompare(b.name));
  },
});

export const getById = query({
  args: { productId: v.id("loanProducts") },
  handler: async (ctx, { productId }) => {
    await requireUser(ctx);
    return await ctx.db.get(productId);
  },
});
