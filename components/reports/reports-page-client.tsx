"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/shared/status-badge";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { downloadCsv } from "@/lib/csv";
import { formatDate, formatDateTime } from "@/lib/utils";
import { Download, X } from "lucide-react";

function DateRangeFilter({
  startDate,
  endDate,
  onStartDate,
  onEndDate,
}: {
  startDate: string;
  endDate: string;
  onStartDate: (v: string) => void;
  onEndDate: (v: string) => void;
}) {
  const hasFilter = !!startDate || !!endDate;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        type="date"
        value={startDate}
        onChange={(e) => onStartDate(e.target.value)}
        className="w-40"
      />
      <span className="text-sm text-muted-foreground">to</span>
      <Input
        type="date"
        value={endDate}
        onChange={(e) => onEndDate(e.target.value)}
        className="w-40"
      />
      {hasFilter && (
        <Button
          size="icon-sm"
          variant="ghost"
          onClick={() => {
            onStartDate("");
            onEndDate("");
          }}
          aria-label="Clear date range"
        >
          <X className="size-4" />
        </Button>
      )}
    </div>
  );
}

function FinancialSummaryTab() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const summary = useQuery(api.reports.queries.getFinancialSummary, {
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  const balanceRows = summary
    ? [
        { label: "Total savings", value: summary.totalSavings },
        { label: "Total shares", value: summary.totalShares },
        { label: "— Long-term shares", value: summary.totalSharesLongTerm },
        { label: "— Short-term shares", value: summary.totalSharesShortTerm },
        { label: "— Capital shares", value: summary.totalSharesCapital },
        { label: "Total assets", value: summary.totalAssets },
        { label: "Outstanding loans", value: summary.totalOutstanding },
      ]
    : [];
  const periodRows = summary
    ? [
        { label: "Interest earned", value: summary.interestEarned },
        { label: "Fees collected", value: summary.feesCollected },
        { label: "Dividends paid", value: summary.dividendsPaid },
      ]
    : [];

  return (
    <div>
      <div className="mb-3">
        <DateRangeFilter
          startDate={startDate}
          endDate={endDate}
          onStartDate={setStartDate}
          onEndDate={setEndDate}
        />
        <p className="mt-1.5 text-xs text-muted-foreground">
          Date range scopes interest, fees, and dividends below. Balances are
          always as of now.
        </p>
      </div>
      {summary === undefined ? (
        <Skeleton className="h-64 w-full rounded-2xl" />
      ) : (
        <div className="space-y-4">
          <Card className="rounded-2xl border-border/50 p-6">
            <h3 className="mb-3 text-xs font-medium text-muted-foreground uppercase">
              Current balances
            </h3>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {balanceRows.map((r) => (
                <div
                  key={r.label}
                  className="flex items-center justify-between border-b border-border/60 pb-3"
                >
                  <dt className="text-sm text-muted-foreground">{r.label}</dt>
                  <dd className="font-semibold">
                    <CurrencyDisplay amount={r.value} />
                  </dd>
                </div>
              ))}
            </dl>
          </Card>
          <Card className="rounded-2xl border-border/50 p-6">
            <h3 className="mb-3 text-xs font-medium text-muted-foreground uppercase">
              {startDate || endDate ? "Selected period" : "All time"}
            </h3>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {periodRows.map((r) => (
                <div
                  key={r.label}
                  className="flex items-center justify-between border-b border-border/60 pb-3"
                >
                  <dt className="text-sm text-muted-foreground">{r.label}</dt>
                  <dd className="font-semibold">
                    <CurrencyDisplay amount={r.value} />
                  </dd>
                </div>
              ))}
            </dl>
          </Card>
        </div>
      )}
    </div>
  );
}

function MemberReportTab() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const members = useQuery(api.members.queries.list, {
    joinedStart: startDate || undefined,
    joinedEnd: endDate || undefined,
  });

  function handleExport() {
    if (!members) return;
    downloadCsv(
      "member-report.csv",
      [
        { key: "memberNumber", label: "Member No." },
        { key: "firstName", label: "First name" },
        { key: "lastName", label: "Last name" },
        { key: "phoneNumber", label: "Phone" },
        { key: "status", label: "Status" },
        { key: "savingsBalance", label: "Savings" },
        { key: "sharesBalance", label: "Shares" },
        { key: "dateJoined", label: "Date joined" },
      ],
      members
    );
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <DateRangeFilter
          startDate={startDate}
          endDate={endDate}
          onStartDate={setStartDate}
          onEndDate={setEndDate}
        />
        <Button size="sm" variant="outline" onClick={handleExport} disabled={!members}>
          <Download className="size-4" />
          Export CSV
        </Button>
      </div>
      {members === undefined ? (
        <Skeleton className="h-64 w-full rounded-2xl" />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow className="[&>th]:bg-muted/50">
                <TableHead>Member</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Savings</TableHead>
                <TableHead className="text-right">Shares</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((m, i) => (
                <TableRow key={m._id} className={i % 2 === 1 ? "bg-muted/20" : undefined}>
                  <TableCell>
                    {m.firstName} {m.lastName}{" "}
                    <span className="font-mono text-xs text-muted-foreground">
                      {m.memberNumber}
                    </span>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={m.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <CurrencyDisplay amount={m.savingsBalance} />
                  </TableCell>
                  <TableCell className="text-right">
                    <CurrencyDisplay amount={m.sharesBalance} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">{m.dateJoined}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function LoanReportTab() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const loans = useQuery(api.loans.queries.listAll, {
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  function handleExport() {
    if (!loans) return;
    downloadCsv(
      "loan-report.csv",
      [
        { key: "loanNumber", label: "Loan No." },
        { key: "memberName", label: "Member" },
        { key: "productName", label: "Product" },
        { key: "principalAmount", label: "Principal" },
        { key: "outstandingBalance", label: "Outstanding" },
        { key: "status", label: "Status" },
      ],
      loans
    );
  }

  const total = loans?.length ?? 0;
  const delinquent = loans?.filter((l) => l.status === "defaulted").length ?? 0;
  const delinquencyRate = total > 0 ? ((delinquent / total) * 100).toFixed(1) : "0.0";

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <DateRangeFilter
          startDate={startDate}
          endDate={endDate}
          onStartDate={setStartDate}
          onEndDate={setEndDate}
        />
        <Button size="sm" variant="outline" onClick={handleExport} disabled={!loans}>
          <Download className="size-4" />
          Export CSV
        </Button>
      </div>
      <p className="mb-3 text-sm text-muted-foreground">
        Delinquency rate: <span className="font-medium text-foreground">{delinquencyRate}%</span>
      </p>
      {loans === undefined ? (
        <Skeleton className="h-64 w-full rounded-2xl" />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow className="[&>th]:bg-muted/50">
                <TableHead>Loan</TableHead>
                <TableHead>Member</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Principal</TableHead>
                <TableHead className="text-right">Outstanding</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loans.map((l, i) => (
                <TableRow key={l._id} className={i % 2 === 1 ? "bg-muted/20" : undefined}>
                  <TableCell className="font-mono text-xs">{l.loanNumber}</TableCell>
                  <TableCell>{l.memberName}</TableCell>
                  <TableCell>{l.productName}</TableCell>
                  <TableCell className="text-right">
                    <CurrencyDisplay amount={l.principalAmount} />
                  </TableCell>
                  <TableCell className="text-right">
                    <CurrencyDisplay amount={l.outstandingBalance} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={l.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function TransactionReportTab() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const transactions = useQuery(api.reports.queries.getTransactionReport, {
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  function handleExport() {
    if (!transactions) return;
    downloadCsv(
      "transaction-report.csv",
      [
        { key: "referenceNumber", label: "Reference" },
        { key: "memberName", label: "Member" },
        { key: "type", label: "Type" },
        { key: "amount", label: "Amount" },
        { key: "status", label: "Status" },
        { key: "channel", label: "Channel" },
      ],
      transactions
    );
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <DateRangeFilter
          startDate={startDate}
          endDate={endDate}
          onStartDate={setStartDate}
          onEndDate={setEndDate}
        />
        <Button size="sm" variant="outline" onClick={handleExport} disabled={!transactions}>
          <Download className="size-4" />
          Export CSV
        </Button>
      </div>
      {transactions === undefined ? (
        <Skeleton className="h-64 w-full rounded-2xl" />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow className="[&>th]:bg-muted/50">
                <TableHead>Date</TableHead>
                <TableHead>Member</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((t, i) => (
                <TableRow key={t._id} className={i % 2 === 1 ? "bg-muted/20" : undefined}>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {formatDateTime(t._creationTime)}
                  </TableCell>
                  <TableCell>{t.memberName}</TableCell>
                  <TableCell className="capitalize">{t.type.replace(/_/g, " ")}</TableCell>
                  <TableCell className="text-right">
                    <CurrencyDisplay amount={t.amount} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={t.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

export function ReportsPageClient() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-heading text-2xl font-bold tracking-tight">
        Reports
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {formatDate(new Date().toISOString())} · pick any date range, export
        any report to CSV.
      </p>

      <Tabs defaultValue="financial" className="mt-6">
        <TabsList>
          <TabsTrigger value="financial">Financial summary</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="loans">Loans</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>
        <TabsContent value="financial" className="mt-4">
          <FinancialSummaryTab />
        </TabsContent>
        <TabsContent value="members" className="mt-4">
          <MemberReportTab />
        </TabsContent>
        <TabsContent value="loans" className="mt-4">
          <LoanReportTab />
        </TabsContent>
        <TabsContent value="transactions" className="mt-4">
          <TransactionReportTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
