"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/shared/status-badge";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDate } from "@/lib/utils";
import { Sprout } from "lucide-react";

export function MemberProjectsPageClient() {
  const projects = useQuery(api.projects.queries.listForMembers);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          Projects
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ventures the Sacco runs as an organisation.
        </p>
      </div>

      <div className="mt-6">
        {projects === undefined ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-40 w-full rounded-2xl" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <EmptyState icon={Sprout} title="No projects yet" />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {projects.map((p) => (
              <Card key={p._id} className="rounded-2xl border-border/50 p-6">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold">{p.name}</h3>
                    {p.category && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {p.category}
                      </p>
                    )}
                  </div>
                  <StatusBadge status={p.status} />
                </div>
                {p.description && (
                  <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">
                    {p.description}
                  </p>
                )}
                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {p.startDate && <span>Started {formatDate(p.startDate)}</span>}
                  {typeof p.investmentAmount === "number" && p.investmentAmount > 0 && (
                    <span>
                      <CurrencyDisplay amount={p.investmentAmount} /> invested
                    </span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
