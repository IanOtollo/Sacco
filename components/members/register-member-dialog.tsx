"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { RegisterMemberForm } from "@/components/members/register-member-form";
import { formatPhoneDisplay } from "@/lib/phone";
import { UserPlus, Copy, CheckCircle2 } from "lucide-react";

type Credentials = { memberNumber: string; phone: string; pin: string };

export function RegisterMemberDialog() {
  const [open, setOpen] = useState(false);
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const saccoName = useQuery(api.settings.queries.getSaccoName);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setCredentials(null);
    }
  }

  function copyCredentials() {
    if (!credentials) return;
    const text = `${saccoName ?? "Client Sacco"} login\nMember: ${credentials.memberNumber}\nPhone: ${formatPhoneDisplay(credentials.phone)}\nPIN: ${credentials.pin}`;
    void navigator.clipboard.writeText(text);
    toast.success("Credentials copied to clipboard");
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Button onClick={() => setOpen(true)}>
        <UserPlus className="size-4" />
        Register member
      </Button>
      <DialogContent className="max-h-[90vh] w-full max-w-3xl overflow-y-auto sm:max-w-3xl">
        {credentials ? (
          <div className="py-4 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-success/10 text-success">
              <CheckCircle2 className="size-6" />
            </div>
            <h2 className="mt-4 font-heading text-lg font-semibold">
              Member registered
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Share these credentials with the member. They&apos;ll be asked
              to set a personal PIN on first login.
            </p>
            <div className="mx-auto mt-6 max-w-xs space-y-2 rounded-xl border border-border bg-muted/40 p-4 text-left font-mono text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Member No.</span>
                <span>{credentials.memberNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phone</span>
                <span>{formatPhoneDisplay(credentials.phone)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">PIN</span>
                <span>{credentials.pin}</span>
              </div>
            </div>
            <div className="mt-6 flex justify-center gap-3">
              <Button variant="outline" onClick={copyCredentials}>
                <Copy className="size-4" />
                Copy
              </Button>
              <Button onClick={() => handleOpenChange(false)}>Done</Button>
            </div>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Register new member</DialogTitle>
              <DialogDescription>
                Creates a savings and shares account automatically with a
                system-generated PIN.
              </DialogDescription>
            </DialogHeader>
            <RegisterMemberForm onSuccess={setCredentials} />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
