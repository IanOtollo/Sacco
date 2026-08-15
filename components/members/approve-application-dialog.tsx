"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { formatPhoneDisplay } from "@/lib/phone";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader2, CheckCircle2 } from "lucide-react";
import type { Doc } from "@/convex/_generated/dataModel";

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium">{value}</dd>
    </div>
  );
}

export function ApproveApplicationDialog({
  application,
  open,
  onOpenChange,
}: {
  application: Doc<"membershipApplications">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const approve = useMutation(api.membershipApplications.mutations.approve);
  const [submitting, setSubmitting] = useState(false);
  const [approved, setApproved] = useState(false);

  function handleOpenChange(next: boolean) {
    onOpenChange(next);
    if (!next) setApproved(false);
  }

  async function handleApprove() {
    setSubmitting(true);
    try {
      await approve({ applicationId: application._id });
      setApproved(true);
      toast.success("Application approved");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not approve application"
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        {approved ? (
          <div className="py-4 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-success/10 text-success">
              <CheckCircle2 className="size-6" />
            </div>
            <h2 className="mt-4 font-heading text-lg font-semibold">
              {application.firstName} {application.lastName} is now a member
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              They can sign in with the National ID and password they used
              to apply.
            </p>
            <Button className="mt-6" onClick={() => handleOpenChange(false)}>
              Done
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>
                Approve {application.firstName} {application.lastName}?
              </DialogTitle>
              <DialogDescription>
                Review what they submitted, then confirm to activate their
                membership. They can add next of kin and address details
                themselves once they sign in.
              </DialogDescription>
            </DialogHeader>
            <dl className="grid grid-cols-2 gap-4 rounded-xl border border-border/50 p-4">
              <Detail
                label="Name"
                value={`${application.firstName} ${application.lastName}`}
              />
              <Detail
                label="Gender"
                value={application.gender.charAt(0).toUpperCase() + application.gender.slice(1)}
              />
              <Detail label="National ID" value={application.nationalId} />
              <Detail
                label="Phone number"
                value={formatPhoneDisplay(application.phoneNumber)}
              />
              <Detail
                label="Registration number"
                value={application.registrationNumber}
              />
            </dl>
            <Button
              className="w-full"
              size="lg"
              disabled={submitting}
              onClick={handleApprove}
            >
              {submitting && <Loader2 className="size-4 animate-spin" />}
              Approve and activate membership
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
