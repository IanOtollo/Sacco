"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/shared/status-badge";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { EmptyState } from "@/components/shared/empty-state";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { formatDate } from "@/lib/utils";
import { HandCoins } from "lucide-react";
import { VerifiedBadge } from "@/components/shared/verified-badge";

const ISSUED_STATUSES = new Set([
  "disbursed",
  "active",
  "fully_paid",
  "defaulted",
  "written_off",
]);

export function LoansIssuedDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const loans = useQuery(
    api.loans.queries.listAll,
    open ? {} : "skip"
  );

  const issued = loans?.filter((l) => ISSUED_STATUSES.has(l.status)) ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] w-full max-w-2xl overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Loans issued</DialogTitle>
          <DialogDescription>
            Every loan that has been disbursed.{" "}
            <VerifiedBadge className="inline" /> marks a verified Sacco
            member — everyone else is a non-member borrower.
          </DialogDescription>
        </DialogHeader>

        {loans === undefined ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : issued.length === 0 ? (
          <EmptyState icon={HandCoins} title="No loans issued yet" />
        ) : (
          <div className="space-y-2">
            {issued.map((loan) => (
              <Link
                key={loan._id}
                href={`/admin/loans/${loan._id}`}
                onClick={() => onOpenChange(false)}
                className="flex items-center justify-between rounded-xl border border-border/50 px-4 py-3 text-sm transition-colors hover:bg-muted/40"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 font-medium">
                    <span className="truncate">{loan.memberName}</span>
                    {!loan.isNonMember && (
                      <VerifiedBadge committeeRole={loan.committeeRole} />
                    )}
                  </div>
                  <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                    {loan.loanNumber} · {formatDate(loan.appliedAt)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="font-semibold">
                    <CurrencyDisplay amount={loan.principalAmount} />
                  </span>
                  <StatusBadge status={loan.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
