import { v } from "convex/values";
import { query } from "../_generated/server";
import { requireMemberProfile, requireTreasurer, requireUser } from "../authz";

export const countPendingApproval = query({
  args: {},
  handler: async (ctx) => {
    await requireTreasurer(ctx);
    const loans = await ctx.db
      .query("loans")
      .withIndex("by_status", (q) => q.eq("status", "pending_approval"))
      .collect();
    return loans.length;
  },
});

export const listAll = query({
  args: {
    status: v.optional(v.string()),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
  },
  handler: async (ctx, { status, startDate, endDate }) => {
    await requireTreasurer(ctx);
    // Newest first, capped: the list page never reads more than 500 loans
    // however many exist. Date filters narrow via the index range.
    const start = startDate ? new Date(startDate).getTime() : undefined;
    const end = endDate ? new Date(endDate).getTime() + 24 * 60 * 60 * 1000 : undefined;
    const loans = status
      ? await ctx.db
          .query("loans")
          .withIndex("by_status", (q) => {
            const base = q.eq("status", status as never);
            if (start !== undefined && end !== undefined)
              return base.gte("_creationTime", start).lt("_creationTime", end);
            if (start !== undefined) return base.gte("_creationTime", start);
            if (end !== undefined) return base.lt("_creationTime", end);
            return base;
          })
          .order("desc")
          .take(500)
      : await ctx.db
          .query("loans")
          .withIndex("by_creation_time", (q) => {
            if (start !== undefined && end !== undefined)
              return q.gte("_creationTime", start).lt("_creationTime", end);
            if (start !== undefined) return q.gte("_creationTime", start);
            if (end !== undefined) return q.lt("_creationTime", end);
            return q;
          })
          .order("desc")
          .take(500);

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
        const referrer = member?.invitedBy ? await ctx.db.get(member.invitedBy) : null;
        return {
          ...loan,
          referrerName: referrer ? `${referrer.firstName} ${referrer.lastName}` : null,
          referrerPhone: referrer?.phoneNumber ?? null,
          memberName: member ? `${member.firstName} ${member.lastName}` : "—",
          isNonMember: member?.isNonMember ?? false,
          committeeRole: member?.committeeRole,
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
    const caller = await assertCanViewLoan(ctx, loan.memberId);
    const isAdmin = caller.role === "admin" || caller.role === "super_admin";

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

    // Referral (the member who invited the borrower) — admins only, since it
    // exposes that member's phone number.
    const referrerMember =
      isAdmin && member?.invitedBy ? await ctx.db.get(member.invitedBy) : null;
    const referrer = referrerMember
      ? {
          _id: referrerMember._id,
          name: `${referrerMember.firstName} ${referrerMember.lastName}`,
          phoneNumber: referrerMember.phoneNumber,
          memberNumber: referrerMember.memberNumber,
        }
      : null;

    return {
      ...loan,
      referrer,
      member,
      product,
      guarantors: guarantorsWithNames,
      schedule,
    };
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
