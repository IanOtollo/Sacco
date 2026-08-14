"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { TransactionTable } from "@/components/accounts/transaction-table";
import { Wallet, Banknote } from "lucide-react";

export function AccountsPageClient() {
  const member = useQuery(api.members.queries.getMyMember);

  if (member === undefined) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (member === null) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-sm text-muted-foreground">
          No accounts are linked to your profile yet. Contact your admin.
        </p>
      </div>
    );
  }

  const savings = member.accounts.find((a) => a.type === "savings");
  const shares = member.accounts.find((a) => a.type === "shares");

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          My accounts
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Deposits and withdrawals are recorded by your Sacco admin against a
          cash, M-Pesa, or bank receipt.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="rounded-2xl border-border/50 p-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Wallet className="size-4" />
            <span className="text-sm">Savings</span>
          </div>
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            {savings?.accountNumber}
          </p>
          <div className="mt-2 text-3xl font-bold">
            <CurrencyDisplay amount={savings?.balance ?? 0} />
          </div>
        </Card>
        <Card className="rounded-2xl border-border/50 p-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Banknote className="size-4" />
            <span className="text-sm">Shares</span>
          </div>
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            {shares?.accountNumber}
          </p>
          <div className="mt-2 text-3xl font-bold">
            <CurrencyDisplay amount={shares?.balance ?? 0} />
          </div>
        </Card>
      </div>

      {savings && (
        <div>
          <h2 className="mb-2 text-sm font-semibold">Savings statement</h2>
          <TransactionTable accountId={savings._id} />
        </div>
      )}
      {shares && (
        <div>
          <h2 className="mb-2 text-sm font-semibold">Shares statement</h2>
          <TransactionTable accountId={shares._id} />
        </div>
      )}
    </div>
  );
}
