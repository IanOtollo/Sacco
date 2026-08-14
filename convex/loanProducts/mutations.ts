import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { requireAdmin } from "../authz";
import { logAction } from "../audit";

const productFields = {
  name: v.string(),
  code: v.string(),
  description: v.string(),
  interestRate: v.number(),
  interestMethod: v.union(
    v.literal("reducing_balance"),
    v.literal("flat_rate")
  ),
  minimumAmount: v.number(),
  maximumAmount: v.number(),
  minimumTermMonths: v.number(),
  maximumTermMonths: v.number(),
  requiredGuarantors: v.number(),
  maxLoanToSavingsRatio: v.number(),
  processingFeePercent: v.number(),
  insuranceFeePercent: v.optional(v.number()),
  gracePeriodDays: v.number(),
  penaltyRatePercent: v.number(),
};

export const create = mutation({
  args: productFields,
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);

    const existing = await ctx.db
      .query("loanProducts")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .first();
    if (existing) throw new Error(`A product with code ${args.code} already exists`);

    const productId = await ctx.db.insert("loanProducts", {
      ...args,
      minimumTermMonths: BigInt(args.minimumTermMonths),
      maximumTermMonths: BigInt(args.maximumTermMonths),
      requiredGuarantors: BigInt(args.requiredGuarantors),
      gracePeriodDays: BigInt(args.gracePeriodDays),
      isActive: true,
      createdBy: admin._id,
    });

    await logAction(ctx, {
      userId: admin._id,
      action: "loanProduct.create",
      entityType: "loanProduct",
      entityId: productId,
      details: { name: args.name, code: args.code },
    });

    return productId;
  },
});

export const update = mutation({
  args: {
    productId: v.id("loanProducts"),
    ...productFields,
  },
  handler: async (ctx, { productId, ...args }) => {
    const admin = await requireAdmin(ctx);
    const product = await ctx.db.get(productId);
    if (!product) throw new Error("Loan product not found");

    await ctx.db.patch(productId, {
      ...args,
      minimumTermMonths: BigInt(args.minimumTermMonths),
      maximumTermMonths: BigInt(args.maximumTermMonths),
      requiredGuarantors: BigInt(args.requiredGuarantors),
      gracePeriodDays: BigInt(args.gracePeriodDays),
    });

    await logAction(ctx, {
      userId: admin._id,
      action: "loanProduct.update",
      entityType: "loanProduct",
      entityId: productId,
      details: args,
    });
  },
});

export const setActive = mutation({
  args: { productId: v.id("loanProducts"), isActive: v.boolean() },
  handler: async (ctx, { productId, isActive }) => {
    const admin = await requireAdmin(ctx);
    await ctx.db.patch(productId, { isActive });

    await logAction(ctx, {
      userId: admin._id,
      action: "loanProduct.setActive",
      entityType: "loanProduct",
      entityId: productId,
      details: { isActive },
    });
  },
});

const DEFAULT_PRODUCTS = [
  {
    name: "Normal Loan",
    code: "NRM",
    description: "General-purpose loan for active members.",
    interestRate: 12,
    interestMethod: "reducing_balance" as const,
    minimumAmount: 5000,
    maximumAmount: 500000,
    minimumTermMonths: 3,
    maximumTermMonths: 36,
    requiredGuarantors: 2,
  },
  {
    name: "Emergency Loan",
    code: "EMG",
    description: "Fast-tracked loan for urgent, unplanned needs.",
    interestRate: 10,
    interestMethod: "flat_rate" as const,
    minimumAmount: 1000,
    maximumAmount: 50000,
    minimumTermMonths: 1,
    maximumTermMonths: 6,
    requiredGuarantors: 1,
  },
  {
    name: "Development Loan",
    code: "DEV",
    description: "Larger loan for long-term development projects.",
    interestRate: 14,
    interestMethod: "reducing_balance" as const,
    minimumAmount: 10000,
    maximumAmount: 1000000,
    minimumTermMonths: 6,
    maximumTermMonths: 60,
    requiredGuarantors: 3,
  },
  {
    name: "School Fees Loan",
    code: "SCH",
    description: "Short-term loan to cover school fees.",
    interestRate: 8,
    interestMethod: "flat_rate" as const,
    minimumAmount: 5000,
    maximumAmount: 200000,
    minimumTermMonths: 3,
    maximumTermMonths: 12,
    requiredGuarantors: 2,
  },
];

export const seedDefaults = mutation({
  args: {},
  handler: async (ctx) => {
    const admin = await requireAdmin(ctx);
    let created = 0;

    for (const product of DEFAULT_PRODUCTS) {
      const existing = await ctx.db
        .query("loanProducts")
        .withIndex("by_code", (q) => q.eq("code", product.code))
        .first();
      if (existing) continue;

      await ctx.db.insert("loanProducts", {
        ...product,
        minimumTermMonths: BigInt(product.minimumTermMonths),
        maximumTermMonths: BigInt(product.maximumTermMonths),
        requiredGuarantors: BigInt(product.requiredGuarantors),
        maxLoanToSavingsRatio: 3,
        processingFeePercent: 1,
        insuranceFeePercent: 0.5,
        gracePeriodDays: BigInt(30),
        penaltyRatePercent: 5,
        isActive: true,
        createdBy: admin._id,
      });
      created++;
    }

    await logAction(ctx, {
      userId: admin._id,
      action: "loanProduct.seedDefaults",
      entityType: "loanProduct",
      entityId: "bulk",
      details: { created },
    });

    return { created };
  },
});
