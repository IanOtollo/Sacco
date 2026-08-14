import { internalMutation } from "../_generated/server";
import { notify } from "../notifications/helpers";
import { logSystemAction } from "../audit";

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export const checkOverdueInstallments = internalMutation({
  args: {},
  handler: async (ctx) => {
    const today = new Date().toISOString().slice(0, 10);
    const overdueInstallments = await ctx.db
      .query("loanSchedule")
      .withIndex("by_dueDate", (q) => q.lt("dueDate", today))
      .collect();

    const loanCache = new Map<
      string,
      { arrearsDelta: number; loanId: (typeof overdueInstallments)[number]["loanId"] }
    >();

    for (const installment of overdueInstallments) {
      if (installment.status === "paid" || installment.status === "waived") {
        continue;
      }
      if (installment.status === "overdue") continue;

      const loan = await ctx.db.get(installment.loanId);
      if (!loan) continue;
      const product = await ctx.db.get(loan.productId);
      if (!product) continue;

      const amountDue = installment.totalDue - installment.amountPaid;
      const monthsLate = Math.max(
        1,
        Math.ceil(
          (Date.now() - new Date(installment.dueDate).getTime()) /
            (30 * 24 * 60 * 60 * 1000)
        )
      );
      const penalty = round2(
        amountDue * (product.penaltyRatePercent / 100) * monthsLate
      );

      await ctx.db.patch(installment._id, {
        status: "overdue",
        penaltyAmount: penalty,
      });

      const entry = loanCache.get(loan._id) ?? { arrearsDelta: 0, loanId: loan._id };
      entry.arrearsDelta += amountDue + penalty;
      loanCache.set(loan._id, entry);
    }

    for (const { loanId, arrearsDelta } of loanCache.values()) {
      const loan = await ctx.db.get(loanId);
      if (!loan) continue;
      await ctx.db.patch(loanId, {
        arrearsAmount: round2(loan.arrearsAmount + arrearsDelta),
      });

      const member = await ctx.db.get(loan.memberId);
      if (member?.userId) {
        await notify(ctx, {
          recipientUserId: member.userId,
          title: "Loan repayment overdue",
          message: `Your repayment for loan ${loan.loanNumber} is overdue.`,
          type: "payment_due",
          relatedEntityType: "loan",
          relatedEntityId: loanId,
          actionUrl: `/portal/loans/${loanId}`,
        });
      }
    }

    if (loanCache.size > 0) {
      await logSystemAction(ctx, {
        action: "cron.checkOverdueInstallments",
        entityType: "loanSchedule",
        entityId: "bulk",
        details: { loansFlagged: loanCache.size },
      });
    }
  },
});

export const sendPaymentReminders = internalMutation({
  args: {},
  handler: async (ctx) => {
    const reminderDate = new Date();
    reminderDate.setDate(reminderDate.getDate() + 3);
    const target = reminderDate.toISOString().slice(0, 10);

    const dueInThreeDays = await ctx.db
      .query("loanSchedule")
      .withIndex("by_dueDate", (q) => q.eq("dueDate", target))
      .collect();

    let remindersSent = 0;
    for (const installment of dueInThreeDays) {
      if (installment.status !== "upcoming") continue;
      const loan = await ctx.db.get(installment.loanId);
      if (!loan) continue;
      const member = await ctx.db.get(loan.memberId);
      if (!member?.userId) continue;

      await notify(ctx, {
        recipientUserId: member.userId,
        title: "Upcoming loan repayment",
        message: `Your repayment of KES ${installment.totalDue.toLocaleString()} for loan ${loan.loanNumber} is due on ${installment.dueDate}.`,
        type: "payment_due",
        relatedEntityType: "loan",
        relatedEntityId: loan._id,
        actionUrl: `/portal/loans/${loan._id}`,
      });
      remindersSent++;
    }

    if (remindersSent > 0) {
      await logSystemAction(ctx, {
        action: "cron.sendPaymentReminders",
        entityType: "loanSchedule",
        entityId: "bulk",
        details: { remindersSent },
      });
    }
  },
});
