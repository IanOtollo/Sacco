"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { LoanCard } from "@/components/loans/loan-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { HandCoins, Plus } from "lucide-react";

const ACTIVE_STATUSES = new Set(["disbursed", "active"]);

export function LoansPageClient() {
  const loans = useQuery(api.loans.queries.listMine);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            My loans
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Apply for a loan or track your existing ones.
          </p>
        </div>
        <Button
          nativeButton={false}
          render={
            <Link href="/portal/loans/apply">
              <Plus className="size-4" />
              Apply for loan
            </Link>
          }
        />
      </div>

      {loans === undefined ? (
        <div className="mt-6 space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-2xl" />
          ))}
        </div>
      ) : loans.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={HandCoins}
            title="No loans yet"
            description="Apply for your first loan to get started."
            action={
              <Button
                nativeButton={false}
                render={<Link href="/portal/loans/apply">Apply for loan</Link>}
              />
            }
          />
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {loans
              .filter((l) => ACTIVE_STATUSES.has(l.status))
              .map((loan) => (
                <LoanCard key={loan._id} loan={{ ...loan, productName: loan.productName }} />
              ))}
          </div>

          <div className="mt-8">
            <h2 className="mb-2 text-sm font-semibold">History</h2>
            <div className="overflow-x-auto rounded-xl border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="[&>th]:bg-muted/50">
                    <TableHead>Loan</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loans.map((loan, i) => (
                    <TableRow
                      key={loan._id}
                      className={i % 2 === 1 ? "bg-muted/20" : undefined}
                    >
                      <TableCell>
                        <Link
                          href={`/portal/loans/${loan._id}`}
                          className="font-mono text-xs text-primary hover:underline"
                        >
                          {loan.loanNumber}
                        </Link>
                      </TableCell>
                      <TableCell>{loan.productName}</TableCell>
                      <TableCell className="text-right">
                        <CurrencyDisplay amount={loan.principalAmount} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={loan.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
