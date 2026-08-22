"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/shared/status-badge";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { EmptyState } from "@/components/shared/empty-state";
import { RepaymentSchedule } from "@/components/loans/repayment-schedule";
import { MakePaymentModal } from "@/components/loans/make-payment-modal";
import { LoanPrintSheet } from "@/components/loans/loan-print-sheet";
import { formatDate } from "@/lib/utils";
import { HandCoins, CreditCard, Printer } from "lucide-react";

export function LoanDetailClient({ loanId }: { loanId: string }) {
  const loan = useQuery(api.loans.queries.getById, {
    loanId: loanId as Id<"loans">,
  });
  const [payOpen, setPayOpen] = useState(false);

  if (loan === undefined) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (loan === null) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <EmptyState icon={HandCoins} title="Loan not found" />
      </div>
    );
  }

  const canPay = ["active", "disbursed"].includes(loan.status);

  return (
    <>
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 lg:px-8 print:hidden">
      <Card className="rounded-2xl border-border/50 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-heading text-xl font-bold tracking-tight">
              {loan.product?.name}
            </h1>
            <p className="mt-0.5 font-mono text-xs text-muted-foreground">
              {loan.loanNumber}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.print()}
            >
              <Printer className="size-3.5" />
              Print
            </Button>
            <StatusBadge status={loan.status} />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <div>
            <p className="text-muted-foreground">Principal</p>
            <p className="mt-0.5 font-semibold">
              <CurrencyDisplay amount={loan.principalAmount} />
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Outstanding</p>
            <p className="mt-0.5 font-semibold">
              <CurrencyDisplay amount={loan.outstandingBalance} />
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Monthly payment</p>
            <p className="mt-0.5 font-semibold">
              <CurrencyDisplay amount={loan.monthlyRepayment} />
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Maturity</p>
            <p className="mt-0.5 font-semibold">
              {loan.maturityDate ? formatDate(loan.maturityDate) : "—"}
            </p>
          </div>
        </div>

        {loan.status === "rejected" && loan.rejectionReason && (
          <p className="mt-4 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
            Declined: {loan.rejectionReason}
          </p>
        )}

        {canPay && (
          <Button className="mt-6" onClick={() => setPayOpen(true)}>
            <CreditCard className="size-4" />
            Make a payment
          </Button>
        )}
      </Card>

      {loan.guarantors.length > 0 && (
        <Card className="rounded-2xl border-border/50 p-6">
          <h2 className="text-sm font-semibold">Guarantors</h2>
          <div className="mt-3 space-y-2">
            {loan.guarantors.map((g) => (
              <div
                key={g._id}
                className="flex items-center justify-between text-sm"
              >
                <span>{g.guarantorName}</span>
                <StatusBadge status={g.status} />
              </div>
            ))}
          </div>
        </Card>
      )}

      {loan.schedule.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-semibold">Repayment schedule</h2>
          <RepaymentSchedule schedule={loan.schedule} />
        </div>
      )}

      <MakePaymentModal
        open={payOpen}
        onOpenChange={setPayOpen}
        loanId={loan._id}
        monthlyRepayment={loan.monthlyRepayment}
      />
      </div>

      <LoanPrintSheet loan={loan} />
    </>
  );
}
