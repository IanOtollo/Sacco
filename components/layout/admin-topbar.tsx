"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { NotificationBell } from "@/components/layout/notification-bell";
import { UserMenu } from "@/components/layout/user-menu";
import { GlobalSearch } from "@/components/layout/global-search";
import { adminSidebarNav } from "@/lib/nav-config";

export function AdminTopbar({
  name,
  phone,
}: {
  name?: string | null;
  phone?: string | null;
}) {
  const saccoName = useQuery(api.settings.queries.getSaccoName);

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-border/40 bg-background/80 px-4 backdrop-blur-md sm:px-6">
      <div className="lg:hidden">
        <span className="font-heading text-sm font-bold tracking-tight">
          {saccoName ?? "Edulaepe Credit and Saving"}
        </span>
      </div>
      <div className="hidden flex-1 sm:block">
        <GlobalSearch
          sections={adminSidebarNav}
          searchMembers
          placeholder="Search sections or members..."
        />
      </div>
      <div className="ml-auto flex items-center gap-2">
        <NotificationBell />
        <UserMenu name={name} phone={phone} profileHref="/admin/settings" />
      </div>
    </header>
  );
}
