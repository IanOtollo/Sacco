import { v } from "convex/values";
import { query } from "../_generated/server";
import { requireMemberProfile, requireTreasurer, requireUser } from "../authz";

export const listAll = query({
  args: {
    status: v.optional(v.string()),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
  },
  handler: async (ctx, { status, startDate, endDate }) => {
    await requireTreasurer(ctx);
    let loans = status
      ? await ctx.db
          .query("loans")
          .withIndex("by_status", (q) => q.eq("status", status as never))
          .collect()
      : await ctx.db.query("loans").collect();

    if (startDate) {
      const start = new Date(startDate).getTime();
      loans = loans.filter((l) => l._creationTime >= start);
    }
    if (endDate) {
      const end = new Date(endDate).getTime() + 24 * 60 * 60 * 1000;
      loans = loans.filter((l) => l._creationTime < end);
    }

    loans.sort((a, b) => b._creationTime - a._creationTime);

    return await Promise.all(
      loans.map(async (loan) => {
        const [member, product, guarantors] = await Promise.all([
          ctx.db.get(loan.memberId),
          ctx.db.get(loan.productId),
          ctx.db
            .query("guarantors")
            .withIndex("by_loan", (q) => q.eq("loanId", loan._id))
            .collect(),
        ]);
        return {
          ...loan,
          memberName: member ? `${member.firstName} ${member.lastName}` : "—",
          isNonMember: member?.isNonMember ?? false,
          productName: product?.name ?? "—",
          guarantorsAccepted: guarantors.filter((g) => g.status === "accepted").length,
          guarantorsTotal: guarantors.length,
        };
      })
    );
  },
});

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const caller = await requireMemberProfile(ctx);
    const loans = await ctx.db
      .query("loans")
      .withIndex("by_member", (q) => q.eq("memberId", caller.memberId!))
      .collect();
    loans.sort((a, b) => b._creationTime - a._creationTime);

    return await Promise.all(
      loans.map(async (loan) => {
        const product = await ctx.db.get(loan.productId);
        return { ...loan, productName: product?.name ?? "—" };
      })
    );
  },
});

async function assertCanViewLoan(
  ctx: Parameters<typeof requireUser>[0],
  memberId: string
) {
  const caller = await requireUser(ctx);
  const isSelf = caller.role === "member" && caller.memberId === memberId;
  const isAdmin = caller.role === "admin" || caller.role === "super_admin";
  if (!isSelf && !isAdmin) throw new Error("Not authorized");
  return caller;
}

export const getById = query({
  args: { loanId: v.id("loans") },
  handler: async (ctx, { loanId }) => {
    const loan = await ctx.db.get(loanId);
    if (!loan) return null;
    await assertCanViewLoan(ctx, loan.memberId);

    const [member, product, guarantors, schedule] = await Promise.all([
      ctx.db.get(loan.memberId),
      ctx.db.get(loan.productId),
      ctx.db
        .query("guarantors")
        .withIndex("by_loan", (q) => q.eq("loanId", loanId))
        .collect(),
      ctx.db
        .query("loanSchedule")
        .withIndex("by_loan", (q) => q.eq("loanId", loanId))
        .collect(),
    ]);

    const guarantorsWithNames = await Promise.all(
      guarantors.map(async (g) => {
        const guarantorMember = await ctx.db.get(g.guarantorMemberId);
        return {
          ...g,
          guarantorName: guarantorMember
            ? `${guarantorMember.firstName} ${guarantorMember.lastName}`
            : "—",
        };
      })
    );

    schedule.sort((a, b) => Number(a.installmentNumber) - Number(b.installmentNumber));

    return {
      ...loan,
      member,
      product,
      guarantors: guarantorsWithNames,
      schedule,
    };
  },
});

export const getGuarantorRequests = query({
  args: {},
  handler: async (ctx) => {
    const caller = await requireMemberProfile(ctx);
    const requests = await ctx.db
      .query("guarantors")
      .withIndex("by_guarantor", (q) => q.eq("guarantorMemberId", caller.memberId!))
      .collect();

    requests.sort((a, b) => b._creationTime - a._creationTime);

    return await Promise.all(
      requests.map(async (g) => {
        const [loan, borrower] = await Promise.all([
          ctx.db.get(g.loanId),
          ctx.db.get(g.borrowerMemberId),
        ]);
        const product = loan ? await ctx.db.get(loan.productId) : null;
        return {
          ...g,
          loanAmount: loan?.principalAmount ?? 0,
          productName: product?.name ?? "—",
          borrowerName: borrower ? `${borrower.firstName} ${borrower.lastName}` : "—",
        };
      })
    );
  },
});

export const getMyGuarantees = query({
  args: {},
  handler: async (ctx) => {
    const caller = await requireMemberProfile(ctx);
    const guarantees = await ctx.db
      .query("guarantors")
      .withIndex("by_guarantor", (q) => q.eq("guarantorMemberId", caller.memberId!))
      .filter((q) => q.neq(q.field("status"), "pending"))
      .collect();

    guarantees.sort((a, b) => b._creationTime - a._creationTime);

    return await Promise.all(
      guarantees.map(async (g) => {
        const [loan, borrower] = await Promise.all([
          ctx.db.get(g.loanId),
          ctx.db.get(g.borrowerMemberId),
        ]);
        return {
          ...g,
          loanStatus: loan?.status ?? "—",
          loanAmount: loan?.principalAmount ?? 0,
          borrowerName: borrower ? `${borrower.firstName} ${borrower.lastName}` : "—",
        };
      })
    );
  },
});
