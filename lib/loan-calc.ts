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
  method: "reducing_balance" | "flat_rate";
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
    totalInterest = principal * (annualRatePercent / 100) * (termMonths / 12);
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
