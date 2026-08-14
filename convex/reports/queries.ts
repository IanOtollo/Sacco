import { v } from "convex/values";
import { query } from "../_generated/server";
import { requireAdmin, requireTreasurer, requireUser } from "../authz";

// Public, non-sensitive aggregate stats shown on the landing page.
export const getLandingStats = query({
  args: {},
  handler: async (ctx) => {
    const [members, savingsAccounts, disbursedLoans] = await Promise.all([
      ctx.db
        .query("members")
        .withIndex("by_status", (q) => q.eq("status", "active"))
        .collect(),
      ctx.db
        .query("accounts")
        .withIndex("by_member_type")
        .filter((q) => q.eq(q.field("type"), "savings"))
        .collect(),
      ctx.db.query("loans").collect(),
    ]);

    const totalSavings = savingsAccounts.reduce(
      (sum, account) => sum + account.balance,
      0
    );
    const totalLoansDisbursed = disbursedLoans
      .filter((loan) =>
        ["disbursed", "active", "fully_paid", "defaulted", "written_off"].includes(
          loan.status
        )
      )
      .reduce((sum, loan) => sum + loan.amountDisbursed, 0);

    return {
      totalMembers: members.length,
      totalSavings,
      totalLoansDisbursed,
    };
  },
});

const COLLECTION_TYPES = new Set(["deposit", "share_purchase", "loan_repayment"]);

function lastNMonths(n: number): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(d.toISOString().slice(0, 7));
  }
  return months;
}

export const getAdminDashboard = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const [members, accounts, loans, transactions, schedule] = await Promise.all([
      ctx.db.query("members").collect(),
      ctx.db.query("accounts").collect(),
      ctx.db.query("loans").collect(),
      ctx.db.query("transactions").collect(),
      ctx.db.query("loanSchedule").collect(),
    ]);

    const activeMembers = members.filter(
      (m) => m.status === "active" && !m.isNonMember
    ).length;
    const savingsPool = accounts
      .filter((a) => a.type === "savings")
      .reduce((s, a) => s + a.balance, 0);
    const sharesLongTermPool = accounts
      .filter((a) => a.type === "shares_long_term")
      .reduce((s, a) => s + a.balance, 0);
    const sharesShortTermPool = accounts
      .filter((a) => a.type === "shares_short_term")
      .reduce((s, a) => s + a.balance, 0);
    const sharesCapitalPool = accounts
      .filter((a) => a.type === "shares_capital")
      .reduce((s, a) => s + a.balance, 0);
    const sharesPool = sharesLongTermPool + sharesShortTermPool + sharesCapitalPool;

    const activeLoans = loans.filter((l) =>
      ["active", "disbursed"].includes(l.status)
    );
    const outstandingTotal = activeLoans.reduce(
      (s, l) => s + l.outstandingBalance,
      0
    );
    const pendingApplications = loans.filter((l) =>
      ["pending_guarantors", "pending_approval"].includes(l.status)
    ).length;

    const memberByIdForLoans = new Map(members.map((m) => [m._id, m]));
    const disbursedLoans = loans.filter((l) =>
      ["disbursed", "active", "fully_paid", "defaulted", "written_off"].includes(l.status)
    );
    const disbursedToNonMembers = disbursedLoans.filter(
      (l) => memberByIdForLoans.get(l.memberId)?.isNonMember
    );
    const totalDisbursedAmount = disbursedLoans.reduce(
      (s, l) => s + l.amountDisbursed,
      0
    );
    const disbursedLoansCount = disbursedLoans.length;
    const nonMemberDisbursedAmount = disbursedToNonMembers.reduce(
      (s, l) => s + l.amountDisbursed,
      0
    );

    const today = new Date().toISOString().slice(0, 10);
    const overdueLoanIds = new Set(
      schedule
        .filter(
          (s) => s.dueDate < today && s.status !== "paid" && s.status !== "waived"
        )
        .map((s) => s.loanId)
    );

    const monthPrefix = new Date().toISOString().slice(0, 7);
    const thisMonthCollections = transactions
      .filter(
        (t) =>
          new Date(t._creationTime).toISOString().slice(0, 7) === monthPrefix &&
          COLLECTION_TYPES.has(t.type)
      )
      .reduce((s, t) => s + t.amount, 0);

    const months = lastNMonths(12);
    const monthlyCollections = months.map((month) => {
      const total = transactions
        .filter(
          (t) =>
            new Date(t._creationTime).toISOString().slice(0, 7) === month &&
            COLLECTION_TYPES.has(t.type)
        )
        .reduce((s, t) => s + t.amount, 0);
      return { month, total };
    });

    const memberGrowth = months.map((month) => ({
      month,
      count: members.filter(
        (m) => !m.isNonMember && m.dateJoined.slice(0, 7) === month
      ).length,
    }));

    const portfolioBuckets: Record<string, number> = {
      active: 0,
      fully_paid: 0,
      defaulted: 0,
      written_off: 0,
    };
    for (const l of loans) {
      if (l.status === "disbursed") portfolioBuckets.active++;
      else if (l.status in portfolioBuckets) portfolioBuckets[l.status]++;
    }
    const loanPortfolio = Object.entries(portfolioBuckets).map(([status, count]) => ({
      status,
      count,
    }));

    const recentTransactions = [...transactions]
      .sort((a, b) => b._creationTime - a._creationTime)
      .slice(0, 10);
    const memberById = new Map(members.map((m) => [m._id, m]));
    const recentActivity = recentTransactions.map((t) => ({
      _id: t._id,
      description: t.description,
      amount: t.amount,
      type: t.type,
      createdAt: t._creationTime,
      memberName: (() => {
        const m = memberById.get(t.memberId);
        return m ? `${m.firstName} ${m.lastName}` : "—";
      })(),
    }));

    return {
      stats: {
        activeMembers,
        savingsPool,
        sharesPool,
        sharesLongTermPool,
        sharesShortTermPool,
        sharesCapitalPool,
        activeLoansCount: activeLoans.length,
        outstandingTotal,
        pendingApplications,
        overdueLoans: overdueLoanIds.size,
        thisMonthCollections,
        totalDisbursedAmount,
        disbursedLoansCount,
        nonMemberLoansCount: disbursedToNonMembers.length,
        nonMemberDisbursedAmount,
      },
      monthlyCollections,
      memberGrowth,
      loanPortfolio,
      recentActivity,
    };
  },
});

