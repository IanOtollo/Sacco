"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/shared/status-badge";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { RepaymentSchedule } from "@/components/loans/repayment-schedule";
import { MakePaymentModal } from "@/components/loans/make-payment-modal";
import { LoanPrintSheet } from "@/components/loans/loan-print-sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { formatDate } from "@/lib/utils";
import {
  HandCoins,
  CreditCard,
  Check,
  X,
  Banknote,
  Ban,
  Printer,
  BadgeCheck,
} from "lucide-react";

export function AdminLoanDetailClient({ loanId }: { loanId: string }) {
  const loan = useQuery(api.loans.queries.getById, {
    loanId: loanId as Id<"loans">,
  });
  const approve = useMutation(api.loans.mutations.approve);
  const disburse = useMutation(api.loans.mutations.disburse);
  const writeOff = useMutation(api.loans.mutations.writeOff);

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [writeOffOpen, setWriteOffOpen] = useState(false);
  const [writeOffReason, setWriteOffReason] = useState("");
  const [payOpen, setPayOpen] = useState(false);
  const [disburseConfirm, setDisburseConfirm] = useState(false);
  const [approveConfirm, setApproveConfirm] = useState(false);

  const reject = useMutation(api.loans.mutations.reject);

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

  async function handleApprove() {
    try {
      await approve({ loanId: loan!._id });
      toast.success("Loan approved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not approve loan");
    }
  }

  async function handleReject() {
    try {
      await reject({ loanId: loan!._id, reason: rejectReason });
      toast.success("Loan rejected");
      setRejectOpen(false);
      setRejectReason("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not reject loan");
    }
  }

  async function handleDisburse() {
    await disburse({ loanId: loan!._id });
    toast.success("Loan disbursed");
  }

  async function handleWriteOff() {
    try {
      await writeOff({ loanId: loan!._id, reason: writeOffReason });
      toast.success("Loan written off");
      setWriteOffOpen(false);
      setWriteOffReason("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not write off loan");
    }
  }

  return (
    <>
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 lg:px-8 print:hidden">
      <Card className="rounded-2xl border-border/50 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-heading text-xl font-bold tracking-tight">
              {loan.nonMemberLoanCategory === "emergency"
                ? "Emergency Loan"
                : loan.nonMemberLoanCategory === "development"
                  ? "Development Loan"
                  : loan.product?.name}
            </h1>
            <p className="mt-0.5 font-mono text-xs text-muted-foreground">
              {loan.loanNumber}
            </p>
            {loan.member && (
              <div className="mt-1 flex items-center gap-2">
                <Link
                  href={`/admin/members/${loan.member._id}`}
                  className="text-sm text-primary hover:underline"
                >
                  {loan.member.firstName} {loan.member.lastName} ({loan.member.memberNumber})
                </Link>
                {loan.member.isNonMember ? (
                  <span className="rounded-full bg-secondary/10 px-2 py-0.5 text-xs font-medium text-secondary">
                    Non-member
                  </span>
                ) : (
                  <BadgeCheck className="size-4 shrink-0 text-primary" />
                )}
              </div>
            )}
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

        <p className="mt-4 text-sm">
          <span className="text-muted-foreground">Purpose: </span>
          {loan.purpose}
        </p>

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
            <p className="text-muted-foreground">
              {loan.termDays != null ? "Amount due (lump sum)" : "Monthly payment"}
            </p>
            <p className="mt-0.5 font-semibold">
              <CurrencyDisplay amount={loan.monthlyRepayment} />
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Applied</p>
            <p className="mt-0.5 font-semibold">{formatDate(loan.appliedAt)}</p>
          </div>
        </div>
        {loan.termDays != null && (
          <p className="mt-3 text-sm text-muted-foreground">
            Term: {Number(loan.termDays)} day{Number(loan.termDays) === 1 ? "" : "s"} ·{" "}
            {loan.interestRate}% flat interest
          </p>
        )}
        {loan.termDays == null && loan.nonMemberLoanCategory === "development" && (
          <p className="mt-3 text-sm text-muted-foreground">
            Term: {Number(loan.termMonths)} month{Number(loan.termMonths) === 1 ? "" : "s"} ·{" "}
            {loan.interestRate}% flat interest
          </p>
        )}

        {loan.status === "rejected" && loan.rejectionReason && (
          <p className="mt-4 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
            Declined: {loan.rejectionReason}
          </p>
        )}

        <div className="mt-6 flex flex-wrap gap-2">
          {loan.status === "pending_approval" && (
            <>
              <Button onClick={() => setApproveConfirm(true)}>
                <Check className="size-4" />
                Approve
              </Button>
              <Button variant="outline" onClick={() => setRejectOpen(true)}>
                <X className="size-4" />
                Reject
              </Button>
            </>
          )}
          {loan.status === "approved" && (
            <Button onClick={() => setDisburseConfirm(true)}>
              <Banknote className="size-4" />
              Disburse
            </Button>
          )}
          {["active", "disbursed"].includes(loan.status) && (
            <>
              <Button onClick={() => setPayOpen(true)}>
                <CreditCard className="size-4" />
                Record repayment
              </Button>
              <Button
                variant="outline"
                className="text-danger hover:text-danger"
                onClick={() => setWriteOffOpen(true)}
              >
                <Ban className="size-4" />
                Write off
              </Button>
            </>
          )}
        </div>
      </Card>

      {loan.guarantors.length > 0 && (
        <Card className="rounded-2xl border-border/50 p-6">
          <h2 className="text-sm font-semibold">Guarantors</h2>
          <div className="mt-3 space-y-2">
            {loan.guarantors.map((g) => (
              <div key={g._id} className="flex items-center justify-between text-sm">
                <span>{g.guarantorName}</span>
                <StatusBadge status={g.status} />
              </div>
            ))}
          </div>
        </Card>
      )}

      {loan.collateralDescription && (
        <Card className="rounded-2xl border-border/50 p-6">
          <h2 className="text-sm font-semibold">Collateral</h2>
          <p className="mt-2 text-sm">{loan.collateralDescription}</p>
          {typeof loan.collateralValue === "number" && loan.collateralValue > 0 && (
            <p className="mt-1 text-sm text-muted-foreground">
              Estimated value: <CurrencyDisplay amount={loan.collateralValue} />
            </p>
          )}
        </Card>
      )}

      {loan.schedule.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-semibold">Repayment schedule</h2>
          <RepaymentSchedule schedule={loan.schedule} />
        </div>
      )}

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="max-w-sm sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Reject loan application</DialogTitle>
            <DialogDescription>
              The applicant will see this reason.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Reason for rejection"
            rows={3}
          />
          <Button
            className="w-full"
            disabled={!rejectReason.trim()}
            onClick={handleReject}
          >
            Confirm rejection
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={writeOffOpen} onOpenChange={setWriteOffOpen}>
        <DialogContent className="max-w-sm sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Write off this loan?</DialogTitle>
            <DialogDescription>
              This marks the outstanding balance as unrecoverable.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={writeOffReason}
            onChange={(e) => setWriteOffReason(e.target.value)}
            placeholder="Reason"
            rows={3}
          />
          <Button
            variant="destructive"
            className="w-full"
            disabled={!writeOffReason.trim()}
            onClick={handleWriteOff}
          >
            Confirm write-off
          </Button>
        </DialogContent>
      </Dialog>

      <ConfirmModal
        open={disburseConfirm}
        onOpenChange={setDisburseConfirm}
        title="Disburse this loan?"
        description={
          loan.member?.isNonMember
            ? "This generates the repayment schedule immediately. Hand over the disbursed amount directly — there's no internal account to credit for a non-member."
            : "This credits the member's savings account and generates the repayment schedule immediately."
        }
        confirmLabel="Disburse"
        onConfirm={handleDisburse}
      />

      <ConfirmModal
        open={approveConfirm}
        onOpenChange={setApproveConfirm}
        title="Approve this loan?"
        description="The member will be notified and the loan will be ready for disbursement."
        confirmLabel="Approve"
        onConfirm={handleApprove}
      />

      <MakePaymentModal
        open={payOpen}
        onOpenChange={setPayOpen}
        loanId={loan._id}
        monthlyRepayment={loan.monthlyRepayment}
        isNonMember={loan.member?.isNonMember}
      />
    </div>

    <LoanPrintSheet loan={loan} />
    </>
  );
}
