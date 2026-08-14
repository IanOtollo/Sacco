"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { TransactionTable } from "@/components/accounts/transaction-table";
import { Wallet, Banknote, CalendarClock, Landmark } from "lucide-react";

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
  const sharesLongTerm = member.accounts.find((a) => a.type === "shares_long_term");
  const sharesShortTerm = member.accounts.find((a) => a.type === "shares_short_term");
  const sharesCapital = member.accounts.find((a) => a.type === "shares_capital");

  const shareAccounts = [
    { label: "Long-term shares", icon: CalendarClock, account: sharesLongTerm },
    { label: "Short-term shares", icon: Banknote, account: sharesShortTerm },
    { label: "Capital shares", icon: Landmark, account: sharesCapital },
  ];

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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl border-border/50 p-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Wallet className="size-4" />
            <span className="text-sm">Savings</span>
          </div>
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            {savings?.accountNumber}
          </p>
          <div className="mt-2 text-2xl font-bold">
            <CurrencyDisplay amount={savings?.balance ?? 0} />
          </div>
        </Card>
        {shareAccounts.map(({ label, icon: Icon, account }) => (
          <Card key={label} className="rounded-2xl border-border/50 p-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Icon className="size-4" />
              <span className="text-sm">{label}</span>
            </div>
            <p className="mt-1 font-mono text-xs text-muted-foreground">
              {account?.accountNumber}
            </p>
            <div className="mt-2 text-2xl font-bold">
              <CurrencyDisplay amount={account?.balance ?? 0} />
            </div>
          </Card>
        ))}
      </div>

      {savings && (
        <div>
          <h2 className="mb-2 text-sm font-semibold">Savings statement</h2>
          <TransactionTable accountId={savings._id} />
        </div>
      )}
      {shareAccounts.map(
        ({ label, account }) =>
          account && (
            <div key={account._id}>
              <h2 className="mb-2 text-sm font-semibold">{label} statement</h2>
              <TransactionTable accountId={account._id} />
            </div>
          )
      )}
    </div>
  );
}
