"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AnnouncementForm } from "@/components/announcements/announcement-form";
import { formatDate } from "@/lib/utils";
import { Plus, Megaphone, Pencil, Trash2, Send, EyeOff } from "lucide-react";

const PRIORITY_TONE: Record<string, string> = {
  normal: "bg-muted text-muted-foreground",
  important: "bg-warning/15 text-warning-foreground",
  urgent: "bg-danger/10 text-danger",
};

export function AnnouncementsPageClient() {
  const announcements = useQuery(api.announcements.queries.listAll);
  const setPublished = useMutation(api.announcements.mutations.setPublished);
  const remove = useMutation(api.announcements.mutations.remove);

  const [dialogState, setDialogState] = useState<
    { mode: "create" } | { mode: "edit"; announcement: Doc<"announcements"> } | null
  >(null);
  const [deleteTarget, setDeleteTarget] = useState<Doc<"announcements"> | null>(null);
  const [publishTarget, setPublishTarget] = useState<Doc<"announcements"> | null>(null);

  async function handleUnpublish(a: Doc<"announcements">) {
    try {
      await setPublished({ announcementId: a._id, isPublished: false });
      toast.success("Unpublished");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update");
    }
  }

  async function handleConfirmPublish() {
    if (!publishTarget) return;
    try {
      await setPublished({ announcementId: publishTarget._id, isPublished: true });
      toast.success("Published");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await remove({ announcementId: deleteTarget._id });
      toast.success("Announcement deleted");
      setDeleteTarget(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete");
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            Announcements
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Publish updates to members, admins, or everyone.
          </p>
        </div>
        <Button onClick={() => setDialogState({ mode: "create" })}>
          <Plus className="size-4" />
          New announcement
        </Button>
      </div>

      <div className="mt-6 space-y-3">
        {announcements === undefined ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))
        ) : announcements.length === 0 ? (
          <EmptyState
            icon={Megaphone}
            title="No announcements yet"
            description="Create your first announcement to reach members."
          />
        ) : (
          announcements.map((a) => (
            <Card key={a._id} className="rounded-2xl border-border/50 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{a.title}</h3>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_TONE[a.priority]}`}
                    >
                      {a.priority}
                    </span>
                    <StatusBadge status={a.targetAudience} />
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
                    {a.content}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {a.isPublished
                      ? `Published ${a.publishedAt ? formatDate(a.publishedAt) : ""}`
                      : "Draft"}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  {a.isPublished ? (
                    <Button size="sm" variant="outline" onClick={() => handleUnpublish(a)}>
                      <EyeOff className="size-3.5" />
                      Unpublish
                    </Button>
                  ) : (
                    <Button size="sm" onClick={() => setPublishTarget(a)}>
                      <Send className="size-3.5" />
                      Publish
                    </Button>
                  )}
                  <div className="flex gap-1">
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => setDialogState({ mode: "edit", announcement: a })}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      className="text-danger hover:text-danger"
                      onClick={() => setDeleteTarget(a)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <Dialog
        open={dialogState !== null}
        onOpenChange={(open) => !open && setDialogState(null)}
      >
        <DialogContent className="max-h-[90vh] w-full max-w-lg overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {dialogState?.mode === "edit" ? "Edit announcement" : "New announcement"}
            </DialogTitle>
          </DialogHeader>
          <AnnouncementForm
            announcement={dialogState?.mode === "edit" ? dialogState.announcement : undefined}
            onSuccess={() => setDialogState(null)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete this announcement?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This cannot be undone.
          </p>
          <Button variant="destructive" className="w-full" onClick={handleDelete}>
            Delete
          </Button>
        </DialogContent>
      </Dialog>

      <ConfirmModal
        open={publishTarget !== null}
        onOpenChange={(open) => !open && setPublishTarget(null)}
        title="Publish this announcement?"
        description={
          publishTarget
            ? `This immediately notifies every ${publishTarget.targetAudience === "all" ? "member and admin" : publishTarget.targetAudience === "members" ? "member" : "admin"}. You can unpublish later, but the notification can't be recalled.`
            : ""
        }
        confirmLabel="Publish"
        onConfirm={handleConfirmPublish}
      />
    </div>
  );
}
