"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/shared/status-badge";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { EmptyState } from "@/components/shared/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/utils";
import { Wallet } from "lucide-react";

export function MemberContributionsTab({ memberId }: { memberId: Id<"members"> }) {
  const contributions = useQuery(api.contributions.queries.getByMember, {
    memberId,
  });

  if (contributions === undefined) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (contributions.length === 0) {
    return (
      <EmptyState
        icon={Wallet}
        title="No contribution history yet"
        description="Contributions recorded for this member, across every folder, will appear here."
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <Table>
        <TableHeader>
          <TableRow className="[&>th]:bg-muted/50">
            <TableHead>Folder</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contributions.map((c, i) => (
            <TableRow
              key={c._id}
              className={i % 2 === 1 ? "bg-muted/20" : undefined}
            >
              <TableCell>{c.typeName}</TableCell>
              <TableCell className="text-muted-foreground">
                {formatDateTime(c._creationTime)}
              </TableCell>
              <TableCell className="text-right font-medium">
                <CurrencyDisplay amount={c.amount} />
              </TableCell>
              <TableCell>
                <StatusBadge status={c.status} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
