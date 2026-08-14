"use client";

import { Card } from "@/components/ui/card";
import { CountUp } from "@/components/shared/count-up";
import { Users, PiggyBank, HandCoins } from "lucide-react";

export function HeroStats({
  stats,
}: {
  stats: {
    totalMembers: number;
    totalSavings: number;
    totalLoansDisbursed: number;
  };
}) {
  return (
    <div className="mt-16 grid gap-4 sm:grid-cols-3">
      <Card className="rounded-2xl border-border/50 p-8 text-center">
        <div className="mx-auto flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Users className="size-5" />
        </div>
        <div className="mt-3 text-3xl font-bold tracking-tight">
          <CountUp value={stats.totalMembers} />
        </div>
        <div className="mt-1 text-sm text-muted-foreground">
          Active Members
        </div>
      </Card>
      <Card className="rounded-2xl border-border/50 p-8 text-center">
        <div className="mx-auto flex size-11 items-center justify-center rounded-xl bg-success/10 text-success">
          <PiggyBank className="size-5" />
        </div>
        <div className="mt-3 text-3xl font-bold tracking-tight">
          <CountUp
            value={stats.totalSavings}
            prefix="KES "
            formatter={(n) =>
              Math.round(n).toLocaleString("en-KE", {
                maximumFractionDigits: 0,
              })
            }
          />
        </div>
        <div className="mt-1 text-sm text-muted-foreground">
          Total Savings Pool
        </div>
      </Card>
      <Card className="rounded-2xl border-border/50 p-8 text-center">
        <div className="mx-auto flex size-11 items-center justify-center rounded-xl bg-accent/20 text-accent-foreground">
          <HandCoins className="size-5" />
        </div>
        <div className="mt-3 text-3xl font-bold tracking-tight">
          <CountUp
            value={stats.totalLoansDisbursed}
            prefix="KES "
            formatter={(n) =>
              Math.round(n).toLocaleString("en-KE", {
                maximumFractionDigits: 0,
              })
            }
          />
        </div>
        <div className="mt-1 text-sm text-muted-foreground">
          Loans Disbursed
        </div>
      </Card>
    </div>
  );
}
