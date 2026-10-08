"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/shared/status-badge";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { VerifiedBadge } from "@/components/shared/verified-badge";
import { LoadMore } from "@/components/shared/load-more";
import { FolderOpen, Users } from "lucide-react";

function initials(first: string, last: string) {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
}

const PAGE_SIZE = 24;

export type MemberSort = "newest" | "name";

export function MemberFolderGrid({
  search,
  status,
  sort,
  onLoaded,
}: {
  search: string;
  status?: "active" | "suspended" | "dormant" | "exited";
  sort: MemberSort;
  onLoaded?: (rows: Array<Record<string, unknown>>) => void;
}) {
  const {
    results: members,
    status: pageStatus,
    loadMore,
  } = usePaginatedQuery(
    api.members.queries.listPage,
    { search, status, sort },
    { initialNumItems: PAGE_SIZE }
  );

  // Report loaded rows up for CSV export (the page holds what's been loaded).
  useEffect(() => {
    if (pageStatus !== "LoadingFirstPage") onLoaded?.(members);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [members, pageStatus]);

  if (pageStatus === "LoadingFirstPage") {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-36 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No members found"
        description="Try adjusting your search or filters. New members appear here once their application is approved."
      />
    );
  }

  return (
    <>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {members.map((m) => (
        <Link key={m._id} href={`/admin/members/${m._id}`}>
          <Card className="h-full rounded-2xl border-border/50 p-6 transition-shadow hover:shadow-lg">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="size-11">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {initials(m.firstName, m.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <FolderOpen className="absolute -right-1 -bottom-1 size-3 rounded-full bg-card text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="flex items-center gap-1 truncate font-semibold">
                    <span className="truncate">
                      {m.firstName} {m.lastName}
                    </span>
                    <VerifiedBadge committeeRole={m.committeeRole} className="size-3.5" />
                  </p>
                  <p className="font-mono text-xs text-muted-foreground">
                    {m.memberNumber}
                  </p>
                </div>
              </div>
              <StatusBadge status={m.status} />
            </div>
            <p className="mt-3 font-mono text-xs text-muted-foreground">
              {m.phoneNumber}
            </p>
            <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Savings</p>
                <p className="font-semibold">
                  <CurrencyDisplay amount={m.savingsBalance} />
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Shares</p>
                <p className="font-semibold">
                  <CurrencyDisplay amount={m.sharesBalance} />
                </p>
              </div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
    <LoadMore status={pageStatus} onLoadMore={loadMore} pageSize={PAGE_SIZE} />
    </>
  );
}
