import {
  ClipboardList,
  Handshake,
  Wallet,
  Clock,
  UserCog,
  Megaphone,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS: Record<string, { icon: LucideIcon; tone: string }> = {
  loan_update: { icon: ClipboardList, tone: "bg-info/10 text-info" },
  guarantor_request: { icon: Handshake, tone: "bg-accent/20 text-accent-foreground" },
  payment_received: { icon: Wallet, tone: "bg-success/10 text-success" },
  payment_due: { icon: Clock, tone: "bg-warning/15 text-warning-foreground" },
  account_update: { icon: UserCog, tone: "bg-secondary/10 text-secondary" },
  announcement: { icon: Megaphone, tone: "bg-primary/10 text-primary" },
  system: { icon: Settings, tone: "bg-muted text-muted-foreground" },
};

export function NotificationIcon({ type }: { type: string }) {
  const config = ICONS[type] ?? ICONS.system;
  const Icon = config.icon;
  return (
    <div
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-full",
        config.tone
      )}
    >
      <Icon className="size-4" />
    </div>
  );
}
