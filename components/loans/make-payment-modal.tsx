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
import { ConfirmModal } from "@/components/shared/confirm-modal";
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

const schema = z.object({
  amount: z
    .string()
    .min(1, "Required")
    .refine((v) => Number(v) > 0, "Enter an amount greater than zero"),
});

type Values = z.infer<typeof schema>;

export function MakePaymentModal({
  open,
  onOpenChange,
  loanId,
  monthlyRepayment,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loanId: Id<"loans">;
  monthlyRepayment: number;
}) {
  const repay = useMutation(api.loans.mutations.repay);
  const [pendingAmount, setPendingAmount] = useState<string | null>(null);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { amount: monthlyRepayment ? String(monthlyRepayment) : "" },
  });

  async function handleConfirm() {
    if (!pendingAmount) return;
    try {
      await repay({ loanId, amount: Number(pendingAmount) });
      toast.success("Repayment recorded");
      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not record repayment"
      );
    } finally {
      setPendingAmount(null);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-sm sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Make a repayment</DialogTitle>
            <DialogDescription>
              This debits your savings account and applies to the oldest
              unpaid installment first.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((values) => setPendingAmount(values.amount))}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (KES)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full">
                Continue
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <ConfirmModal
        open={pendingAmount !== null}
        onOpenChange={(next) => !next && setPendingAmount(null)}
        title="Confirm repayment"
        description={
          pendingAmount
            ? `This debits KES ${Number(pendingAmount).toLocaleString()} from the member's savings account and applies it to this loan. This cannot be undone.`
            : ""
        }
        confirmLabel="Confirm repayment"
        onConfirm={handleConfirm}
      />
    </>
  );
}
