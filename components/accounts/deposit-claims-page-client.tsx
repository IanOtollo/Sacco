"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { RecordDepositDialog } from "@/components/accounts/record-deposit-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { formatDateTime } from "@/lib/utils";
import { Id } from "@/convex/_generated/dataModel";
import { ReceiptText, Check, X } from "lucide-react";

const ACCOUNT_TYPE_LABEL: Record<string, string> = {
  savings: "Savings",
  shares_long_term: "Long-term shares",
  shares_short_term: "Short-term shares",
  shares_capital: "Capital shares",
};

export function DepositClaimsPageClient() {
  const claims = useQuery(api.depositClaims.queries.listPending);
  const approve = useMutation(api.depositClaims.mutations.approve);
  const [approveTarget, setApproveTarget] = useState<Id<"depositClaims"> | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Id<"depositClaims"> | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const reject = useMutation(api.depositClaims.mutations.reject);

  async function handleApprove() {
    if (!approveTarget) return;
    try {
      await approve({ claimId: approveTarget });
      toast.success("Deposit approved and credited");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not approve");
    } finally {
      setApproveTarget(null);
    }
  }

  async function handleReject() {
    if (!rejectTarget || !rejectReason.trim()) return;
    try {
      await reject({ claimId: rejectTarget, reason: rejectReason.trim() });
      toast.success("Claim declined");
      setRejectTarget(null);
      setRejectReason("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not decline");
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            Deposit claims
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Confirm member-reported deposits against the actual transaction,
            or record one directly.
          </p>
        </div>
        <RecordDepositDialog />
      </div>

      <div className="mt-6 space-y-3">
        {claims === undefined ? (
          <>
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
          </>
        ) : claims.length === 0 ? (
          <EmptyState
            icon={ReceiptText}
            title="No pending deposit claims"
            description="Claims members submit from their portal will show up here."
          />
        ) : (
          claims.map((claim) => (
            <Card key={claim._id} className="rounded-2xl border-border/50 p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold">
                    {claim.memberName}{" "}
                    <span className="font-mono text-xs text-muted-foreground">
                      ({claim.memberNumber})
                    </span>
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    <CurrencyDisplay amount={claim.amount} /> to{" "}
                    {ACCOUNT_TYPE_LABEL[claim.accountType]} via{" "}
                    {claim.channel.replace("_", " ")}
                  </p>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    M-Pesa name: {claim.transactionReference}
                  </p>
                  {claim.note && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      &ldquo;{claim.note}&rdquo;
                    </p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    Submitted {formatDateTime(claim._creationTime)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setRejectTarget(claim._id)}
                  >
                    <X className="size-4" />
                    Decline
                  </Button>
                  <Button onClick={() => setApproveTarget(claim._id)}>
                    <Check className="size-4" />
                    Approve
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <ConfirmModal
        open={approveTarget !== null}
        onOpenChange={(open) => !open && setApproveTarget(null)}
        title="Approve this deposit?"
        description="This credits the member's account for the claimed amount. Make sure the M-Pesa name matches what actually came in."
        confirmLabel="Approve and credit"
        onConfirm={handleApprove}
      />

      <Dialog
        open={rejectTarget !== null}
        onOpenChange={(open) => !open && setRejectTarget(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Decline this deposit claim?</DialogTitle>
            <DialogDescription>
              The member will be notified with the reason you give below.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            rows={3}
            placeholder="Reason for declining..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>
              Cancel
            </Button>
            <Button
              className="bg-danger text-danger-foreground hover:bg-danger/90"
              disabled={!rejectReason.trim()}
              onClick={() => void handleReject()}
            >
              Decline claim
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
