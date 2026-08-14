import { PortalGate } from "@/components/auth/portal-gate";
import { MemberShell } from "@/components/layout/member-shell";
import { ROLES } from "@/lib/constants";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PortalGate allowedRoles={[ROLES.MEMBER]}>
      <MemberShell>{children}</MemberShell>
    </PortalGate>
  );
}
