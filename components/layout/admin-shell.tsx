"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { AdminTopbar } from "@/components/layout/admin-topbar";
import { AdminMobileBottomBar } from "@/components/layout/admin-mobile-bottom-bar";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const user = useQuery(api.users.getCurrentUser);

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar name={user?.name} phone={user?.phone} />
        <main className="flex-1 pb-20 lg:pb-0">{children}</main>
      </div>
      <AdminMobileBottomBar />
    </div>
  );
}
