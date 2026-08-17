export type ScheduleInstallment = {
  installmentNumber: number;
  dueDate: string;
  principalDue: number;
  interestDue: number;
  totalDue: number;
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function calculateLoanSchedule(params: {
  principal: number;
  annualRatePercent: number;
  termMonths: number;
  method: "reducing_balance" | "flat_rate" | "flat_total";
  disbursementDate: Date;
  gracePeriodDays: number;
}): {
  totalInterest: number;
  totalRepayable: number;
  monthlyRepayment: number;
  installments: ScheduleInstallment[];
} {
  const {
    principal,
    annualRatePercent,
    termMonths,
    method,
    disbursementDate,
    gracePeriodDays,
  } = params;
  const monthlyRate = annualRatePercent / 100 / 12;

  const firstDueDate = new Date(disbursementDate);
  firstDueDate.setDate(firstDueDate.getDate() + gracePeriodDays);

  const installments: ScheduleInstallment[] = [];
  let totalInterest = 0;
  let monthlyRepayment = 0;

  if (method === "reducing_balance") {
    monthlyRepayment =
      monthlyRate === 0
        ? principal / termMonths
        : (principal * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
          (Math.pow(1 + monthlyRate, termMonths) - 1);

    let remaining = principal;
    for (let i = 1; i <= termMonths; i++) {
      const interestDue = remaining * monthlyRate;
      let principalDue = monthlyRepayment - interestDue;
      if (i === termMonths) {
        // Absorb rounding drift on the final installment.
        principalDue = remaining;
      }
      const totalDue = principalDue + interestDue;
      remaining -= principalDue;
      totalInterest += interestDue;

      const dueDate = new Date(firstDueDate);
      dueDate.setMonth(dueDate.getMonth() + (i - 1));

      installments.push({
        installmentNumber: i,
        dueDate: dueDate.toISOString().slice(0, 10),
        principalDue: round2(principalDue),
        interestDue: round2(interestDue),
        totalDue: round2(totalDue),
      });
    }
  } else {
    // "flat_rate" prorates the rate by term length (an annual rate applied
    // to however many months the loan runs); "flat_total" charges the rate
    // once against the principal regardless of term length.
    totalInterest =
      method === "flat_total"
        ? principal * (annualRatePercent / 100)
        : principal * (annualRatePercent / 100) * (termMonths / 12);
    const totalRepayable = principal + totalInterest;
    monthlyRepayment = totalRepayable / termMonths;
    const principalPerMonth = principal / termMonths;
    const interestPerMonth = totalInterest / termMonths;

    for (let i = 1; i <= termMonths; i++) {
      const dueDate = new Date(firstDueDate);
      dueDate.setMonth(dueDate.getMonth() + (i - 1));
      installments.push({
        installmentNumber: i,
        dueDate: dueDate.toISOString().slice(0, 10),
        principalDue: round2(principalPerMonth),
        interestDue: round2(interestPerMonth),
        totalDue: round2(monthlyRepayment),
      });
    }
  }

  return {
    totalInterest: round2(totalInterest),
    totalRepayable: round2(principal + totalInterest),
    monthlyRepayment: round2(monthlyRepayment),
    installments,
  };
}

// Non-member loans are short, collateral-backed, and repaid as a single
// lump sum rather than monthly installments — a "2-week loan" doesn't fit
// a monthly amortization schedule. Interest is a flat one-time charge on
// the principal, banded by how many days the loan runs.
export function resolveNonMemberInterestRate(termDays: number): number {
  if (termDays < 14) return 11.3;
  if (termDays < 30) return 20.3;
  if (termDays <= 31) return 30.3;
  return 23;
}

export function calculateBulletLoan(params: {
  principal: number;
  termDays: number;
  disbursementDate: Date;
}): {
  interestRate: number;
  totalInterest: number;
  totalRepayable: number;
  dueDate: string;
  installments: ScheduleInstallment[];
} {
  const { principal, termDays, disbursementDate } = params;
  const interestRate = resolveNonMemberInterestRate(termDays);
  const totalInterest = round2(principal * (interestRate / 100));
  const totalRepayable = round2(principal + totalInterest);

  const dueDate = new Date(disbursementDate);
  dueDate.setDate(dueDate.getDate() + termDays);
  const dueDateStr = dueDate.toISOString().slice(0, 10);

  return {
    interestRate,
    totalInterest,
    totalRepayable,
    dueDate: dueDateStr,
    installments: [
      {
        installmentNumber: 1,
        dueDate: dueDateStr,
        principalDue: principal,
        interestDue: totalInterest,
        totalDue: totalRepayable,
      },
    ],
  };
}
