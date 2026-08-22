"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/shared/status-badge";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate } from "@/lib/utils";
import { Loader2, Plus, Coins, Send } from "lucide-react";

const schema = z.object({
  financialYear: z.string().min(1, "Required"),
  round: z.enum(["first", "second"]),
  totalPool: z.string().refine((v) => Number(v) > 0, "Enter a valid amount"),
  ratePercent: z.string().refine((v) => Number(v) > 0, "Enter a valid rate"),
});
type Values = z.infer<typeof schema>;

const ROUND_LABEL: Record<string, string> = {
  first: "1st share",
  second: "2nd share",
};

function RoundBadge({ round }: { round: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-secondary/10 px-2.5 py-0.5 text-xs font-medium text-secondary">
      {ROUND_LABEL[round] ?? round}
    </span>
  );
}

function DeclareDividendDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const declare = useMutation(api.dividends.mutations.declare);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      financialYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
      round: "first",
      totalPool: "",
      ratePercent: "",
    },
  });

  async function onSubmit(values: Values) {
    setSubmitting(true);
    try {
      const result = await declare({
        financialYear: values.financialYear,
        round: values.round,
        totalPool: Number(values.totalPool),
        ratePercent: Number(values.ratePercent),
      });
      toast.success(`Dividend declared for ${result.payoutCount} member(s)`);
      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not declare dividend"
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Declare dividend</DialogTitle>
          <DialogDescription>
            Payouts are calculated from each member&apos;s current shares
            balance.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="financialYear"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Financial year</FormLabel>
                  <FormControl>
                    <Input disabled={submitting} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="round"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Round</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange} disabled={submitting}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue>
                          {(value: string | null) =>
                            value ? ROUND_LABEL[value] : ""
                          }
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="first">1st share — auto-credited to everyone</SelectItem>
                      <SelectItem value="second">2nd share — members redeem it themselves</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="totalPool"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total pool (KES)</FormLabel>
                  <FormControl>
                    <Input type="number" disabled={submitting} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="ratePercent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rate on shares (%)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.1" disabled={submitting} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              Declare
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function PayoutsDialog({
  dividend,
  onOpenChange,
}: {
  dividend: Doc<"dividends">;
  onOpenChange: (open: boolean) => void;
}) {
  const payouts = useQuery(api.dividends.queries.getPayouts, {
    dividendId: dividend._id,
  });

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] w-full max-w-lg overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{dividend.financialYear} payouts</DialogTitle>
          <DialogDescription>
            {ROUND_LABEL[dividend.round ?? "first"]} · {dividend.ratePercent}% on shares balance
          </DialogDescription>
        </DialogHeader>
        {payouts === undefined ? (
          <Skeleton className="h-40 w-full rounded-lg" />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <Table>
              <TableHeader>
                <TableRow className="[&>th]:bg-muted/50">
                  <TableHead>Member</TableHead>
                  <TableHead className="text-right">Shares</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payouts.map((p) => (
                  <TableRow key={p._id}>
                    <TableCell>
                      {p.memberName}{" "}
                      <span className="font-mono text-xs text-muted-foreground">
                        {p.memberNumber}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <CurrencyDisplay amount={p.sharesBalance} />
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      <CurrencyDisplay amount={p.amount} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={p.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function DividendsPageClient() {
  const dividends = useQuery(api.dividends.queries.list);
  const distribute = useMutation(api.dividends.mutations.distribute);
  const [declareOpen, setDeclareOpen] = useState(false);
  const [viewingPayouts, setViewingPayouts] = useState<Doc<"dividends"> | null>(null);
  const [distributeId, setDistributeId] = useState<Id<"dividends"> | null>(null);

  async function handleDistribute() {
    if (!distributeId) return;
    try {
      const result = await distribute({ dividendId: distributeId });
      toast.success(`Credited ${result.credited} member(s)`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not distribute dividend"
      );
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            Dividends
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Declare each year&apos;s two dividend rounds — the 1st share is
            distributed to everyone at once, the 2nd share is redeemed by
            members individually.
          </p>
        </div>
        <Button onClick={() => setDeclareOpen(true)}>
          <Plus className="size-4" />
          Declare dividend
        </Button>
      </div>

      <div className="mt-6">
        {dividends === undefined ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : dividends.length === 0 ? (
          <EmptyState
            icon={Coins}
            title="No dividends declared yet"
            description="Declare a dividend to calculate payouts across all members with shares."
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <Table>
              <TableHeader>
                <TableRow className="[&>th]:bg-muted/50">
                  <TableHead>Financial year</TableHead>
                  <TableHead>Round</TableHead>
                  <TableHead className="text-right">Pool</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Declared</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {dividends.map((d, i) => (
                  <TableRow
                    key={d._id}
                    className={i % 2 === 1 ? "bg-muted/20" : undefined}
                  >
                    <TableCell className="font-medium">{d.financialYear}</TableCell>
                    <TableCell>
                      <RoundBadge round={d.round ?? "first"} />
                    </TableCell>
                    <TableCell className="text-right">
                      <CurrencyDisplay amount={d.totalPool} />
                    </TableCell>
                    <TableCell>{d.ratePercent}%</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(d.declaredDate)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={d.status} />
                    </TableCell>
                    <TableCell className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setViewingPayouts(d)}
                      >
                        View
                      </Button>
                      {d.status === "declared" &&
                        ((d.round ?? "first") === "first" ? (
                          <Button size="sm" onClick={() => setDistributeId(d._id)}>
                            <Send className="size-3.5" />
                            Distribute
                          </Button>
                        ) : (
                          <span className="self-center text-xs text-muted-foreground">
                            Open for members to redeem
                          </span>
                        ))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <DeclareDividendDialog open={declareOpen} onOpenChange={setDeclareOpen} />

      {viewingPayouts && (
        <PayoutsDialog
          dividend={viewingPayouts}
          onOpenChange={(open) => !open && setViewingPayouts(null)}
        />
      )}

      <ConfirmModal
        open={distributeId !== null}
        onOpenChange={(open) => !open && setDistributeId(null)}
        title="Distribute this dividend?"
        description="This credits every member's savings account with their calculated payout. This cannot be undone."
        confirmLabel="Distribute"
        onConfirm={handleDistribute}
      />
    </div>
  );
}
