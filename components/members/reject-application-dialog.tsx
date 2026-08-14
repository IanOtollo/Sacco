"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";

export function RejectApplicationDialog({
  applicationId,
  applicantName,
  open,
  onOpenChange,
}: {
  applicationId: Id<"membershipApplications">;
  applicantName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const reject = useMutation(api.membershipApplications.mutations.reject);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleOpenChange(next: boolean) {
    onOpenChange(next);
    if (!next) setReason("");
  }

  async function handleReject() {
    if (!reason.trim()) {
      toast.error("Please provide a reason for declining");
      return;
    }
    setSubmitting(true);
    try {
      await reject({ applicationId, reason: reason.trim() });
      toast.success("Application declined");
      handleOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not decline application"
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Decline {applicantName}&apos;s application</DialogTitle>
          <DialogDescription>
            They&apos;ll be notified with the reason you provide below.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          rows={3}
          placeholder="Reason for declining..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          disabled={submitting}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={() => void handleReject()}
            disabled={submitting}
            className="bg-danger text-danger-foreground hover:bg-danger/90"
          >
            {submitting && <Loader2 className="size-4 animate-spin" />}
            Decline application
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
