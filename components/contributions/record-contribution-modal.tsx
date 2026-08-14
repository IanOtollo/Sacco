"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Loader2 } from "lucide-react";

const schema = z.object({
  savingsAmount: z.string(),
  sharesAmount: z.string(),
  receiptNumber: z.string().optional(),
});

type Values = z.infer<typeof schema>;

export function RecordContributionModal({
  open,
  onOpenChange,
  memberId,
  memberName,
  month,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberId: Id<"members">;
  memberName: string;
  month: string;
}) {
  const record = useMutation(api.contributions.mutations.record);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { savingsAmount: "", sharesAmount: "", receiptNumber: "" },
  });

  async function onSubmit(values: Values) {
    setSubmitting(true);
    try {
      await record({
        memberId,
        month,
        savingsAmount: Number(values.savingsAmount || 0),
        sharesAmount: Number(values.sharesAmount || 0),
        receiptNumber: values.receiptNumber || undefined,
      });
      toast.success("Contribution recorded");
      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not record contribution"
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Record contribution</DialogTitle>
          <DialogDescription>
            {memberName} · {month}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="savingsAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Savings amount (KES)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" disabled={submitting} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sharesAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Shares amount (KES)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" disabled={submitting} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="receiptNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Receipt number (optional)</FormLabel>
                  <FormControl>
                    <Input disabled={submitting} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              Save
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
