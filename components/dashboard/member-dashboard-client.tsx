"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDate, formatDateTime } from "@/lib/utils";
import {
  Wallet,
  Banknote,
  HandCoins,
  CreditCard,
  Megaphone,
  FileText,
} from "lucide-react";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

const CREDIT_TYPES = new Set([
  "deposit",
  "loan_disbursement",
  "share_purchase",
  "dividend_credit",
]);

export function MemberDashboardClient() {
  const user = useQuery(api.users.getCurrentUser);
  const data = useQuery(api.reports.queries.getMyDashboard);

  if (data === undefined) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  if (data === null) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-sm text-muted-foreground">
          No member profile is linked to your account. Contact your admin.
        </p>
      </div>
    );
  }

  const { savingsBalance, sharesBalance, activeLoan, nextInstallment, recentTransactions, announcements } = data;
  const percentRepaid =
    activeLoan && activeLoan.totalRepayable > 0
      ? Math.min(100, Math.round((activeLoan.totalPaid / activeLoan.totalRepayable) * 100))
      : 0;

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          {greeting()}{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {formatDate(new Date().toISOString())}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/portal/accounts">
          <Card className="rounded-2xl border-border/50 p-6 transition-shadow hover:shadow-lg">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Wallet className="size-4" />
              <span className="text-sm">Savings</span>
            </div>
            <div className="mt-2 text-2xl font-bold">
              <CurrencyDisplay amount={savingsBalance} />
            </div>
          </Card>
        </Link>
        <Link href="/portal/accounts">
          <Card className="rounded-2xl border-border/50 p-6 transition-shadow hover:shadow-lg">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Banknote className="size-4" />
              <span className="text-sm">Shares</span>
            </div>
            <div className="mt-2 text-2xl font-bold">
              <CurrencyDisplay amount={sharesBalance} />
            </div>
          </Card>
        </Link>
      </div>

      {activeLoan && (
        <Link href={`/portal/loans/${activeLoan._id}`}>
          <Card className="rounded-2xl border-border/50 p-6 transition-shadow hover:shadow-lg">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <HandCoins className="size-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Active loan</span>
              </div>
              <StatusBadge status={activeLoan.status} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Outstanding</p>
                <p className="mt-0.5 font-semibold">
                  <CurrencyDisplay amount={activeLoan.outstandingBalance} />
                </p>
              </div>
              {nextInstallment && (
                <div>
                  <p className="text-muted-foreground">Next payment due</p>
                  <p className="mt-0.5 font-semibold">
                    {formatDate(nextInstallment.dueDate)} ·{" "}
                    <CurrencyDisplay amount={nextInstallment.totalDue} />
                  </p>
                </div>
              )}
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{percentRepaid}% repaid</span>
              </div>
              <Progress value={percentRepaid} className="mt-1.5 h-1.5" />
            </div>
          </Card>
        </Link>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Button
          variant="outline"
          className="h-auto flex-col gap-1.5 py-4"
          nativeButton={false}
          render={
            <Link href="/portal/accounts">
              <Wallet className="size-5" />
              <span className="text-xs">Accounts</span>
            </Link>
          }
        />
        <Button
          variant="outline"
          className="h-auto flex-col gap-1.5 py-4"
          nativeButton={false}
          render={
            <Link href="/portal/loans/apply">
              <HandCoins className="size-5" />
              <span className="text-xs">Apply for loan</span>
            </Link>
          }
        />
        <Button
          variant="outline"
          className="h-auto flex-col gap-1.5 py-4"
          nativeButton={false}
          render={
            <Link href="/portal/loans">
              <CreditCard className="size-5" />
              <span className="text-xs">Repay loan</span>
            </Link>
          }
        />
        <Button
          variant="outline"
          className="h-auto flex-col gap-1.5 py-4"
          nativeButton={false}
          render={
            <Link href="/portal/accounts">
              <FileText className="size-5" />
              <span className="text-xs">Statement</span>
            </Link>
          }
        />
      </div>

      <Card className="rounded-2xl border-border/50 p-6">
        <h2 className="text-sm font-semibold">Recent transactions</h2>
        {recentTransactions.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No transactions yet.
          </p>
        ) : (
          <div className="mt-3 space-y-2.5">
            {recentTransactions.map((t) => (
              <div key={t._id} className="flex items-center justify-between text-sm">
                <div>
                  <p>{t.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(t._creationTime)}
                  </p>
                </div>
                <span
                  className={`font-mono ${CREDIT_TYPES.has(t.type) ? "text-success" : "text-danger"}`}
                >
                  {CREDIT_TYPES.has(t.type) ? "+" : "-"}
                  <CurrencyDisplay amount={t.amount} />
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {announcements.length > 0 && (
        <Card className="rounded-2xl border-border/50 p-6">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <Megaphone className="size-4" />
              Announcements
            </h2>
            <Link href="/portal/updates" className="text-xs text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="mt-3 space-y-3">
            {announcements.map((a) => (
              <div key={a._id}>
                <p className="text-sm font-medium">{a.title}</p>
                <p className="line-clamp-1 text-xs text-muted-foreground">
                  {a.content}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
