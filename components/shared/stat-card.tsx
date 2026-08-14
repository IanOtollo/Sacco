import { type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  icon: Icon,
  label,
  value,
  tone = "default",
}: {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  tone?: "default" | "warning" | "danger";
}) {
  return (
    <Card className="rounded-2xl border-border/50 p-5">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4" />
        <span className="text-sm">{label}</span>
      </div>
      <div
        className={cn(
          "mt-2 text-2xl font-bold tracking-tight",
          tone === "warning" && "text-warning-foreground",
          tone === "danger" && "text-danger"
        )}
      >
        {value}
      </div>
    </Card>
  );
}
