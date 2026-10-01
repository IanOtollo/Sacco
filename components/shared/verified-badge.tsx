import { BadgeCheck, Coins, Crown, PenLine, ShieldCheck, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type CommitteeRole =
  | "chairman"
  | "deputy_chairman"
  | "secretary"
  | "treasurer";

// One icon + color per office so a badge is recognizable at a glance
// anywhere in the app — plain verified members share the check badge,
// each committee office gets its own shape and color.
const BADGE_BY_ROLE: Record<CommitteeRole | "member", { icon: LucideIcon; color: string; label: string }> = {
  member: { icon: BadgeCheck, color: "text-primary", label: "Verified member" },
  chairman: { icon: Crown, color: "text-amber-500", label: "Chairman" },
  deputy_chairman: { icon: ShieldCheck, color: "text-violet-500", label: "Deputy Chairman" },
  secretary: { icon: PenLine, color: "text-cyan-500", label: "Secretary" },
  treasurer: { icon: Coins, color: "text-emerald-500", label: "Treasurer" },
};

export function VerifiedBadge({
  committeeRole,
  className,
}: {
  committeeRole?: CommitteeRole | null;
  className?: string;
}) {
  const { icon: Icon, color, label } = BADGE_BY_ROLE[committeeRole ?? "member"];
  return (
    <Icon
      aria-label={label}
      className={cn("size-3.5 shrink-0", color, className)}
    >
      <title>{label}</title>
    </Icon>
  );
}
