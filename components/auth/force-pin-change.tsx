"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAction } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { PinInput } from "@/components/shared/pin-input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2, ShieldCheck } from "lucide-react";

const pinField = z.string().regex(/^\d{4}$/, "PIN must be exactly 4 digits");

const schema = z
  .object({
    newPin: pinField,
    confirmPin: z.string(),
  })
  .refine((data) => data.newPin === data.confirmPin, {
    message: "PINs do not match",
    path: ["confirmPin"],
  });

type Values = z.infer<typeof schema>;

export function ForcePinChange() {
  const completeChange = useAction(api.auth_actions.completeForcedPinChange);
  const { signOut } = useAuthActions();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { newPin: "", confirmPin: "" },
  });

  async function onSubmit(values: Values) {
    setSubmitting(true);
    try {
      await completeChange({ newPin: values.newPin });
      toast.success("PIN updated. Welcome aboard!");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not update your PIN. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <ShieldCheck className="size-6" />
          </div>
          <h1 className="font-heading text-xl font-semibold tracking-tight">
            Set a new PIN
          </h1>
          <p className="text-sm text-muted-foreground">
            For your security, you must set a personal 4-digit PIN before
            continuing.
          </p>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="newPin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New PIN</FormLabel>
                  <FormControl>
                    <PinInput
                      autoComplete="new-password"
                      disabled={submitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm new PIN</FormLabel>
                  <FormControl>
                    <PinInput
                      autoComplete="new-password"
                      disabled={submitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={submitting}
            >
              {submitting && <Loader2 className="size-4 animate-spin" />}
              Set PIN and continue
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              disabled={submitting}
              onClick={() => void signOut()}
            >
              Sign out
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
