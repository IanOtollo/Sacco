"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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

const INVITOR_COMMISSION = 200;

export type ApplicationWithInvitor = Doc<"membershipApplications"> & {
  invitorName?: string | null;
  invitorMemberNumber?: string | null;
};

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
  application: ApplicationWithInvitor;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const approve = useMutation(api.membershipApplications.mutations.approve);
  const registrationFee = useQuery(api.settings.queries.getPublicRegistrationFee);
  const [submitting, setSubmitting] = useState(false);
  const [approved, setApproved] = useState(false);
  const [feeConfirmed, setFeeConfirmed] = useState(false);

  function handleOpenChange(next: boolean) {
    onOpenChange(next);
    if (!next) {
      setApproved(false);
      setFeeConfirmed(false);
    }
  }

  async function handleApprove() {
    setSubmitting(true);
    try {
      await approve({ applicationId: application._id, confirmFeeReceived: feeConfirmed });
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

  const fee = registrationFee ?? 500;
  const invitorCommission = Math.min(INVITOR_COMMISSION, fee);
  const saccoShare = application.invitorMemberId ? fee - invitorCommission : fee;

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
              <Detail
                label="Invited by"
                value={
                  application.invitorName
                    ? `${application.invitorName} (${application.invitorMemberNumber})`
                    : "None"
                }
              />
            </dl>

            <div className="rounded-lg border border-border/50 p-4 text-sm">
              <p className="font-medium">
                Registration fee — KES {fee.toLocaleString()}
              </p>
              {application.invitorMemberId ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  KES {invitorCommission.toLocaleString()} goes to {application.invitorName}{" "}
                  as referral commission, KES {saccoShare.toLocaleString()} to the Sacco.
                </p>
              ) : (
                <p className="mt-1 text-xs text-muted-foreground">
                  No invitor selected — the full amount goes to the Sacco.
                </p>
              )}
              <label className="mt-3 flex items-center gap-2 text-sm">
                <Checkbox
                  checked={feeConfirmed}
                  onCheckedChange={(checked) => setFeeConfirmed(checked === true)}
                />
                I confirm the KES {fee.toLocaleString()} registration fee was received
              </label>
            </div>

            <Button
              className="w-full"
              size="lg"
              disabled={submitting || !feeConfirmed}
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
