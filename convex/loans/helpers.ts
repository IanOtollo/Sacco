import { MutationCtx } from "../_generated/server";

export {
  calculateLoanSchedule,
  calculateBulletLoan,
  resolveEmergencyLoanRate,
  resolveDevelopmentLoanRate,
  type ScheduleInstallment,
} from "../../lib/loan-calc";

// Client-mandated format: EDULA-001, EDULA-002, ... — one global sequence
// across every loan regardless of product, member vs non-member, or date.
export async function generateLoanNumber(ctx: MutationCtx): Promise<string> {
  const prefix = "EDULA-";

  const last = await ctx.db
    .query("loans")
    .withIndex("by_loanNumber", (q) =>
      q.gte("loanNumber", prefix).lt("loanNumber", prefix + "￿")
    )
    .order("desc")
    .first();

  const lastSeq = last ? parseInt(last.loanNumber.slice(prefix.length), 10) : 0;
  const nextSeq = (Number.isNaN(lastSeq) ? 0 : lastSeq) + 1;
  return `${prefix}${String(nextSeq).padStart(3, "0")}`;
}
