"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "@convex-dev/auth/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { portalHomeForRole } from "@/lib/constants";
import { normalizeKenyanPhone } from "@/lib/phone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const loginSchema = z.object({
  phone: z
    .string()
    .min(1, "Phone number is required")
    .refine(
      (value) => {
        try {
          normalizeKenyanPhone(value);
          return true;
        } catch {
          return false;
        }
      },
      { message: "Enter a valid Kenyan phone number, e.g. 0712345678" }
    ),
  pin: z.string().regex(/^\d{4}$/, "PIN must be exactly 4 digits"),
});

type LoginValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const { signIn, signOut } = useAuthActions();
  const { isAuthenticated } = useConvexAuth();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const recordLogin = useMutation(api.users.recordLogin);
  const hasRecordedLogin = useRef(false);

  const currentUser = useQuery(
    api.users.getCurrentUser,
    isAuthenticated ? {} : "skip"
  );

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { phone: "", pin: "" },
  });

  useEffect(() => {
    if (!isAuthenticated || currentUser === undefined || currentUser === null) {
      return;
    }

    if (currentUser.isActive === false) {
      toast.error("Your account has been suspended. Contact your admin.");
      void signOut();
      return;
    }

    if (!hasRecordedLogin.current) {
      hasRecordedLogin.current = true;
      void recordLogin({});
    }

    router.push(portalHomeForRole(currentUser.role));
  }, [isAuthenticated, currentUser, router, signOut, recordLogin]);

  async function onSubmit(values: LoginValues) {
    setSubmitting(true);
    try {
      await signIn("password", {
        phone: normalizeKenyanPhone(values.phone),
        password: values.pin,
        flow: "signIn",
      });
    } catch {
      toast.error("Invalid phone number or PIN. Please try again.");
      setSubmitting(false);
    }
  }

  const busy = submitting || (isAuthenticated && currentUser === undefined);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone number</FormLabel>
              <FormControl>
                <Input
                  type="tel"
                  inputMode="tel"
                  placeholder="0712 345 678"
                  autoComplete="tel"
                  disabled={busy}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="pin"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>PIN</FormLabel>
                <button
                  type="button"
                  className="text-xs text-primary hover:underline"
                  onClick={() =>
                    toast.info(
                      "PIN resets are handled by your Sacco administrator. Please contact them directly."
                    )
                  }
                >
                  Forgot PIN?
                </button>
              </div>
              <FormControl>
                <PinInput
                  autoComplete="current-password"
                  disabled={busy}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" size="lg" disabled={busy}>
          {busy && <Loader2 className="size-4 animate-spin" />}
          Sign in
        </Button>
      </form>
    </Form>
  );
}
