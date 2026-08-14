"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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
import { ScrollText, ChevronDown, ChevronRight } from "lucide-react";

function DetailsCell({ details }: { details: string }) {
  const [open, setOpen] = useState(false);
  let parsed: unknown = details;
  try {
    parsed = JSON.parse(details);
  } catch {
    // leave as raw string
  }
  const isEmpty =
    typeof parsed === "object" &&
    parsed !== null &&
    Object.keys(parsed).length === 0;

  if (isEmpty) return <span className="text-muted-foreground">—</span>;

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 text-xs text-primary hover:underline"
      >
        {open ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
        Details
      </button>
      {open && (
        <pre className="mt-1 max-w-xs overflow-x-auto rounded-md bg-muted p-2 text-[11px]">
          {JSON.stringify(parsed, null, 2)}
        </pre>
      )}
    </div>
  );
}

export function AuditPageClient() {
  const [action, setAction] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const entries = useQuery(api.audit.queries.list, {
    action: action || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-heading text-2xl font-bold tracking-tight">
        Audit log
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Every create, update, and financial action in the system.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        <Input
          value={action}
          onChange={(e) => setAction(e.target.value)}
          placeholder="Filter by action (e.g. loan.approve)"
          className="w-full sm:w-64"
        />
        <Input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="w-40"
        />
        <Input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="w-40"
        />
      </div>

      <div className="mt-6">
        {entries === undefined ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <EmptyState icon={ScrollText} title="No matching audit entries" />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <Table>
              <TableHeader>
                <TableRow className="[&>th]:bg-muted/50">
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((e, i) => (
                  <TableRow
                    key={e._id as Id<"auditLog">}
                    className={i % 2 === 1 ? "bg-muted/20" : undefined}
                  >
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatDateTime(e._creationTime)}
                    </TableCell>
                    <TableCell>{e.userName}</TableCell>
                    <TableCell className="font-mono text-xs">{e.action}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {e.entityType}
                    </TableCell>
                    <TableCell>
                      <DetailsCell details={e.details} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
