import { v } from "convex/values";
import { internalAction, internalMutation, internalQuery } from "./_generated/server";
import { createAccount, modifyAccountCredentials } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import { normalizeNationalId } from "../lib/national-id";
import { generateMemberNumber } from "./members/helpers";
import { logAction } from "./audit";

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

// One-off migration for a super admin account created back when login was
// phone+PIN — repoints their auth account onto a National ID + password so
// they aren't locked out after the switch to National ID-based login.
// Reachable via `npx convex run seed:migrateSuperAdminCredential`.
export const migrateSuperAdminCredential = internalAction({
  args: {},
  returns: v.object({ nationalId: v.string(), password: v.string() }),
  handler: async (ctx): Promise<{ nationalId: string; password: string }> => {
    const superAdmin = await ctx.runQuery(internal.seed.findSuperAdmin, {});
    if (!superAdmin) throw new Error("No super admin found");
    if (!superAdmin.email) throw new Error("Super admin has no auth identifier on file");

    const nationalId = normalizeNationalId(SUPER_ADMIN_ID);

    // modifyAccountCredentials can only rotate the secret, not the account
    // id, so set the new password against the existing (old-identifier)
    // account first, then repoint the id in a separate step.
    await modifyAccountCredentials(ctx, {
      provider: "password",
      account: { id: superAdmin.email, secret: SUPER_ADMIN_PASSWORD },
    });

    await ctx.runMutation(internal.seed.repointAccountId, {
      userId: superAdmin._id,
      newId: nationalId,
    });

    return { nationalId: SUPER_ADMIN_ID, password: SUPER_ADMIN_PASSWORD };
  },
});

export const repointAccountId = internalMutation({
  args: { userId: v.id("users"), newId: v.string() },
  handler: async (ctx, { userId, newId }) => {
    const account = await ctx.db
      .query("authAccounts")
      .withIndex("userIdAndProvider", (q) =>
        q.eq("userId", userId).eq("provider", "password")
      )
      .first();
    if (!account) throw new Error("No password auth account found for this user");

    await ctx.db.patch(account._id, { providerAccountId: newId });
    await ctx.db.patch(userId, { email: newId, nationalId: newId });
  },
});

// One-off cleanup for test signups — deletes a membership application, its
// linked (never-approved) auth account, and any auth sessions/tokens tied
// to it. Reachable via `npx convex run seed:deleteTestApplication`.
export const deleteTestApplication = internalMutation({
  args: { applicationId: v.id("membershipApplications") },
  handler: async (ctx, { applicationId }) => {
    const application = await ctx.db.get(applicationId);
    if (!application) throw new Error("Application not found");

    const userId = application.userId;

    const accounts = await ctx.db
      .query("authAccounts")
      .withIndex("userIdAndProvider", (q) => q.eq("userId", userId))
      .collect();
    for (const account of accounts) {
      await ctx.db.delete(account._id);
    }

    const sessions = await ctx.db
      .query("authSessions")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .collect();
    for (const session of sessions) {
      await ctx.db.delete(session._id);
    }

    const notifications = await ctx.db.query("notifications").collect();
    for (const n of notifications) {
      if (n.relatedEntityId === applicationId) {
        await ctx.db.delete(n._id);
      }
    }

    await ctx.db.delete(applicationId);
    await ctx.db.delete(userId);

    return { deleted: true };
  },
});

