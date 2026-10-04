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

type ReceivedInto = "mpesa" | "bank_transfer" | "cash";

const RECEIVED_INTO_OPTIONS: { value: ReceivedInto; label: string }[] = [
  { value: "mpesa", label: "M-Pesa" },
  { value: "bank_transfer", label: "Bank" },
  { value: "cash", label: "Cash" },
];

export function MakePaymentModal({
  open,
  onOpenChange,
  loanId,
  monthlyRepayment,
  askReceivedInto = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loanId: Id<"loans">;
  monthlyRepayment: number;
  // Admin-recorded repayments say where the money landed, so the Sacco's
  // bank / M-Pesa balance goes up.
  askReceivedInto?: boolean;
}) {
  const repay = useMutation(api.loans.mutations.repay);
  const [pendingAmount, setPendingAmount] = useState<string | null>(null);
  const [receivedInto, setReceivedInto] = useState<ReceivedInto | null>(null);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { amount: monthlyRepayment ? String(monthlyRepayment) : "" },
  });

  async function handleConfirm() {
    if (!pendingAmount) return;
    try {
      await repay({
        loanId,
        amount: Number(pendingAmount),
        ...(askReceivedInto && receivedInto ? { channel: receivedInto } : {}),
      });
      toast.success("Repayment recorded");
      form.reset();
      setReceivedInto(null);
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
              Record cash, M-Pesa, or bank funds received and apply them to
              the oldest unpaid installment first. Savings are not debited.
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
              {askReceivedInto && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Money received into</p>
                  <div className="grid grid-cols-3 gap-2">
                    {RECEIVED_INTO_OPTIONS.map((o) => (
                      <Button
                        key={o.value}
                        type="button"
                        size="sm"
                        variant={receivedInto === o.value ? "default" : "outline"}
                        onClick={() => setReceivedInto(o.value)}
                      >
                        {o.label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              <Button
                type="submit"
                className="w-full"
                disabled={askReceivedInto && !receivedInto}
              >
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
            ? `This applies KES ${Number(pendingAmount).toLocaleString()} received to this loan${
                receivedInto === "mpesa"
                  ? " and adds it to the Sacco's M-Pesa balance"
                  : receivedInto === "bank_transfer"
                    ? " and adds it to the Sacco's bank balance"
                    : ""
              }. Savings are not debited. This cannot be undone.`
            : ""
        }
        confirmLabel="Confirm repayment"
        onConfirm={handleConfirm}
      />
    </>
  );
}
