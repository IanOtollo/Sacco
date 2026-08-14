export const ROLES = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  MEMBER: "member",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ADMIN_ROLES: Role[] = [ROLES.SUPER_ADMIN, ROLES.ADMIN];

export const ROUTES = {
  HOME: "/",
  // The sign-in form is inline on the landing page (split-screen layout).
  LOGIN: "/",
  ADMIN: "/admin",
  ADMIN_MEMBERS: "/admin/members",
  ADMIN_APPLICATIONS: "/admin/applications",
  ADMIN_LOANS: "/admin/loans",
  ADMIN_LOAN_PRODUCTS: "/admin/loan-products",
  ADMIN_CONTRIBUTIONS: "/admin/contributions",
  ADMIN_DIVIDENDS: "/admin/dividends",
  ADMIN_REPORTS: "/admin/reports",
  ADMIN_ANNOUNCEMENTS: "/admin/announcements",
  ADMIN_SETTINGS: "/admin/settings",
  ADMIN_AUDIT: "/admin/audit",
  PORTAL: "/portal",
  PORTAL_ACCOUNTS: "/portal/accounts",
  PORTAL_LOANS: "/portal/loans",
  PORTAL_GUARANTORS: "/portal/guarantors",
  PORTAL_UPDATES: "/portal/updates",
  PORTAL_NOTIFICATIONS: "/portal/notifications",
  PORTAL_PROFILE: "/portal/profile",
} as const;

export function portalHomeForRole(role: Role | null | undefined): string {
  if (role === ROLES.SUPER_ADMIN || role === ROLES.ADMIN) return ROUTES.ADMIN;
  if (role === ROLES.MEMBER) return ROUTES.PORTAL;
  return ROUTES.LOGIN;
}

export const MEMBER_STATUS_LABEL: Record<string, string> = {
  active: "Active",
  suspended: "Suspended",
  dormant: "Dormant",
  exited: "Exited",
};

export const LOAN_STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  pending_guarantors: "Pending Guarantors",
  pending_approval: "Pending Approval",
  approved: "Approved",
  rejected: "Rejected",
  disbursed: "Disbursed",
  active: "Active",
  fully_paid: "Fully Paid",
  defaulted: "Defaulted",
  written_off: "Written Off",
};
