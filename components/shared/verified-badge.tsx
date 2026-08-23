import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export type CommitteeRole =
  | "chairman"
  | "deputy_chairman"
  | "secretary"
  | "treasurer";

// One constant color per office so a badge is recognizable at a glance
// anywhere in the app — plain verified members all share the same color,
// each committee office gets its own.
const COLOR_BY_ROLE: Record<CommitteeRole | "member", string> = {
  member: "text-primary",
  chairman: "text-amber-500",
  deputy_chairman: "text-violet-500",
  secretary: "text-cyan-500",
  treasurer: "text-emerald-500",
};

export function VerifiedBadge({
  committeeRole,
  className,
}: {
  committeeRole?: CommitteeRole | null;
  className?: string;
}) {
  return (
    <BadgeCheck
      className={cn("size-3.5 shrink-0", COLOR_BY_ROLE[committeeRole ?? "member"], className)}
    />
  );
}
