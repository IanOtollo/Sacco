"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAction } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { PASSWORD_MIN_LENGTH } from "@/lib/password";
import { normalizeKenyanPhone } from "@/lib/phone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/shared/password-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2, MailCheck } from "lucide-react";

const schema = z
  .object({
    firstName: z.string().min(1, "Required"),
    lastName: z.string().min(1, "Required"),
    nationalId: z.string().min(1, "Required"),
    phoneNumber: z
      .string()
      .min(1, "Required")
      .refine(
        (v) => {
          try {
            normalizeKenyanPhone(v);
            return true;
          } catch {
            return false;
          }
        },
        { message: "Enter a valid Kenyan phone number" }
      ),
    gender: z.enum(["male", "female"], { message: "Select a gender" }),
    registrationNumber: z.string().min(1, "Required"),
    password: z
      .string()
      .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`),
    confirmPassword: z.string(),
    // Honeypot — real users never see or fill this field; bots that
    // auto-fill every input do.
    website: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type Values = z.infer<typeof schema>;

export function ApplyForm() {
  const submit = useAction(api.membershipApplications.mutations.submit);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: "",
      lastName: "",
      nationalId: "",
      phoneNumber: "",
      gender: undefined,
      registrationNumber: "",
      password: "",
      confirmPassword: "",
      website: "",
    },
  });

  async function onSubmit(values: Values) {
    setSubmitting(true);
    try {
      await submit({
        firstName: values.firstName,
        lastName: values.lastName,
        nationalId: values.nationalId,
        phoneNumber: values.phoneNumber,
        gender: values.gender,
        registrationNumber: values.registrationNumber,
        password: values.password,
        website: values.website || undefined,
      });
      setSubmitted(true);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not submit your application"
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="py-4 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-success/10 text-success">
          <MailCheck className="size-6" />
        </div>
        <h2 className="mt-4 font-heading text-lg font-semibold">
          Application submitted
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          A Sacco administrator will review your application. You&apos;ll be
          able to sign in once it&apos;s approved.
        </p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="website"
          render={({ field }) => (
            <input
              {...field}
              type="text"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="absolute -left-[9999px] h-0 w-0 opacity-0"
            />
          )}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First name</FormLabel>
                <FormControl>
                  <Input disabled={submitting} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last name</FormLabel>
                <FormControl>
                  <Input disabled={submitting} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="nationalId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>National ID number</FormLabel>
              <FormControl>
                <Input disabled={submitting} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone number</FormLabel>
                <FormControl>
                  <Input type="tel" placeholder="0712345678" disabled={submitting} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gender</FormLabel>
                <Select value={field.value} onValueChange={field.onChange} disabled={submitting}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        {(value: "male" | "female" | null) =>
                          value === "male"
                            ? "Male"
                            : value === "female"
                              ? "Female"
                              : "Select gender"
                        }
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="registrationNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Registration number</FormLabel>
              <FormControl>
                <Input disabled={submitting} {...field} />
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
              <FormLabel>Password</FormLabel>
              <FormControl>
                <PasswordInput autoComplete="new-password" disabled={submitting} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm password</FormLabel>
              <FormControl>
                <PasswordInput autoComplete="new-password" disabled={submitting} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" size="lg" disabled={submitting}>
          {submitting && <Loader2 className="size-4 animate-spin" />}
          Submit application
        </Button>
      </form>
    </Form>
  );
}
