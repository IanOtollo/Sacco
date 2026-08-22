"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/shared/status-badge";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { Coins, Gift } from "lucide-react";

const ROUND_LABEL: Record<string, string> = {
  first: "1st share",
  second: "2nd share",
};

function RoundBadge({ round }: { round: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-secondary/10 px-2.5 py-0.5 text-xs font-medium text-secondary">
      {ROUND_LABEL[round] ?? round}
    </span>
  );
}

export function MemberDividendsPageClient() {
  const payouts = useQuery(api.dividends.queries.getMyPayouts);
  const redeem = useMutation(api.dividends.mutations.redeem);
  const [redeemId, setRedeemId] = useState<Id<"dividendPayouts"> | null>(null);

  const redeemTarget = payouts?.find((p) => p._id === redeemId);

  async function handleRedeem() {
    if (!redeemId) return;
    try {
      const result = await redeem({ payoutId: redeemId });
      toast.success(`KES ${result.amount.toLocaleString()} credited to your savings account`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not redeem dividend");
    }
  }

  const redeemable = payouts?.filter(
    (p) => p.round === "second" && p.status === "pending" && p.dividendStatus !== "cancelled"
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          Dividends
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your 1st share is credited to savings automatically. Your 2nd share
          waits here for you to redeem.
        </p>
      </div>

      {redeemable && redeemable.length > 0 && (
        <div className="space-y-3">
          {redeemable.map((p) => (
            <Card
              key={p._id}
              className="flex flex-col gap-4 rounded-2xl border-border/50 p-6 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent/20 text-accent-foreground">
                  <Gift className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">
                    {p.financialYear} — 2nd share ready to redeem
                  </p>
                  <p className="mt-0.5 text-lg font-bold">
                    <CurrencyDisplay amount={p.amount} />
                  </p>
                </div>
              </div>
              <Button onClick={() => setRedeemId(p._id)}>Redeem to savings</Button>
            </Card>
          ))}
        </div>
      )}

      <div>
        <h2 className="mb-2 text-sm font-semibold">History</h2>
        {payouts === undefined ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : payouts.length === 0 ? (
          <EmptyState
            icon={Coins}
            title="No dividends yet"
            description="Dividend payouts will appear here once declared by the SACCO."
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 text-left [&>th]:px-4 [&>th]:py-2.5">
                  <th>Financial year</th>
                  <th>Round</th>
                  <th className="text-right">Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((p, i) => (
                  <tr
                    key={p._id}
                    className={`[&>td]:px-4 [&>td]:py-2.5 ${i % 2 === 1 ? "bg-muted/20" : ""}`}
                  >
                    <td className="font-medium">{p.financialYear}</td>
                    <td>
                      <RoundBadge round={p.round} />
                    </td>
                    <td className="text-right">
                      <CurrencyDisplay amount={p.amount} />
                    </td>
                    <td>
                      <StatusBadge status={p.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmModal
        open={redeemId !== null}
        onOpenChange={(open) => !open && setRedeemId(null)}
        title="Redeem this dividend?"
        description={
          redeemTarget
            ? `KES ${redeemTarget.amount.toLocaleString()} will be credited to your savings account for ${redeemTarget.financialYear}.`
            : ""
        }
        confirmLabel="Redeem"
        onConfirm={handleRedeem}
      />
    </div>
  );
}
