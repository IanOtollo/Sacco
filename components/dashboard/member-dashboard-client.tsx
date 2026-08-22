"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { StatusBadge } from "@/components/shared/status-badge";
import { PaybillCard } from "@/components/shared/paybill-info";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { formatDate, formatDateTime } from "@/lib/utils";
import {
  Wallet,
  Banknote,
  HandCoins,
  CreditCard,
  Megaphone,
  FileText,
  Handshake,
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
  "commission_credit",
]);

export function MemberDashboardClient() {
  const user = useQuery(api.users.getCurrentUser);
  const data = useQuery(api.reports.queries.getMyDashboard);
  const commission = useQuery(api.commissions.queries.getMySummary);
  const redeemCommission = useMutation(api.commissions.mutations.redeem);
  const [redeemOpen, setRedeemOpen] = useState(false);

  async function handleRedeemCommission() {
    try {
      const result = await redeemCommission({});
      toast.success(`KES ${result.amount.toLocaleString()} credited to your savings account`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not redeem commission");
    }
  }

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
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex-1 space-y-4">
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight">
              {greeting()}{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatDate(new Date().toISOString())}
            </p>
          </div>
          <Card className="w-full max-w-xs rounded-2xl border-border/50 p-4">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-accent/20 text-accent-foreground">
                <Handshake className="size-4" />
              </div>
              <span className="text-sm text-muted-foreground">Commission</span>
            </div>
            <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="text-2xl font-bold">
                  <CurrencyDisplay amount={commission?.pending ?? 0} />
                </div>
                {commission && commission.redeemed > 0 && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    KES {commission.total.toLocaleString()} earned lifetime
                  </p>
                )}
              </div>
              {!!commission?.pending && (
                <Button size="sm" variant="outline" onClick={() => setRedeemOpen(true)}>
                  Redeem to savings
                </Button>
              )}
            </div>
          </Card>
        </div>
        <PaybillCard title="Fund your account via M-Pesa" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/portal/accounts">
          <Card className="rounded-2xl border-border/50 p-6 transition-shadow hover:shadow-lg">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-success/10 text-success">
                <Wallet className="size-4" />
              </div>
              <span className="text-sm text-muted-foreground">Savings</span>
            </div>
            <div className="mt-3 text-2xl font-bold">
              <CurrencyDisplay amount={savingsBalance} />
            </div>
          </Card>
        </Link>
        <Link href="/portal/accounts">
          <Card className="rounded-2xl border-border/50 p-6 transition-shadow hover:shadow-lg">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
                <Banknote className="size-4" />
              </div>
              <span className="text-sm text-muted-foreground">Shares</span>
            </div>
            <div className="mt-3 text-2xl font-bold">
              <CurrencyDisplay amount={sharesBalance} />
            </div>
          </Card>
        </Link>
      </div>

      {activeLoan && (
        <Link href={`/portal/loans/${activeLoan._id}`}>
          <Card className="rounded-2xl border-border/50 p-6 transition-shadow hover:shadow-lg">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-lg bg-accent/20 text-accent-foreground">
                  <HandCoins className="size-4" />
                </div>
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

      <ConfirmModal
        open={redeemOpen}
        onOpenChange={setRedeemOpen}
        title="Redeem your commission?"
        description={
          commission?.pending
            ? `KES ${commission.pending.toLocaleString()} will be credited to your savings account.`
            : ""
        }
        confirmLabel="Redeem"
        onConfirm={handleRedeemCommission}
      />
    </div>
  );
}
