"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { StatCard } from "@/components/shared/stat-card";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn, formatDate } from "@/lib/utils";
import { Landmark, Smartphone } from "lucide-react";

type Channel = "bank" | "mpesa";
type Kind = "in" | "out" | "set";

const CHANNEL_LABEL: Record<Channel, string> = {
  bank: "Money in the Bank",
  mpesa: "Money in M-Pesa",
};

const KIND_OPTIONS: { value: Kind; label: string }[] = [
  { value: "in", label: "Money in" },
  { value: "out", label: "Money out" },
  { value: "set", label: "Set to statement balance" },
];

const ENTRY_LABEL = { in: "Money in", out: "Money out", adjustment: "Balance set" } as const;

// The Sacco's real bank and M-Pesa balances. Renders nothing unless the
// viewer is allowed to see them (chairman, deputy, super admins, treasurer);
// only the chairman/deputy can record changes in the dialog.
export function TreasuryCards() {
  const data = useQuery(api.treasury.queries.getBalances);
  const record = useMutation(api.treasury.mutations.record);
  const [open, setOpen] = useState(false);
  const [channel, setChannel] = useState<Channel>("bank");
  const [kind, setKind] = useState<Kind>("in");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  if (!data) return null;
  const { canEdit, history } = data;

  function openFor(next: Channel) {
    setChannel(next);
    setKind("in");
    setAmount("");
    setNote("");
    setOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await record({ channel, kind, amount: Number(amount), note });
      toast.success(`${CHANNEL_LABEL[channel]} updated`);
      setAmount("");
      setNote("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  const channelHistory = history.filter((h) => h.channel === channel);
  const isNegative = (h: { kind: string; amount: number }) =>
    h.kind === "out" || (h.kind === "adjustment" && h.amount < 0);

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard
          icon={Landmark}
          label={CHANNEL_LABEL.bank}
          value={<CurrencyDisplay amount={data.bank} />}
          tone="success"
          onClick={() => openFor("bank")}
        />
        <StatCard
          icon={Smartphone}
          label={CHANNEL_LABEL.mpesa}
          value={<CurrencyDisplay amount={data.mpesa} />}
          tone="success"
          onClick={() => openFor("mpesa")}
        />
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] w-full max-w-lg overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{CHANNEL_LABEL[channel]}</DialogTitle>
            <DialogDescription>
              {canEdit
                ? "The Sacco's real balance. Record money received or paid out, or set it to match the statement."
                : "The Sacco's real balance. If it looks wrong, tell the chairman — only the chairman can change it."}
            </DialogDescription>
          </DialogHeader>

          <div className="text-3xl font-bold tracking-tight">
            <CurrencyDisplay amount={channel === "bank" ? data.bank : data.mpesa} />
          </div>

          {canEdit && (
            <div className="space-y-4 rounded-xl border border-border/50 p-4">
              <div className="flex flex-wrap gap-2">
                {KIND_OPTIONS.map((o) => (
                  <Button
                    key={o.value}
                    type="button"
                    size="sm"
                    variant={kind === o.value ? "default" : "outline"}
                    onClick={() => setKind(o.value)}
                  >
                    {o.label}
                  </Button>
                ))}
              </div>
              <div className="space-y-2">
                <Label htmlFor="treasury-amount">
                  {kind === "set" ? "Balance on the statement (KES)" : "Amount (KES)"}
                </Label>
                <Input
                  id="treasury-amount"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="treasury-note">Note</Label>
                <Textarea
                  id="treasury-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Loan paid out to member, monthly deposits banked"
                  rows={2}
                />
              </div>
              <Button
                type="button"
                onClick={handleSave}
                disabled={saving || amount === "" || note.trim().length < 3}
              >
                {saving ? "Saving…" : "Save"}
              </Button>
            </div>
          )}

          <div className="space-y-2">
            <h3 className="text-sm font-semibold">History</h3>
            {channelHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing recorded yet.</p>
            ) : (
              channelHistory.map((h) => (
                <div
                  key={h._id}
                  className="flex items-start justify-between gap-4 rounded-xl border border-border/50 px-4 py-2 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate">{h.note}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(h.entryDate)} · {h.recordedByName}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className={cn("font-medium", isNegative(h) && "text-danger")}>
                      {isNegative(h) ? "−" : "+"}
                      <CurrencyDisplay amount={Math.abs(h.amount)} />
                    </p>
                    <p className="text-xs text-muted-foreground">{ENTRY_LABEL[h.kind]}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
