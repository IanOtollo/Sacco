"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2 } from "lucide-react";

const schema = z.object({
  postalAddress: z.string().optional(),
  residentialAddress: z.string().optional(),
  nextOfKinName: z.string().min(1, "Required"),
  nextOfKinPhone: z.string().min(1, "Required"),
  nextOfKinRelationship: z.string().min(1, "Required"),
});

type Values = z.infer<typeof schema>;

export function EditProfileForm({
  memberId,
  defaults,
}: {
  memberId: Id<"members">;
  defaults: Values;
}) {
  const update = useMutation(api.members.mutations.update);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: defaults,
  });

  useEffect(() => {
    form.reset(defaults);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    defaults.postalAddress,
    defaults.residentialAddress,
    defaults.nextOfKinName,
    defaults.nextOfKinPhone,
    defaults.nextOfKinRelationship,
  ]);

  async function onSubmit(values: Values) {
    setSubmitting(true);
    try {
      await update({ memberId, patch: values });
      toast.success("Profile updated");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not update profile"
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="postalAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Postal address</FormLabel>
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
                <FormLabel>Residential address</FormLabel>
                <FormControl>
                  <Textarea rows={2} disabled={submitting} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FormField
            control={form.control}
            name="nextOfKinName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Next of kin name</FormLabel>
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
                <FormLabel>Next of kin phone</FormLabel>
                <FormControl>
                  <Input disabled={submitting} {...field} />
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
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="size-4 animate-spin" />}
          Save changes
        </Button>
      </form>
    </Form>
  );
}
