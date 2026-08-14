"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Users } from "lucide-react";

export function MemberTable({
  search,
  status,
}: {
  search: string;
  status?: "active" | "suspended" | "dormant" | "exited";
}) {
  const members = useQuery(api.members.queries.list, { search, status });

  if (members === undefined) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No members found"
        description="Try adjusting your search or filters, or register a new member to get started."
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <Table>
        <TableHeader>
          <TableRow className="[&>th]:bg-muted/50">
            <TableHead>Member No.</TableHead>
            <TableHead>Full name</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Savings</TableHead>
            <TableHead className="text-right">Shares</TableHead>
            <TableHead>Joined</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((m, i) => (
            <TableRow
              key={m._id}
              className={i % 2 === 1 ? "bg-muted/20" : undefined}
            >
              <TableCell className="font-mono text-xs">
                <Link
                  href={`/admin/members/${m._id}`}
                  className="text-primary hover:underline"
                >
                  {m.memberNumber}
                </Link>
              </TableCell>
              <TableCell>
                <Link href={`/admin/members/${m._id}`} className="font-medium">
                  {m.firstName} {m.lastName}
                </Link>
              </TableCell>
              <TableCell className="font-mono text-xs">
                {m.phoneNumber}
              </TableCell>
              <TableCell>
                <StatusBadge status={m.status} />
              </TableCell>
              <TableCell className="text-right">
                <CurrencyDisplay amount={m.savingsBalance} />
              </TableCell>
              <TableCell className="text-right">
                <CurrencyDisplay amount={m.sharesBalance} />
              </TableCell>
              <TableCell className="text-muted-foreground">
                {m.dateJoined}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
