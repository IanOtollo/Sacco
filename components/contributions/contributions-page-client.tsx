"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { AddContributionTypeDialog } from "@/components/contributions/add-contribution-type-dialog";
import { FolderOpen, Users } from "lucide-react";

export function ContributionsPageClient() {
  const types = useQuery(api.contributions.queries.listTypes);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            Contributions
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Each contribution folder keeps its own records — nothing mixes
            between them.
          </p>
        </div>
        <AddContributionTypeDialog />
      </div>

      <div className="mt-6">
        {types === undefined ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-36 w-full rounded-2xl" />
            ))}
          </div>
        ) : types.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title="No contribution folders yet"
            description='Click "Add Contribution" to create your first folder, e.g. monthly savings, building fund, or AGM fund.'
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {types.map((t) => (
              <Link key={t._id} href={`/admin/contributions/${t._id}`}>
                <Card className="h-full rounded-2xl border-border/50 p-6 transition-shadow hover:shadow-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <FolderOpen className="size-5" />
                    </div>
                    {!t.isActive && <Badge variant="outline">Inactive</Badge>}
                  </div>
                  <h3 className="mt-4 font-semibold">{t.name}</h3>
                  {t.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {t.description}
                    </p>
                  )}
                  <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3 text-sm">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Users className="size-3.5" />
                      {t.memberCount}
                    </span>
                    <span className="font-semibold">
                      <CurrencyDisplay amount={t.totalCollected} />
                    </span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
