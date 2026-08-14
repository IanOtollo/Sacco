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
import { ConfirmModal } from "@/components/shared/confirm-modal";
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

const ACCOUNT_TYPE_LABEL = {
  savings: "Savings",
  shares_long_term: "Long-term shares",
  shares_short_term: "Short-term shares",
  shares_capital: "Capital shares",
} as const;

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
  accountType: keyof typeof ACCOUNT_TYPE_LABEL;
}) {
  const deposit = useMutation(api.accounts.mutations.deposit);
  const withdraw = useMutation(api.accounts.mutations.withdraw);
  const [pending, setPending] = useState<Values | null>(null);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: "",
      channel: "cash",
      receiptNumber: "",
      narration: "",
    },
  });

  async function handleConfirm() {
    if (!pending) return;
    try {
      const action = mode === "deposit" ? deposit : withdraw;
      await action({
        memberId,
        type: accountType,
        amount: Number(pending.amount),
        channel: pending.channel,
        receiptNumber: pending.receiptNumber || undefined,
        narration: pending.narration || undefined,
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
      setPending(null);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {mode === "deposit" ? "Record deposit" : "Record withdrawal"}
            </DialogTitle>
            <DialogDescription>
              {ACCOUNT_TYPE_LABEL[accountType]} account · recorded manually
              against a cash/M-Pesa/bank receipt.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((values) => setPending(values))}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (KES)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" {...field} />
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
                    <Select value={field.value} onValueChange={field.onChange}>
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
                      <Input {...field} />
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
                      <Textarea rows={2} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full">
                {mode === "deposit" ? "Record deposit" : "Record withdrawal"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <ConfirmModal
        open={pending !== null}
        onOpenChange={(next) => !next && setPending(null)}
        title={mode === "deposit" ? "Confirm deposit" : "Confirm withdrawal"}
        description={
          pending
            ? `${mode === "deposit" ? "Deposit" : "Withdraw"} KES ${Number(pending.amount).toLocaleString()} ${mode === "deposit" ? "to" : "from"} this member's ${ACCOUNT_TYPE_LABEL[accountType].toLowerCase()} account via ${pending.channel.replace("_", " ")}. This cannot be undone.`
            : ""
        }
        confirmLabel={mode === "deposit" ? "Confirm deposit" : "Confirm withdrawal"}
        onConfirm={handleConfirm}
      />
    </>
  );
}