// One-off: delete a single notification by id (used for cleaning up stray
// notifications left over from deleted test data).
export const deleteNotification = internalMutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, { notificationId }) => {
    await ctx.db.delete(notificationId);
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

// One-off migration for the new interest rules: every member loan product
// now charges a flat 10% of principal regardless of which product or term
// is chosen (previously each product had its own rate/method). Also seeds
// a placeholder "Non-Member Loan" product — Emergency and Development
// non-member loans are priced per lib/loan-calc.ts
// resolveEmergencyLoanRate/resolveDevelopmentLoanRate rather than a
// product-configured rate, but loans.productId is still required, so this
// product exists to satisfy that reference; its own interestRate field is
// unused for non-member loans (interestMethod "flat_total" is used for
// Development loan installment schedules).
// Internal-only, reachable via `npx convex run seed:applyFlatInterestRules`.
export const applyFlatInterestRules = internalMutation({
  args: {},
  handler: async (ctx) => {
    const admins = await ctx.db.query("users").collect();
    const superAdmin = admins.find((u) => u.role === "super_admin");
    if (!superAdmin) throw new Error("No super admin exists yet");

    const memberProducts = await ctx.db.query("loanProducts").collect();
    let updated = 0;
    for (const product of memberProducts) {
      await ctx.db.patch(product._id, {
        interestRate: 10,
        interestMethod: "flat_total",
      });
      updated++;
    }

    const existingNonMemberProduct = await ctx.db
      .query("loanProducts")
      .withIndex("by_code", (q) => q.eq("code", "NMEM"))
      .first();
    let nonMemberProductId = existingNonMemberProduct?._id;
    if (!nonMemberProductId) {
      nonMemberProductId = await ctx.db.insert("loanProducts", {
        name: "Non-Member Loan",
        code: "NMEM",
        description:
          "Collateral-backed loan for non-members, priced per the term-based rate bands rather than a fixed rate.",
        interestRate: 0,
        interestMethod: "flat_total",
        minimumAmount: 500,
        maximumAmount: 1000000,
        minimumTermMonths: BigInt(1),
        maximumTermMonths: BigInt(60),
        requiredGuarantors: BigInt(0),
        maxLoanToSavingsRatio: 0,
        processingFeePercent: 0,
        insuranceFeePercent: 0,
        gracePeriodDays: BigInt(0),
        penaltyRatePercent: 5,
        isActive: true,
        createdBy: superAdmin._id,
      });
    }

    return { updated, nonMemberProductId };
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
        value: "500",
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

// One-off migration: renumbers every existing loan onto the new global
// EDULA-### sequence (see loans/helpers.ts generateLoanNumber), oldest
// first, so old LN-{PRODUCT}-{date}-{seq} numbers don't linger in the UI.
// Safe to re-run — already-EDULA-numbered loans are left untouched.
// Reachable via `npx convex run seed:renumberLoans`.
export const renumberLoans = internalMutation({
  args: {},
  handler: async (ctx) => {
    const loans = await ctx.db.query("loans").collect();
    loans.sort((a, b) => a._creationTime - b._creationTime);

    let seq = 0;
    for (const loan of loans) {
      if (loan.loanNumber.startsWith("EDULA-")) {
        const n = parseInt(loan.loanNumber.slice("EDULA-".length), 10);
        if (!Number.isNaN(n)) seq = Math.max(seq, n);
      }
    }

    let renumbered = 0;
    for (const loan of loans) {
      if (loan.loanNumber.startsWith("EDULA-")) continue;
      seq += 1;
      await ctx.db.patch(loan._id, {
        loanNumber: `EDULA-${String(seq).padStart(3, "0")}`,
      });
      renumbered++;
    }

    return { renumbered, total: loans.length };
  },
});

// One-off factory reset: wipes every member, loan, account, transaction,
// notification, announcement, and all other operational/member data back
// to empty. Leaves system config untouched (loanProducts, settings,
// legalDocuments, contributionTypes). Every user with role "super_admin"
// (the 00000000 bootstrap admin and any chairman/deputy promoted to
// super_admin, e.g. Pius Ochodi) keeps their login credentials exactly
// as-is — only their memberId link is cleared, since the member record it
// pointed to is gone. Every other user (role "member") is deleted along
// with their auth records. Reachable via `npx convex run seed:factoryReset`.
export const factoryReset = internalMutation({
  args: {},
  handler: async (ctx) => {
    const wipeTables = [
      "members",
      "passwordResetRequests",
      "depositClaims",
      "membershipApplications",
      "accounts",
      "transactions",
      "loans",
      "loanSchedule",
      "guarantors",
      "contributions",
      "dividends",
      "dividendPayouts",
      "commissions",
      "notifications",
      "announcements",
      "projects",
      "auditLog",
    ] as const;

    const counts: Record<string, number> = {};
    for (const table of wipeTables) {
      const rows = await ctx.db.query(table).collect();
      for (const row of rows) await ctx.db.delete(row._id);
      counts[table] = rows.length;
    }

    const allUsers = await ctx.db.query("users").collect();
    const [authAccounts, authSessions, authRefreshTokens, authVerificationCodes, authVerifiers] =
      await Promise.all([
        ctx.db.query("authAccounts").collect(),
        ctx.db.query("authSessions").collect(),
        ctx.db.query("authRefreshTokens").collect(),
        ctx.db.query("authVerificationCodes").collect(),
        ctx.db.query("authVerifiers").collect(),
      ]);

    let usersDeleted = 0;
    for (const user of allUsers) {
      if (user.role === "super_admin") {
        if (user.memberId) await ctx.db.patch(user._id, { memberId: undefined });
        continue;
      }

      const accountsForUser = authAccounts.filter((a) => a.userId === user._id);
      const accountIds = new Set(accountsForUser.map((a) => a._id));
      for (const a of accountsForUser) await ctx.db.delete(a._id);

      for (const code of authVerificationCodes) {
        if (accountIds.has(code.accountId)) await ctx.db.delete(code._id);
      }

      const sessionsForUser = authSessions.filter((s) => s.userId === user._id);
      const sessionIds = new Set(sessionsForUser.map((s) => s._id));
      for (const s of sessionsForUser) await ctx.db.delete(s._id);

      for (const token of authRefreshTokens) {
        if (sessionIds.has(token.sessionId)) await ctx.db.delete(token._id);
      }
      for (const verifier of authVerifiers) {
        if (verifier.sessionId && sessionIds.has(verifier.sessionId)) {
          await ctx.db.delete(verifier._id);
        }
      }

      await ctx.db.delete(user._id);
      usersDeleted++;
    }

    return { ...counts, usersDeleted };
  },
});

// One-off: recreate Pius Ochodi's member profile after factoryReset wiped
// the members table. He keeps his existing super_admin login untouched —
// this just gives him the ordinary member profile (savings/shares
// accounts) that comes with being chairman: a full participating member,
// not admin-only. No-ops if he already has one. Reachable via
// `npx convex run seed:restoreChairmanMemberProfile`.
export const restoreChairmanMemberProfile = internalMutation({
  args: {},
  handler: async (ctx) => {
    const chairman = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", "28916234"))
      .first();
    if (!chairman) throw new Error("Chairman user (National ID 28916234) not found");
    if (chairman.memberId) return { alreadyHasProfile: true };

    const allUsers = await ctx.db.query("users").collect();
    const bootstrapAdmin = allUsers.find((u) => u.nationalId === "00000000");
    if (!bootstrapAdmin) throw new Error("Bootstrap admin (00000000) not found");

    const memberNumber = await generateMemberNumber(ctx);
    const today = new Date().toISOString().slice(0, 10);

    const memberId = await ctx.db.insert("members", {
      memberNumber,
      firstName: "PIUS",
      lastName: "OCHODI",
      nationalId: "28916234",
      phoneNumber: "+254721679034",
      gender: "male",
      dateJoined: today,
      status: "active",
      userId: chairman._id,
      registeredBy: bootstrapAdmin._id,
      committeeRole: "chairman",
    });

    await ctx.db.patch(chairman._id, { memberId });

    for (const [type, prefix, minimumBalance] of [
      ["savings", "SAV", 0],
      ["shares_capital", "SHC", 5000],
      ["shares_long_term", "SHL", 0],
      ["shares_short_term", "SHS", 0],
    ] as const) {
      await ctx.db.insert("accounts", {
        memberId,
        type,
        accountNumber: `${prefix}-${memberNumber}`,
        balance: 0,
        minimumBalance,
        isActive: true,
      });
    }

    await logAction(ctx, {
      userId: bootstrapAdmin._id,
      action: "member.register",
      entityType: "member",
      entityId: memberId,
      details: { memberNumber, name: "PIUS OCHODI" },
    });

    return { memberId, memberNumber };
  },
});
