"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { formatDate } from "@/lib/utils";
import { HandCoins } from "lucide-react";
import { IssueNonMemberLoanDialog } from "@/components/loans/issue-non-member-loan-dialog";
import { VerifiedBadge } from "@/components/shared/verified-badge";

const TABS = [
  { value: "pending_approval", label: "Pending approval" },
  { value: "active", label: "Active" },
  { value: "fully_paid", label: "Fully paid" },
  { value: "defaulted", label: "Defaulted" },
  { value: "all", label: "All" },
] as const;

function LoansTable({ status }: { status?: string }) {
  const router = useRouter();
  const loans = useQuery(api.loans.queries.listAll, { status });

  if (loans === undefined) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (loans.length === 0) {
    return (
      <EmptyState
        icon={HandCoins}
        title="No loans here"
        description="Loans matching this filter will show up here."
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <Table>
        <TableHeader>
          <TableRow className="[&>th]:bg-muted/50">
            <TableHead>Loan</TableHead>
            <TableHead>Applicant</TableHead>
            <TableHead>Product</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Guarantors</TableHead>
            <TableHead>Applied</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loans.map((loan, i) => (
            <TableRow
              key={loan._id}
              onClick={() => router.push(`/admin/loans/${loan._id}`)}
              className={`cursor-pointer hover:bg-muted/60 ${i % 2 === 1 ? "bg-muted/20" : ""}`}
            >
              <TableCell className="font-mono text-xs text-primary">
                {loan.loanNumber}
              </TableCell>
              <TableCell>
                <span className="flex items-center gap-1.5">
                  {loan.memberName}
                  {loan.isNonMember ? (
                    <span className="rounded-full bg-secondary/10 px-1.5 py-0.5 text-[10px] font-medium text-secondary">
                      Non-member
                    </span>
                  ) : (
                    <VerifiedBadge committeeRole={loan.committeeRole} />
                  )}
                </span>
              </TableCell>
              <TableCell>
                {loan.nonMemberLoanCategory === "emergency"
                  ? "Emergency Loan"
                  : loan.nonMemberLoanCategory === "development"
                    ? "Development Loan"
                    : loan.productName}
              </TableCell>
              <TableCell className="text-right">
                <CurrencyDisplay amount={loan.principalAmount} />
              </TableCell>
              <TableCell className="font-mono text-xs">
                {loan.guarantorsTotal > 0
                  ? `${loan.guarantorsAccepted}/${loan.guarantorsTotal}`
                  : "—"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDate(loan.appliedAt)}
              </TableCell>
              <TableCell>
                <StatusBadge status={loan.status} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function AdminLoansPageClient() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            Loans
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review applications and manage the active loan book.{" "}
            <VerifiedBadge className="inline" /> marks a verified Sacco
            member (colored by committee office) — everyone else is a
            non-member borrower.
          </p>
        </div>
        <IssueNonMemberLoanDialog />
      </div>

      <Tabs defaultValue="pending_approval" className="mt-6">
        <TabsList>
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {TABS.map((t) => (
          <TabsContent key={t.value} value={t.value} className="mt-4">
            <LoansTable status={t.value === "all" ? undefined : t.value} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
