import { MutationCtx } from "../_generated/server";

export {
  calculateLoanSchedule,
  calculateBulletLoan,
  resolveNonMemberInterestRate,
  type ScheduleInstallment,
} from "../../lib/loan-calc";

export async function generateLoanNumber(
  ctx: MutationCtx,
  productCode: string
): Promise<string> {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const prefix = `LN-${productCode}-${datePart}-`;

  const matching = await ctx.db
    .query("loans")
    .withIndex("by_loanNumber", (q) =>
      q.gte("loanNumber", prefix).lt("loanNumber", prefix + "￿")
    )
    .collect();

  const seq = matching.length + 1;
  return `${prefix}${String(seq).padStart(4, "0")}`;
}
