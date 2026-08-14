import { v } from "convex/values";
import { internalAction, internalMutation, internalQuery } from "./_generated/server";
import { createAccount } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import { normalizeNationalId } from "../lib/national-id";

const SUPER_ADMIN_ID = "00000000";
const SUPER_ADMIN_PASSWORD = "ChangeMe123";

// Internal-only: reachable via `npx convex run seed:seedSuperAdmin`, never
// from a browser client. Public exposure of a bootstrap-admin function
// would let anyone create/discover the first super_admin account.
export const findSuperAdmin = internalQuery({
  args: {},
  handler: async (ctx) => {
    const admins = await ctx.db.query("users").collect();
    return admins.find((u) => u.role === "super_admin") ?? null;
  },
});

// One-off bootstrap for local/dev use. Safe to re-run — no-ops if a
// super_admin already exists.
export const seedSuperAdmin = internalAction({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.runQuery(internal.seed.findSuperAdmin, {});
    if (existing) {
      return { created: false, nationalId: SUPER_ADMIN_ID };
    }

    const nationalId = normalizeNationalId(SUPER_ADMIN_ID);

    await createAccount(ctx, {
      provider: "password",
      account: { id: nationalId, secret: SUPER_ADMIN_PASSWORD },
      profile: {
        email: nationalId,
        nationalId,
        name: "Super Admin",
        role: "super_admin",
        isFirstLogin: true,
        isActive: true,
      },
    });

    return {
      created: true,
      nationalId: SUPER_ADMIN_ID,
      password: SUPER_ADMIN_PASSWORD,
    };
  },
});

export const seedLoanProducts = internalMutation({
  args: {},
  handler: async (ctx) => {
    const admins = await ctx.db.query("users").collect();
    const superAdmin = admins.find((u) => u.role === "super_admin");
    if (!superAdmin) throw new Error("Run seedSuperAdmin first");

    const products: {
      name: string;
      code: string;
      description: string;
      interestRate: number;
      interestMethod: "reducing_balance" | "flat_rate";
      minimumAmount: number;
      maximumAmount: number;
      minimumTermMonths: number;
      maximumTermMonths: number;
      requiredGuarantors: number;
    }[] = [
      {
        name: "Normal Loan",
        code: "NRM",
        description: "General-purpose loan for active members.",
        interestRate: 12,
        interestMethod: "reducing_balance",
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
        interestMethod: "flat_rate",
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
        interestMethod: "reducing_balance",
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
        interestMethod: "flat_rate",
        minimumAmount: 5000,
        maximumAmount: 200000,
        minimumTermMonths: 3,
        maximumTermMonths: 12,
        requiredGuarantors: 2,
      },
    ];

    let created = 0;
    for (const product of products) {
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
        createdBy: superAdmin._id,
      });
      created++;
    }

    return { created };
  },
});

// One-off ops utility for correcting a settings value directly (e.g. the
// Sacco's real name arriving after the initial seed already ran and
// seedSaccoSettings's "insert only if missing" guard no longer applies).
// Internal-only, reachable via `npx convex run seed:forceSetSetting`.
export const forceSetSetting = internalMutation({
  args: { key: v.string(), value: v.string() },
  handler: async (ctx, { key, value }) => {
    const admins = await ctx.db.query("users").collect();
    const superAdmin = admins.find((u) => u.role === "super_admin");
    if (!superAdmin) throw new Error("No super admin exists yet");

    const existing = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", key))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { value, updatedBy: superAdmin._id });
    } else {
      await ctx.db.insert("settings", {
        key,
        value,
        description: key,
        updatedBy: superAdmin._id,
      });
    }
  },
});

export const seedSaccoSettings = internalMutation({
  args: {},
  handler: async (ctx) => {
    const admins = await ctx.db.query("users").collect();
    const superAdmin = admins.find((u) => u.role === "super_admin");
    if (!superAdmin) throw new Error("Run seedSuperAdmin first");

    const defaults: Record<string, { value: string; description: string }> = {
      "sacco.name": {
        value: "Edulaepe Credit and Saving",
        description: "Sacco name",
      },
      "financial.minMonthlySavings": {
        value: "500",
        description: "Minimum monthly savings contribution (KES)",
      },
      "financial.minMonthlyShares": {
        value: "200",
        description: "Minimum monthly shares contribution (KES)",
      },
      "financial.registrationFee": {
        value: "1000",
        description: "One-off registration fee (KES)",
      },
    };

    let created = 0;
    for (const [key, def] of Object.entries(defaults)) {
      const existing = await ctx.db
        .query("settings")
        .withIndex("by_key", (q) => q.eq("key", key))
        .first();
      if (existing) continue;

      await ctx.db.insert("settings", {
        key,
        value: def.value,
        description: def.description,
        updatedBy: superAdmin._id,
      });
      created++;
    }

    return { created };
  },
});
