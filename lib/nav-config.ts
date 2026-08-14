import {
  LayoutDashboard,
  Users,
  HandCoins,
  Layers,
  Wallet,
  PiggyBank,
  BarChart3,
  Megaphone,
  Settings,
  ScrollText,
  Home,
  MessageSquare,
  User,
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
  { label: "Loans", href: ROUTES.ADMIN_LOANS, icon: HandCoins },
  { label: "Loan Products", href: ROUTES.ADMIN_LOAN_PRODUCTS, icon: Layers },
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
  { label: "Loan Products", href: ROUTES.ADMIN_LOAN_PRODUCTS, icon: Layers },
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
