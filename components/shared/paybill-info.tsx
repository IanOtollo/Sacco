import { Smartphone } from "lucide-react";
import { Card } from "@/components/ui/card";

export const PAYBILL = {
  number: "400222",
  account: "1119928#",
  accountName: "EDULAEPE",
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-mono text-base font-semibold">{value}</span>
    </div>
  );
}

/** Sizeable square card — dashboard, accounts, loans. */
export function PaybillCard({ title = "Pay via M-Pesa" }: { title?: string }) {
  return (
    <Card className="w-full max-w-[280px] rounded-2xl border-border/50 p-6">
      <div className="flex items-center gap-2.5">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-success/10 text-success">
          <Smartphone className="size-4" />
        </div>
        <span className="text-sm font-semibold leading-snug">{title}</span>
      </div>
      <div className="mt-4 space-y-2.5">
        <Row label="Paybill" value={PAYBILL.number} />
        <Row label="A/c no." value={PAYBILL.account} />
        <Row label="A/c name" value={PAYBILL.accountName} />
      </div>
    </Card>
  );
}

/** Compact inline block — footer. */
export function PaybillInline() {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Smartphone className="size-4 shrink-0" />
      <span>
        Paybill <span className="font-mono font-semibold text-foreground">{PAYBILL.number}</span>
        {" · A/c "}
        <span className="font-mono font-semibold text-foreground">{PAYBILL.account}</span>
        {" · "}
        {PAYBILL.accountName}
      </span>
    </div>
  );
}
