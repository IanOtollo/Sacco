"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/shared/status-badge";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { EmptyState } from "@/components/shared/empty-state";
import { Users } from "lucide-react";

export function GuarantorsPageClient() {
  const guarantees = useQuery(api.loans.queries.getMyGuarantees);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-heading text-2xl font-bold tracking-tight">
        Guarantees
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Loans you&apos;ve been listed as a guarantor for.
      </p>

      <div className="mt-6 space-y-3">
        {guarantees === undefined ? (
          Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
          ))
        ) : guarantees.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No guarantees yet"
            description="Loans you've been listed as a guarantor for will show up here."
          />
        ) : (
          guarantees.map((g) => (
            <Card key={g._id} className="rounded-2xl border-border/50 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{g.borrowerName}</p>
                  <p className="text-sm text-muted-foreground">
                    <CurrencyDisplay amount={g.loanAmount} /> · you&apos;re guaranteeing{" "}
                    <CurrencyDisplay amount={g.amountGuaranteed} />
                  </p>
                </div>
                <StatusBadge status={g.loanStatus} />
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
