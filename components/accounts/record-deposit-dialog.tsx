"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SearchInput } from "@/components/shared/search-input";
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
import { ConfirmModal } from "@/components/shared/confirm-modal";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Check, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const schema = z.object({
  accountType: z.enum(["savings", "shares_long_term", "shares_short_term", "shares_capital"]),
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

export function RecordDepositDialog() {
  const recordDirect = useMutation(api.depositClaims.mutations.recordDirect);
  const [open, setOpen] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [selectedMember, setSelectedMember] = useState<{
    _id: Id<"members">;
    name: string;
    memberNumber: string;
  } | null>(null);
  const [pending, setPending] = useState<Values | null>(null);

  const candidates = useQuery(
    api.members.queries.list,
    memberSearch ? { search: memberSearch } : "skip"
  );

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      accountType: "savings",
      amount: "",
      channel: "mpesa",
      transactionReference: "",
      note: "",
    },
  });

  function reset() {
    form.reset();
    setSelectedMember(null);
    setMemberSearch("");
    setPending(null);
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) reset();
  }

  async function handleConfirm() {
    if (!selectedMember || !pending) return;
    try {
      await recordDirect({
        memberId: selectedMember._id,
        accountType: pending.accountType,
        amount: Number(pending.amount),
        channel: pending.channel,
        transactionReference: pending.transactionReference,
        note: pending.note || undefined,
      });
      toast.success("Deposit recorded");
      handleOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not record deposit"
      );
    } finally {
      setPending(null);
    }
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <PlusCircle className="size-4" />
        Record deposit directly
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-h-[90vh] w-full max-w-md overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record a deposit</DialogTitle>
            <DialogDescription>
              Credits the account immediately — use this when you already
              have the transaction in hand and don&apos;t need to wait on a
              member claim.
            </DialogDescription>
          </DialogHeader>

          {!selectedMember ? (
            <div className="space-y-2">
              <SearchInput
                value={memberSearch}
                onChange={setMemberSearch}
                placeholder="Search member by name or number..."
              />
              <div className="max-h-56 space-y-1 overflow-y-auto rounded-lg border border-border p-1.5">
                {!memberSearch ? (
                  <p className="p-2 text-sm text-muted-foreground">
                    Start typing to find a member.
                  </p>
                ) : candidates === undefined ? (
                  <p className="p-2 text-sm text-muted-foreground">Loading...</p>
                ) : candidates.length === 0 ? (
                  <p className="p-2 text-sm text-muted-foreground">No members found.</p>
                ) : (
                  candidates.map((m) => (
                    <button
                      key={m._id}
                      type="button"
                      onClick={() =>
                        setSelectedMember({
                          _id: m._id,
                          name: `${m.firstName} ${m.lastName}`,
                          memberNumber: m.memberNumber,
                        })
                      }
                      className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                    >
                      <span>
                        {m.firstName} {m.lastName}
                      </span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {m.memberNumber}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit((values) => setPending(values))}
                className="space-y-4"
              >
                <button
                  type="button"
                  onClick={() => setSelectedMember(null)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-2 text-left text-sm"
                  )}
                >
                  <span className="flex items-center gap-2">
                    <Check className="size-4 text-success" />
                    {selectedMember.name}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    Change
                  </span>
                </button>
                <FormField
                  control={form.control}
                  name="accountType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(ACCOUNT_TYPE_LABEL).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                      <FormLabel>Transaction reference</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. QFT7X8Y2Z1" {...field} />
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
                        <Textarea rows={2} {...field} />
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
          )}
        </DialogContent>
      </Dialog>

      <ConfirmModal
        open={pending !== null}
        onOpenChange={(next) => !next && setPending(null)}
        title="Confirm deposit"
        description={
          pending && selectedMember
            ? `Credit KES ${Number(pending.amount).toLocaleString()} to ${selectedMember.name}'s ${ACCOUNT_TYPE_LABEL[pending.accountType]} account. This cannot be undone.`
            : ""
        }
        confirmLabel="Confirm"
        onConfirm={handleConfirm}
      />
    </>
  );
}
