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
import { SearchInput } from "@/components/shared/search-input";
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
import { Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const schema = z.object({
  amount: z
    .string()
    .min(1, "Required")
    .refine((v) => Number(v) > 0, "Enter an amount greater than zero"),
  receiptNumber: z.string().optional(),
});
type Values = z.infer<typeof schema>;

export function RecordContributionModal({
  open,
  onOpenChange,
  contributionTypeId,
  typeName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contributionTypeId: Id<"contributionTypes">;
  typeName: string;
}) {
  const record = useMutation(api.contributions.mutations.record);
  const [submitting, setSubmitting] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [selectedMember, setSelectedMember] = useState<{
    _id: Id<"members">;
    name: string;
    memberNumber: string;
  } | null>(null);

  const candidates = useQuery(
    api.members.queries.list,
    memberSearch ? { search: memberSearch } : "skip"
  );

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { amount: "", receiptNumber: "" },
  });

  function reset() {
    form.reset();
    setSelectedMember(null);
    setMemberSearch("");
  }

  async function onSubmit(values: Values) {
    if (!selectedMember) {
      toast.error("Select a member first");
      return;
    }
    setSubmitting(true);
    try {
      await record({
        contributionTypeId,
        memberId: selectedMember._id,
        amount: Number(values.amount),
        receiptNumber: values.receiptNumber || undefined,
      });
      toast.success("Contribution recorded");
      reset();
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
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-sm sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Record contribution</DialogTitle>
          <DialogDescription>{typeName}</DialogDescription>
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                Record contribution
              </Button>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
