"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { formatDateTime } from "@/lib/utils";
import { Receipt } from "lucide-react";

const CREDIT_TYPES = new Set([
  "deposit",
  "loan_disbursement",
  "share_purchase",
  "dividend_credit",
  "commission_credit",
]);

export function TransactionTable({ accountId }: { accountId: Id<"accounts"> }) {
  const transactions = useQuery(api.accounts.queries.getStatement, {
    accountId,
  });

  if (transactions === undefined) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <EmptyState
        icon={Receipt}
        title="No transactions yet"
        description="Deposits, withdrawals, and other activity on this account will show up here."
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <Table>
        <TableHeader>
          <TableRow className="[&>th]:bg-muted/50">
            <TableHead>Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Reference</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="text-right">Balance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((t, i) => {
            const isCredit = CREDIT_TYPES.has(t.type);
            return (
              <TableRow
                key={t._id}
                className={i % 2 === 1 ? "bg-muted/20" : undefined}
              >
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {formatDateTime(t._creationTime)}
                </TableCell>
                <TableCell>{t.description}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {t.referenceNumber}
                </TableCell>
                <TableCell>
                  <StatusBadge status={t.status} />
                </TableCell>
                <TableCell
                  className={`text-right font-mono ${isCredit ? "text-success" : "text-danger"}`}
                >
                  {isCredit ? "+" : "-"}
                  <CurrencyDisplay amount={t.amount} />
                </TableCell>
                <TableCell className="text-right">
                  <CurrencyDisplay amount={t.balanceAfter} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
