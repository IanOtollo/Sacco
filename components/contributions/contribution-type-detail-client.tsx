"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { RecordContributionModal } from "@/components/contributions/record-contribution-modal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/utils";
import { FolderOpen, Plus } from "lucide-react";

export function ContributionTypeDetailClient({ typeId }: { typeId: string }) {
  const type = useQuery(api.contributions.queries.getType, {
    typeId: typeId as Id<"contributionTypes">,
  });
  const contributions = useQuery(api.contributions.queries.listByType, {
    typeId: typeId as Id<"contributionTypes">,
  });
  const setActive = useMutation(api.contributions.mutations.setTypeActive);
  const [recordOpen, setRecordOpen] = useState(false);

  if (type === undefined || contributions === undefined) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (type === null) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <EmptyState icon={FolderOpen} title="Folder not found" />
      </div>
    );
  }

  const total = contributions.reduce((s, c) => s + c.amount, 0);

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <Card className="rounded-2xl border-border/50 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-heading text-xl font-bold tracking-tight">
              {type.name}
            </h1>
            {type.description && (
              <p className="mt-1 text-sm text-muted-foreground">{type.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Active</span>
            <Switch
              checked={type.isActive}
              onCheckedChange={(checked) => {
                void setActive({ typeId: type._id, isActive: checked }).then(() =>
                  toast.success(checked ? "Folder activated" : "Folder deactivated")
                );
              }}
            />
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Total collected</p>
            <p className="mt-0.5 text-2xl font-bold">
              <CurrencyDisplay amount={total} />
            </p>
          </div>
          <Button onClick={() => setRecordOpen(true)}>
            <Plus className="size-4" />
            Record contribution
          </Button>
        </div>
      </Card>

      {contributions.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No contributions recorded yet"
          description="Click Record contribution to add the first entry to this folder."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow className="[&>th]:bg-muted/50">
                <TableHead>Member</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Receipt</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contributions.map((c, i) => (
                <TableRow key={c._id} className={i % 2 === 1 ? "bg-muted/20" : undefined}>
                  <TableCell>
                    {c.memberName}{" "}
                    <span className="font-mono text-xs text-muted-foreground">
                      {c.memberNumber}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    <CurrencyDisplay amount={c.amount} />
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {c.receiptNumber ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDateTime(c._creationTime)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={c.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <RecordContributionModal
        open={recordOpen}
        onOpenChange={setRecordOpen}
        contributionTypeId={type._id}
        typeName={type.name}
      />
    </div>
  );
}
