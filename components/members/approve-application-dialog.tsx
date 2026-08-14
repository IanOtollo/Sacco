"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { normalizeKenyanPhone } from "@/lib/phone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Loader2, CheckCircle2 } from "lucide-react";
import type { Doc } from "@/convex/_generated/dataModel";

const schema = z.object({
  middleName: z.string().optional(),
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
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["male", "female", "other"]),
  occupation: z.string().optional(),
  employer: z.string().optional(),
  postalAddress: z.string().optional(),
  residentialAddress: z.string().optional(),
  nextOfKinName: z.string().min(1, "Required"),
  nextOfKinPhone: z.string().min(1, "Required"),
  nextOfKinRelationship: z.string().min(1, "Required"),
});

type Values = z.infer<typeof schema>;

export function ApproveApplicationDialog({
  application,
  open,
  onOpenChange,
}: {
  application: Doc<"membershipApplications">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const approve = useMutation(api.membershipApplications.mutations.approve);
  const [submitting, setSubmitting] = useState(false);
  const [approved, setApproved] = useState(false);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      middleName: "",
      phoneNumber: "",
      email: "",
      dateOfBirth: "",
      gender: "male",
      occupation: "",
      employer: "",
      postalAddress: "",
      residentialAddress: "",
      nextOfKinName: "",
      nextOfKinPhone: "",
      nextOfKinRelationship: "",
    },
  });

  function handleOpenChange(next: boolean) {
    onOpenChange(next);
    if (!next) {
      setApproved(false);
      form.reset();
    }
  }

  async function onSubmit(values: Values) {
    setSubmitting(true);
    try {
      await approve({
        applicationId: application._id,
        middleName: values.middleName || undefined,
        phoneNumber: values.phoneNumber,
        email: values.email || undefined,
        dateOfBirth: values.dateOfBirth || undefined,
        gender: values.gender,
        occupation: values.occupation || undefined,
        employer: values.employer || undefined,
        postalAddress: values.postalAddress || undefined,
        residentialAddress: values.residentialAddress || undefined,
        nextOfKinName: values.nextOfKinName,
        nextOfKinPhone: values.nextOfKinPhone,
        nextOfKinRelationship: values.nextOfKinRelationship,
      });
      setApproved(true);
      toast.success("Application approved");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not approve application"
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] w-full max-w-2xl overflow-y-auto sm:max-w-2xl">
        {approved ? (
          <div className="py-4 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-success/10 text-success">
              <CheckCircle2 className="size-6" />
            </div>
            <h2 className="mt-4 font-heading text-lg font-semibold">
              {application.firstName} {application.lastName} is now a member
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              They can sign in with the National ID and password they used
              to apply.
            </p>
            <Button className="mt-6" onClick={() => handleOpenChange(false)}>
              Done
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>
                Approve {application.firstName} {application.lastName}
              </DialogTitle>
              <DialogDescription>
                National ID {application.nationalId} · Registration No.{" "}
                {application.registrationNumber}. Complete the remaining
                details to activate their membership.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="middleName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Middle name (optional)</FormLabel>
                        <FormControl>
                          <Input disabled={submitting} {...field} />
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
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={submitting}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email (optional)</FormLabel>
                        <FormControl>
                          <Input type="email" disabled={submitting} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of birth (optional)</FormLabel>
                        <FormControl>
                          <Input type="date" disabled={submitting} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="occupation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Occupation (optional)</FormLabel>
                        <FormControl>
                          <Input disabled={submitting} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="employer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Employer (optional)</FormLabel>
                        <FormControl>
                          <Input disabled={submitting} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="postalAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Postal address (optional)</FormLabel>
                        <FormControl>
                          <Textarea rows={2} disabled={submitting} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="residentialAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Residential address (optional)</FormLabel>
                        <FormControl>
                          <Textarea rows={2} disabled={submitting} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-foreground">Next of kin</h3>
                  <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="nextOfKinName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full name</FormLabel>
                          <FormControl>
                            <Input disabled={submitting} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="nextOfKinPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone number</FormLabel>
                          <FormControl>
                            <Input type="tel" disabled={submitting} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="nextOfKinRelationship"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Relationship</FormLabel>
                          <FormControl>
                            <Input disabled={submitting} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                  {submitting && <Loader2 className="size-4 animate-spin" />}
                  Approve and activate membership
                </Button>
              </form>
            </Form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
