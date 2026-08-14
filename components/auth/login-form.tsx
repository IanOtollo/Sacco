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
import { normalizeNationalId } from "@/lib/national-id";
import { PASSWORD_MIN_LENGTH } from "@/lib/password";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/shared/password-input";
import { ForgotPasswordDialog } from "@/components/auth/forgot-password-dialog";
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
  nationalId: z.string().min(1, "National ID / registration number is required"),
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`),
});

type LoginValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const { signIn, signOut } = useAuthActions();
  const { isAuthenticated } = useConvexAuth();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const recordLogin = useMutation(api.users.recordLogin);
  const hasRecordedLogin = useRef(false);

  const currentUser = useQuery(
    api.users.getCurrentUser,
    isAuthenticated ? {} : "skip"
  );

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { nationalId: "", password: "" },
  });

  useEffect(() => {
    if (!isAuthenticated || currentUser === undefined || currentUser === null) {
      return;
    }

    if (currentUser.isActive === false) {
      if (currentUser.applicationStatus === "pending") {
        toast.info("Your application is still awaiting admin approval.");
      } else if (currentUser.applicationStatus === "rejected") {
        toast.error(
          "Your application was not approved. Contact your Sacco administrator."
        );
      } else {
        toast.error("Your account has been suspended. Contact your admin.");
      }
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
        nationalId: normalizeNationalId(values.nationalId),
        password: values.password,
        flow: "signIn",
      });
    } catch {
      toast.error("Invalid National ID or password. Please try again.");
      setSubmitting(false);
    }
  }

  const busy = submitting || (isAuthenticated && currentUser === undefined);

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="nationalId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>National ID / registration number</FormLabel>
                <FormControl>
                  <Input
                    inputMode="text"
                    placeholder="e.g. 12345678"
                    autoComplete="username"
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
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Password</FormLabel>
                  <button
                    type="button"
                    className="text-xs text-primary hover:underline"
                    onClick={() => setForgotOpen(true)}
                  >
                    Forgot password?
                  </button>
                </div>
                <FormControl>
                  <PasswordInput
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
      <ForgotPasswordDialog open={forgotOpen} onOpenChange={setForgotOpen} />
    </>
  );
}
