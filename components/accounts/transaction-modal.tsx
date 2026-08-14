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
import { Loader2 } from "lucide-react";

const schema = z.object({
  amount: z
    .string()
    .min(1, "Required")
    .refine((v) => Number(v) > 0, "Enter an amount greater than zero"),
  channel: z.enum(["cash", "mpesa", "bank_transfer"]),
  receiptNumber: z.string().optional(),
  narration: z.string().optional(),
});

type Values = z.infer<typeof schema>;

export function TransactionModal({
  open,
  onOpenChange,
  mode,
  memberId,
  accountType,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "deposit" | "withdraw";
  memberId: Id<"members">;
  accountType: "savings" | "shares";
}) {
  const deposit = useMutation(api.accounts.mutations.deposit);
  const withdraw = useMutation(api.accounts.mutations.withdraw);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: "",
      channel: "cash",
      receiptNumber: "",
      narration: "",
    },
  });

  async function onSubmit(values: Values) {
    setSubmitting(true);
    try {
      const action = mode === "deposit" ? deposit : withdraw;
      await action({
        memberId,
        type: accountType,
        amount: Number(values.amount),
        channel: values.channel,
        receiptNumber: values.receiptNumber || undefined,
        narration: values.narration || undefined,
      });
      toast.success(mode === "deposit" ? "Deposit recorded" : "Withdrawal recorded");
      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : `Could not record ${mode === "deposit" ? "deposit" : "withdrawal"}`
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "deposit" ? "Record deposit" : "Record withdrawal"}
          </DialogTitle>
          <DialogDescription>
            {accountType === "savings" ? "Savings" : "Shares"} account ·
            recorded manually against a cash/M-Pesa/bank receipt.
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
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
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
              name="channel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Channel</FormLabel>
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
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="mpesa">M-Pesa</SelectItem>
                      <SelectItem value="bank_transfer">Bank transfer</SelectItem>
                    </SelectContent>
                  </Select>
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
            <FormField
              control={form.control}
              name="narration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Narration (optional)</FormLabel>
                  <FormControl>
                    <Textarea rows={2} disabled={submitting} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {mode === "deposit" ? "Record deposit" : "Record withdrawal"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
