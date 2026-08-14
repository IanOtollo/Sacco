"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/shared/status-badge";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ProjectForm } from "@/components/projects/project-form";
import { formatDate } from "@/lib/utils";
import { Sprout, Plus, Pencil, Trash2 } from "lucide-react";

export function ProjectsPageClient() {
  const projects = useQuery(api.projects.queries.list);
  const remove = useMutation(api.projects.mutations.remove);

  const [dialogState, setDialogState] = useState<
    { mode: "create" } | { mode: "edit"; project: Doc<"projects"> } | null
  >(null);
  const [deleteTarget, setDeleteTarget] = useState<Doc<"projects"> | null>(null);

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await remove({ projectId: deleteTarget._id });
      toast.success("Project removed");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not remove project"
      );
    } finally {
      setDeleteTarget(null);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            Projects
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ventures the Sacco runs as an organisation — chicken coops,
            farming, and anything else worth keeping a record of.
          </p>
        </div>
        <Button onClick={() => setDialogState({ mode: "create" })}>
          <Plus className="size-4" />
          Add project
        </Button>
      </div>

      <div className="mt-6">
        {projects === undefined ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-40 w-full rounded-2xl" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <EmptyState
            icon={Sprout}
            title="No projects yet"
            description="Add the Sacco's first project — a chicken coop, a farm, anything the Sacco runs as an organisation."
            action={
              <Button onClick={() => setDialogState({ mode: "create" })}>
                <Plus className="size-4" />
                Add project
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                <div className="mt-4 flex justify-end gap-1.5 border-t border-border/60 pt-3">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDialogState({ mode: "edit", project: p })}
                  >
                    <Pencil className="size-3.5" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-danger hover:text-danger"
                    onClick={() => setDeleteTarget(p)}
                  >
                    <Trash2 className="size-3.5" />
                    Remove
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog
        open={dialogState !== null}
        onOpenChange={(open) => !open && setDialogState(null)}
      >
        <DialogContent className="max-h-[90vh] w-full max-w-2xl overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {dialogState?.mode === "edit" ? "Edit project" : "Add project"}
            </DialogTitle>
            <DialogDescription>
              Members can view these from their portal, but only admins can
              add or edit them.
            </DialogDescription>
          </DialogHeader>
          <ProjectForm
            project={dialogState?.mode === "edit" ? dialogState.project : undefined}
            onSuccess={() => setDialogState(null)}
          />
        </DialogContent>
      </Dialog>

      <ConfirmModal
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Remove this project?"
        description={
          deleteTarget
            ? `This permanently deletes "${deleteTarget.name}" from your records.`
            : ""
        }
        confirmLabel="Remove"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}
