import { NotificationBell } from "@/components/layout/notification-bell";
import { UserMenu } from "@/components/layout/user-menu";

export function AdminTopbar({
  name,
  phone,
}: {
  name?: string | null;
  phone?: string | null;
}) {
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border/40 bg-background/80 px-4 backdrop-blur-md sm:px-6">
      <div className="lg:hidden">
        <span className="font-heading text-sm font-bold tracking-tight">
          Client Sacco
        </span>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <NotificationBell />
        <UserMenu name={name} phone={phone} profileHref="/admin/settings" />
      </div>
    </header>
  );
}
