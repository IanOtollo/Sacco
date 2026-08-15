import {
  LayoutDashboard,
  Users,
  UserPlus,
  HandCoins,
  Sprout,
  Wallet,
  PiggyBank,
  BarChart3,
  Megaphone,
  Settings,
  ScrollText,
  Home,
  MessageSquare,
  User,
  ReceiptText,
  type LucideIcon,
} from "lucide-react";
import { ROUTES } from "@/lib/constants";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export const adminSidebarNav: NavItem[] = [
  { label: "Dashboard", href: ROUTES.ADMIN, icon: LayoutDashboard },
  { label: "Members", href: ROUTES.ADMIN_MEMBERS, icon: Users },
  { label: "Applications", href: ROUTES.ADMIN_APPLICATIONS, icon: UserPlus },
  { label: "Loans", href: ROUTES.ADMIN_LOANS, icon: HandCoins },
  { label: "Projects", href: ROUTES.ADMIN_PROJECTS, icon: Sprout },
  { label: "Deposit Claims", href: ROUTES.ADMIN_DEPOSIT_CLAIMS, icon: ReceiptText },
  { label: "Contributions", href: ROUTES.ADMIN_CONTRIBUTIONS, icon: Wallet },
  { label: "Dividends", href: ROUTES.ADMIN_DIVIDENDS, icon: PiggyBank },
  { label: "Reports", href: ROUTES.ADMIN_REPORTS, icon: BarChart3 },
  { label: "Announcements", href: ROUTES.ADMIN_ANNOUNCEMENTS, icon: Megaphone },
  { label: "Settings", href: ROUTES.ADMIN_SETTINGS, icon: Settings },
  { label: "Audit Log", href: ROUTES.ADMIN_AUDIT, icon: ScrollText },
];

export const adminBottomBarNav: NavItem[] = [
  { label: "Dashboard", href: ROUTES.ADMIN, icon: LayoutDashboard },
  { label: "Members", href: ROUTES.ADMIN_MEMBERS, icon: Users },
  { label: "Loans", href: ROUTES.ADMIN_LOANS, icon: HandCoins },
  { label: "Reports", href: ROUTES.ADMIN_REPORTS, icon: BarChart3 },
];

export const adminMoreSheetNav: NavItem[] = [
  { label: "Applications", href: ROUTES.ADMIN_APPLICATIONS, icon: UserPlus },
  { label: "Projects", href: ROUTES.ADMIN_PROJECTS, icon: Sprout },
  { label: "Deposit Claims", href: ROUTES.ADMIN_DEPOSIT_CLAIMS, icon: ReceiptText },
  { label: "Contributions", href: ROUTES.ADMIN_CONTRIBUTIONS, icon: Wallet },
  { label: "Dividends", href: ROUTES.ADMIN_DIVIDENDS, icon: PiggyBank },
  { label: "Announcements", href: ROUTES.ADMIN_ANNOUNCEMENTS, icon: Megaphone },
  { label: "Settings", href: ROUTES.ADMIN_SETTINGS, icon: Settings },
  { label: "Audit Log", href: ROUTES.ADMIN_AUDIT, icon: ScrollText },
];

export const memberSidebarNav: NavItem[] = [
  { label: "Home", href: ROUTES.PORTAL, icon: Home },
  { label: "Accounts", href: ROUTES.PORTAL_ACCOUNTS, icon: Wallet },
  { label: "Loans", href: ROUTES.PORTAL_LOANS, icon: HandCoins },
  { label: "Guarantors", href: ROUTES.PORTAL_GUARANTORS, icon: Users },
  { label: "Projects", href: ROUTES.PORTAL_PROJECTS, icon: Sprout },
  { label: "Updates", href: ROUTES.PORTAL_UPDATES, icon: MessageSquare },
  { label: "Profile", href: ROUTES.PORTAL_PROFILE, icon: User },
];

export const memberBottomBarNav: NavItem[] = [
  { label: "Home", href: ROUTES.PORTAL, icon: Home },
  { label: "Accounts", href: ROUTES.PORTAL_ACCOUNTS, icon: Wallet },
  { label: "Loans", href: ROUTES.PORTAL_LOANS, icon: HandCoins },
  { label: "Updates", href: ROUTES.PORTAL_UPDATES, icon: MessageSquare },
  { label: "Profile", href: ROUTES.PORTAL_PROFILE, icon: User },
];

// Extra portal modules unlocked for Secretary/Treasurer on top of the
// ordinary member nav — see convex/authz.ts requireSecretary/requireTreasurer.
export function committeeNavItems(
  committeeRole: "chairman" | "deputy_chairman" | "secretary" | "treasurer" | undefined
): NavItem[] {
  const items: NavItem[] = [];
  if (committeeRole === "secretary") {
    items.push({ label: "Announcements", href: ROUTES.PORTAL_ANNOUNCEMENTS, icon: Megaphone });
  }
  if (committeeRole === "treasurer") {
    items.push(
      { label: "Deposit Claims", href: ROUTES.PORTAL_DEPOSIT_CLAIMS, icon: ReceiptText },
      { label: "Contributions", href: ROUTES.PORTAL_CONTRIBUTIONS, icon: Wallet },
      { label: "Dividends", href: ROUTES.PORTAL_DIVIDENDS, icon: PiggyBank },
      { label: "Reports", href: ROUTES.PORTAL_REPORTS, icon: BarChart3 }
    );
  }
  return items;
}