export const getMyDashboard = query({
  args: {},
  handler: async (ctx) => {
    const caller = await requireUser(ctx);
    if (!caller.memberId) return null;

    const [accounts, loans, announcements, transactions] = await Promise.all([
      ctx.db
        .query("accounts")
        .withIndex("by_member", (q) => q.eq("memberId", caller.memberId!))
        .collect(),
      ctx.db
        .query("loans")
        .withIndex("by_member", (q) => q.eq("memberId", caller.memberId!))
        .collect(),
      ctx.db
        .query("announcements")
        .withIndex("by_published", (q) => q.eq("isPublished", true))
        .collect(),
      ctx.db
        .query("transactions")
        .withIndex("by_member", (q) => q.eq("memberId", caller.memberId!))
        .order("desc")
        .take(5),
    ]);

    const savings = accounts.find((a) => a.type === "savings");
    const sharesLongTerm = accounts.find((a) => a.type === "shares_long_term");
    const sharesShortTerm = accounts.find((a) => a.type === "shares_short_term");
    const sharesCapital = accounts.find((a) => a.type === "shares_capital");
    const activeLoan = loans.find((l) => ["active", "disbursed"].includes(l.status));

    let activeLoanSchedule = null;
    if (activeLoan) {
      const schedule = await ctx.db
        .query("loanSchedule")
        .withIndex("by_loan", (q) => q.eq("loanId", activeLoan._id))
        .collect();
      const nextDue = schedule
        .filter((s) => s.status !== "paid")
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
      activeLoanSchedule = nextDue ?? null;
    }

    const now = new Date().toISOString();
    const recentAnnouncements = announcements
      .filter((a) => {
        const audience =
          a.targetAudience === "all" || a.targetAudience === "members";
        const notExpired = !a.expiresAt || a.expiresAt > now;
        return audience && notExpired;
      })
      .sort((a, b) => b._creationTime - a._creationTime)
      .slice(0, 3);

    return {
      savingsBalance: savings?.balance ?? 0,
      sharesBalance:
        (sharesLongTerm?.balance ?? 0) +
        (sharesShortTerm?.balance ?? 0) +
        (sharesCapital?.balance ?? 0),
      sharesLongTermBalance: sharesLongTerm?.balance ?? 0,
      sharesShortTermBalance: sharesShortTerm?.balance ?? 0,
      sharesCapitalBalance: sharesCapital?.balance ?? 0,
      activeLoan,
      nextInstallment: activeLoanSchedule,
      recentTransactions: transactions,
      announcements: recentAnnouncements,
    };
  },
});

