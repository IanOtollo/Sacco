import { query } from "../_generated/server";

// ONE-OFF diagnostic — delete after use
export const checkSavingsForEdula007 = query({
  args: {},
  handler: async (ctx) => {
    const loan = await ctx.db
      .query("loans")
      .withIndex("by_loanNumber", (q) => q.eq("loanNumber", "EDULA-007"))
      .first();
    if (!loan) return { error: "Loan not found" };

    const savings = await ctx.db
      .query("accounts")
      .withIndex("by_member_type", (q) =>
        q.eq("memberId", loan.memberId).eq("type", "savings")
      )
      .first();

    const member = await ctx.db.get(loan.memberId);

    return {
      loanNumber: loan.loanNumber,
      memberId: loan.memberId,
      memberName: member ? `${member.firstName} ${member.lastName}` : "—",
      savingsBalance: savings?.balance ?? null,
      savingsAccountId: savings?._id ?? null,
      outstandingBalance: loan.outstandingBalance,
      totalPaid: loan.totalPaid,
      status: loan.status,
    };
  },
});
