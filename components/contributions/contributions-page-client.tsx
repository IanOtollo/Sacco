"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { EmptyState } from "@/components/shared/empty-state";
import { RecordContributionModal } from "@/components/contributions/record-contribution-modal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Wallet } from "lucide-react";

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

export function ContributionsPageClient() {
  const [month, setMonth] = useState(currentMonth());
  const rows = useQuery(api.contributions.queries.getByMonth, { month });
  const [recordFor, setRecordFor] = useState<{
    memberId: Id<"members">;
    name: string;
  } | null>(null);

  const defaulters = rows?.filter((r) => r.status === "defaulted").length ?? 0;
  const paid = rows?.filter((r) => r.status === "paid").length ?? 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            Contributions
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track monthly savings and shares contributions.
          </p>
        </div>
        <Input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="w-full sm:w-48"
        />
      </div>

      {rows && (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Card className="rounded-2xl border-border/50 p-5">
            <p className="text-sm text-muted-foreground">Members</p>
            <p className="mt-1 text-2xl font-bold">{rows.length}</p>
          </Card>
          <Card className="rounded-2xl border-border/50 p-5">
            <p className="text-sm text-muted-foreground">Paid</p>
            <p className="mt-1 text-2xl font-bold text-success">{paid}</p>
          </Card>
          <Card className="rounded-2xl border-border/50 p-5">
            <p className="text-sm text-muted-foreground">Defaulters</p>
            <p className="mt-1 text-2xl font-bold text-danger">{defaulters}</p>
          </Card>
        </div>
      )}

      <div className="mt-6">
        {rows === undefined ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState icon={Wallet} title="No active members" />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <Table>
              <TableHeader>
                <TableRow className="[&>th]:bg-muted/50">
                  <TableHead>Member</TableHead>
                  <TableHead className="text-right">Savings</TableHead>
                  <TableHead className="text-right">Shares</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r, i) => (
                  <TableRow
                    key={r.memberId}
                    className={i % 2 === 1 ? "bg-muted/20" : undefined}
                  >
                    <TableCell>
                      <span className="font-medium">{r.name}</span>
                      <span className="ml-2 font-mono text-xs text-muted-foreground">
                        {r.memberNumber}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <CurrencyDisplay amount={r.savingsAmount} />
                    </TableCell>
                    <TableCell className="text-right">
                      <CurrencyDisplay amount={r.sharesAmount} />
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      <CurrencyDisplay amount={r.totalAmount} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={r.status} />
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setRecordFor({ memberId: r.memberId, name: r.name })
                        }
                      >
                        Record
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {recordFor && (
        <RecordContributionModal
          open={recordFor !== null}
          onOpenChange={(open) => !open && setRecordFor(null)}
          memberId={recordFor.memberId}
          memberName={recordFor.name}
          month={month}
        />
      )}
    </div>
  );
}
