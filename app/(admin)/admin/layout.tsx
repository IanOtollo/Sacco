import { PortalGate } from "@/components/auth/portal-gate";
import { AdminShell } from "@/components/layout/admin-shell";
import { ROLES } from "@/lib/constants";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PortalGate allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN]}>
      <AdminShell>{children}</AdminShell>
    </PortalGate>
  );
}
