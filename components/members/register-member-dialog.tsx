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
import { UserPlus, Copy, CheckCircle2 } from "lucide-react";

type Credentials = { memberNumber: string; nationalId: string; password: string };

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
    const text = `${saccoName ?? "Edulaepe Credit and Saving"} login\nMember: ${credentials.memberNumber}\nNational ID: ${credentials.nationalId}\nPassword: ${credentials.password}`;
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
              to set a personal password on first login.
            </p>
            <div className="mx-auto mt-6 max-w-xs space-y-2 rounded-xl border border-border bg-muted/40 p-4 text-left font-mono text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Member No.</span>
                <span>{credentials.memberNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">National ID</span>
                <span>{credentials.nationalId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Password</span>
                <span>{credentials.password}</span>
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
                system-generated password.
              </DialogDescription>
            </DialogHeader>
            <RegisterMemberForm onSuccess={setCredentials} />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
