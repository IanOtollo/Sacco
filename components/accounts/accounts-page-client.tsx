"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { TransactionTable } from "@/components/accounts/transaction-table";
import { SubmitDepositClaimDialog } from "@/components/accounts/submit-deposit-claim-dialog";
import { Wallet, Banknote, CalendarClock, Landmark, PlusCircle } from "lucide-react";

type AccountType = "savings" | "shares_long_term" | "shares_short_term" | "shares_capital";

const ACCOUNT_SECTIONS: { type: AccountType; label: string; icon: typeof Wallet }[] = [
  { type: "savings", label: "Savings", icon: Wallet },
  { type: "shares_long_term", label: "Long-term shares", icon: CalendarClock },
  { type: "shares_short_term", label: "Short-term shares", icon: Banknote },
  { type: "shares_capital", label: "Capital shares", icon: Landmark },
];

export function AccountsPageClient() {
  const member = useQuery(api.members.queries.getMyMember);
  const [claimType, setClaimType] = useState<AccountType | null>(null);

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

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          My accounts
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Made a deposit? Report it below and your treasurer will confirm it
          against the transaction before crediting your account.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ACCOUNT_SECTIONS.map(({ type, label, icon: Icon }) => {
          const account = member.accounts.find((a) => a.type === type);
          return (
            <Card key={type} className="rounded-2xl border-border/50 p-6">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Icon className="size-4" />
                <span className="text-sm">{label}</span>
              </div>
              <p className="mt-1 font-mono text-xs text-muted-foreground">
                {account?.accountNumber}
              </p>
              <div className="mt-2 text-xl font-bold">
                <CurrencyDisplay amount={account?.balance ?? 0} />
              </div>
              <Button
                size="sm"
                variant="outline"
                className="mt-3 w-full"
                onClick={() => setClaimType(type)}
              >
                <PlusCircle className="size-3.5" />
                Report deposit
              </Button>
            </Card>
          );
        })}
      </div>

      {ACCOUNT_SECTIONS.map(({ type, label }) => {
        const account = member.accounts.find((a) => a.type === type);
        if (!account) return null;
        return (
          <div key={type}>
            <h2 className="mb-2 text-sm font-semibold">{label} statement</h2>
            <TransactionTable accountId={account._id} />
          </div>
        );
      })}

      {claimType && (
        <SubmitDepositClaimDialog
          open={claimType !== null}
          onOpenChange={(open) => !open && setClaimType(null)}
          accountType={claimType}
        />
      )}
    </div>
  );
}
