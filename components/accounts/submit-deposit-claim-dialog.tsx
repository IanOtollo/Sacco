"use client";

import { useState } from "react";
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

const schema = z.object({
  amount: z
    .string()
    .min(1, "Required")
    .refine((v) => Number(v) > 0, "Enter an amount greater than zero"),
  channel: z.enum(["cash", "mpesa", "bank_transfer"]),
  transactionReference: z.string().min(1, "Required"),
  note: z.string().optional(),
});

type Values = z.infer<typeof schema>;

const ACCOUNT_TYPE_LABEL: Record<string, string> = {
  savings: "Savings",
  shares_long_term: "Long-term shares",
  shares_short_term: "Short-term shares",
  shares_capital: "Capital shares",
};

export function SubmitDepositClaimDialog({
  open,
  onOpenChange,
  accountType,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountType: "savings" | "shares_long_term" | "shares_short_term" | "shares_capital";
}) {
  const submit = useMutation(api.depositClaims.mutations.submit);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: "",
      channel: "mpesa",
      transactionReference: "",
      note: "",
    },
  });

  function handleOpenChange(next: boolean) {
    onOpenChange(next);
    if (!next) {
      setSubmitted(false);
      form.reset();
    }
  }

  async function onSubmit(values: Values) {
    setSubmitting(true);
    try {
      await submit({
        accountType,
        amount: Number(values.amount),
        channel: values.channel,
        transactionReference: values.transactionReference,
        note: values.note || undefined,
      });
      setSubmitted(true);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not submit deposit claim"
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        {submitted ? (
          <div className="py-4 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-success/10 text-success">
              <CheckCircle2 className="size-6" />
            </div>
            <h2 className="mt-4 font-heading text-lg font-semibold">
              Deposit claim submitted
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Your treasurer will confirm it against the transaction and
              credit your account.
            </p>
            <Button className="mt-6 w-full" onClick={() => handleOpenChange(false)}>
              Done
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Report a deposit</DialogTitle>
              <DialogDescription>
                {ACCOUNT_TYPE_LABEL[accountType]} — the treasurer confirms
                this against the actual M-Pesa/bank message before it&apos;s
                credited.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount (KES)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" disabled={submitting} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="channel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Channel</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange} disabled={submitting}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="mpesa">M-Pesa</SelectItem>
                          <SelectItem value="bank_transfer">Bank transfer</SelectItem>
                          <SelectItem value="cash">Cash</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="transactionReference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>M-Pesa name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. JOHN KAMAU" disabled={submitting} {...field} />
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
                      <FormLabel>Note (optional)</FormLabel>
                      <FormControl>
                        <Textarea rows={2} disabled={submitting} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting && <Loader2 className="size-4 animate-spin" />}
                  Submit claim
                </Button>
              </form>
            </Form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
