"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAction } from "convex/react";
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
import { Loader2 } from "lucide-react";

const pinField = z.string().regex(/^\d{4}$/, "PIN must be exactly 4 digits");

const schema = z
  .object({
    currentPin: pinField,
    newPin: pinField,
    confirmPin: z.string(),
  })
  .refine((data) => data.newPin === data.confirmPin, {
    message: "PINs do not match",
    path: ["confirmPin"],
  });

type Values = z.infer<typeof schema>;

export function ChangePinForm() {
  const changePin = useAction(api.auth_actions.changePin);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { currentPin: "", newPin: "", confirmPin: "" },
  });

  async function onSubmit(values: Values) {
    setSubmitting(true);
    try {
      await changePin({
        currentPin: values.currentPin,
        newPin: values.newPin,
      });
      toast.success("PIN changed");
      form.reset();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not change PIN"
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FormField
            control={form.control}
            name="currentPin"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current PIN</FormLabel>
                <FormControl>
                  <PinInput
                    autoComplete="current-password"
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
        </div>
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="size-4 animate-spin" />}
          Change PIN
        </Button>
      </form>
    </Form>
  );
}