export const getFinancialSummary = query({
  args: {
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
  },
  handler: async (ctx, { startDate, endDate }) => {
    await requireTreasurer(ctx);

    const [accounts, loans, dividends] = await Promise.all([
      ctx.db.query("accounts").collect(),
      ctx.db.query("loans").collect(),
      ctx.db.query("dividends").collect(),
    ]);

    const start = startDate ? new Date(startDate).getTime() : null;
    const end = endDate ? new Date(endDate).getTime() + 24 * 60 * 60 * 1000 : null;
    const inRange = (t: number) => (start === null || t >= start) && (end === null || t < end);

    // Balances are point-in-time (as of now) — a date range only scopes the
    // period-based flow metrics below (interest earned, fees, dividends).
    const totalSavings = accounts
      .filter((a) => a.type === "savings")
      .reduce((s, a) => s + a.balance, 0);
    const totalSharesLongTerm = accounts
      .filter((a) => a.type === "shares_long_term")
      .reduce((s, a) => s + a.balance, 0);
    const totalSharesShortTerm = accounts
      .filter((a) => a.type === "shares_short_term")
      .reduce((s, a) => s + a.balance, 0);
    const totalSharesCapital = accounts
      .filter((a) => a.type === "shares_capital")
      .reduce((s, a) => s + a.balance, 0);
    const totalShares = totalSharesLongTerm + totalSharesShortTerm + totalSharesCapital;
    const totalOutstanding = loans
      .filter((l) => ["active", "disbursed"].includes(l.status))
      .reduce((s, l) => s + l.outstandingBalance, 0);

    const loansInRange = loans.filter((l) => inRange(l._creationTime));
    const interestEarned = loansInRange
      .filter((l) => ["active", "disbursed", "fully_paid"].includes(l.status))
      .reduce((s, l) => s + l.interestAmount, 0);
    const feesCollected = loansInRange.reduce(
      (s, l) => s + l.processingFee + l.insuranceFee,
      0
    );
    const dividendsPaid = dividends
      .filter((d) => d.status === "distributed" && inRange(d._creationTime))
      .reduce((s, d) => s + d.totalPool, 0);

    return {
      totalSavings,
      totalShares,
      totalSharesLongTerm,
      totalSharesShortTerm,
      totalSharesCapital,
      totalAssets: totalSavings + totalShares,
      totalOutstanding,
      interestEarned,
      feesCollected,
      dividendsPaid,
    };
  },
});

export const getTransactionReport = query({
  args: {
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    type: v.optional(v.string()),
  },
  handler: async (ctx, { startDate, endDate, type }) => {
    await requireTreasurer(ctx);

    let transactions = await ctx.db.query("transactions").collect();

    if (type) {
      transactions = transactions.filter((t) => t.type === type);
    }
    if (startDate) {
      const start = new Date(startDate).getTime();
      transactions = transactions.filter((t) => t._creationTime >= start);
    }
    if (endDate) {
      const end = new Date(endDate).getTime() + 24 * 60 * 60 * 1000;
      transactions = transactions.filter((t) => t._creationTime < end);
    }

    transactions.sort((a, b) => b._creationTime - a._creationTime);

    const members = await ctx.db.query("members").collect();
    const memberById = new Map(members.map((m) => [m._id, m]));

    return transactions.slice(0, 500).map((t) => ({
      ...t,
      memberName: (() => {
        const m = memberById.get(t.memberId);
        return m ? `${m.firstName} ${m.lastName}` : "—";
      })(),
    }));
  },
});
