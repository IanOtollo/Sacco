import { cn } from "@/lib/utils";

type Tone = "success" | "warning" | "danger" | "info" | "muted";

const TONE_CLASSES: Record<Tone, string> = {
  success: "bg-success/10 text-success",
  warning: "bg-warning/15 text-warning-foreground",
  danger: "bg-danger/10 text-danger",
  info: "bg-info/10 text-info",
  muted: "bg-muted text-muted-foreground",
};

const STATUS_TONE: Record<string, Tone> = {
  // members
  active: "success",
  suspended: "danger",
  dormant: "muted",
  exited: "muted",
  // loans / transactions / contributions / guarantors / dividends
  draft: "muted",
  pending: "warning",
  pending_guarantors: "warning",
  pending_approval: "warning",
  approved: "info",
  accepted: "success",
  rejected: "danger",
  declined: "danger",
  disbursed: "info",
  processing: "info",
  paid: "success",
  completed: "success",
  credited: "success",
  partial: "warning",
  overdue: "danger",
  waived: "muted",
  defaulted: "danger",
  written_off: "muted",
  fully_paid: "success",
  reversed: "muted",
  failed: "danger",
  upcoming: "muted",
  declared: "info",
  distributed: "success",
  cancelled: "muted",
  published: "success",
};

const LABEL_OVERRIDE: Record<string, string> = {
  pending_guarantors: "Pending Guarantors",
  pending_approval: "Pending Approval",
  fully_paid: "Fully Paid",
  written_off: "Written Off",
};

function humanize(status: string) {
  return (
    LABEL_OVERRIDE[status] ??
    status
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ")
  );
}

export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const tone = STATUS_TONE[status] ?? "muted";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        TONE_CLASSES[tone],
        className
      )}
    >
      {humanize(status)}
    </span>
  );
}
