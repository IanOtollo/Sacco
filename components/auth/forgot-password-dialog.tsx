"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2, MailCheck } from "lucide-react";

const schema = z.object({
  nationalId: z.string().min(1, "National ID / registration number is required"),
  note: z.string().optional(),
});

type Values = z.infer<typeof schema>;

export function ForgotPasswordDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const requestReset = useMutation(api.passwordResets.mutations.requestReset);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const honeypotRef = useRef<HTMLInputElement>(null);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { nationalId: "", note: "" },
  });

  function handleOpenChange(next: boolean) {
    onOpenChange(next);
    if (!next) {
      setSent(false);
      form.reset();
    }
  }

  async function onSubmit(values: Values) {
    setSubmitting(true);
    try {
      await requestReset({
        nationalId: values.nationalId,
        note: values.note || undefined,
        website: honeypotRef.current?.value || undefined,
      });
      setSent(true);
    } catch {
      toast.error("Could not submit your request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        {sent ? (
          <div className="py-4 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-success/10 text-success">
              <MailCheck className="size-6" />
            </div>
            <h2 className="mt-4 font-heading text-lg font-semibold">
              Request submitted
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              If that ID matches an account on file, your Sacco administrator
              has been notified and will reach out with a new password once
              approved.
            </p>
            <Button className="mt-6 w-full" onClick={() => handleOpenChange(false)}>
              Done
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Forgot password?</DialogTitle>
              <DialogDescription>
                Submit your National ID / registration number and your Sacco
                administrator will review and approve a password reset.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <input
                  ref={honeypotRef}
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  className="absolute -left-[9999px] h-0 w-0 opacity-0"
                />
                <FormField
                  control={form.control}
                  name="nationalId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>National ID / registration number</FormLabel>
                      <FormControl>
                        <Input disabled={submitting} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="note"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Note for the admin (optional)</FormLabel>
                      <FormControl>
                        <Textarea rows={3} disabled={submitting} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting && <Loader2 className="size-4 animate-spin" />}
                  Submit request
                </Button>
              </form>
            </Form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
