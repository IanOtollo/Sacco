import { SquareArrowUpRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const TONE_CHIP: Record<string, string> = {
  primary: "bg-primary/10 text-primary",
  secondary: "bg-secondary/10 text-secondary",
  accent: "bg-accent/20 text-accent-foreground",
  success: "bg-success/10 text-success",
  warning: "bg-warning/15 text-warning-foreground",
  danger: "bg-danger/10 text-danger",
  info: "bg-info/10 text-info",
};

const CARD_CLASSES =
  "relative block w-full rounded-2xl bg-card p-5 text-left text-sm text-card-foreground ring-1 ring-foreground/10";

export function StatCard({
  icon: Icon,
  label,
  value,
  tone = "primary",
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  tone?: "primary" | "secondary" | "accent" | "success" | "warning" | "danger" | "info";
  onClick?: () => void;
}) {
  const content = (
    <>
      <div className="flex items-center gap-2.5">
        <div
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-lg",
            TONE_CHIP[tone]
          )}
        >
          <Icon className="size-4" />
        </div>
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <div
        className={cn(
          "mt-3 text-2xl font-bold tracking-tight",
          tone === "warning" && "text-warning-foreground",
          tone === "danger" && "text-danger"
        )}
      >
        {value}
      </div>
      {onClick && (
        <SquareArrowUpRight className="absolute right-3 bottom-3 size-4 text-muted-foreground" />
      )}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(CARD_CLASSES, "cursor-pointer transition-shadow hover:shadow-md")}
      >
        {content}
      </button>
    );
  }

  return <div className={CARD_CLASSES}>{content}</div>;
}
