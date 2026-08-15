"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmModal } from "@/components/shared/confirm-modal";

type CommitteeRole = "chairman" | "deputy_chairman" | "secretary" | "treasurer";

const ROLE_LABEL: Record<CommitteeRole | "none", string> = {
  none: "Member",
  chairman: "Chairman",
  deputy_chairman: "Deputy Chairman",
  secretary: "Secretary",
  treasurer: "Treasurer",
};

const ROLE_WARNING: Partial<Record<CommitteeRole, string>> = {
  chairman:
    "This will give this member full admin access (super admin) and step down the current chairman, if any.",
  deputy_chairman:
    "This will give this member full admin access (super admin) and step down the current deputy chairman, if any. The chairman is notified of everything the deputy does.",
};

export function CommitteeRoleSelect({
  memberId,
  currentRole,
}: {
  memberId: Id<"members">;
  currentRole: CommitteeRole | undefined;
}) {
  const currentUser = useQuery(api.users.getCurrentUser);
  const setCommitteeRole = useMutation(api.members.mutations.setCommitteeRole);
  const [pending, setPending] = useState<CommitteeRole | "none" | null>(null);

  if (currentUser?.role !== "super_admin") {
    return (
      <p className="text-sm text-muted-foreground">
        Role: <span className="font-medium text-foreground">{ROLE_LABEL[currentRole ?? "none"]}</span>
      </p>
    );
  }

  async function handleConfirm() {
    if (pending === null) return;
    try {
      await setCommitteeRole({
        memberId,
        committeeRole: pending === "none" ? undefined : pending,
      });
      toast.success("Role updated");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not update role"
      );
    } finally {
      setPending(null);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">Role</span>
        <Select
          value={currentRole ?? "none"}
          onValueChange={(v) => setPending(v as CommitteeRole | "none")}
        >
          <SelectTrigger className="w-full max-w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">{ROLE_LABEL.none}</SelectItem>
            <SelectItem value="chairman">{ROLE_LABEL.chairman}</SelectItem>
            <SelectItem value="deputy_chairman">{ROLE_LABEL.deputy_chairman}</SelectItem>
            <SelectItem value="secretary">{ROLE_LABEL.secretary}</SelectItem>
            <SelectItem value="treasurer">{ROLE_LABEL.treasurer}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <ConfirmModal
        open={pending !== null}
        onOpenChange={(open) => !open && setPending(null)}
        title={`Set role to "${pending ? ROLE_LABEL[pending] : ""}"?`}
        description={
          (pending && pending !== "none" ? ROLE_WARNING[pending] : undefined) ??
          "This changes what this member can see and do across the Sacco MIS."
        }
        confirmLabel="Confirm"
        onConfirm={handleConfirm}
      />
    </>
  );
}
