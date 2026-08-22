"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { MemberSidebar } from "@/components/layout/member-sidebar";
import { MemberTopbar } from "@/components/layout/member-topbar";
import { MemberBottomBar } from "@/components/layout/member-bottom-bar";

export function MemberShell({ children }: { children: React.ReactNode }) {
  const user = useQuery(api.users.getCurrentUser);

  return (
    <div className="flex min-h-screen bg-background">
      <MemberSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <MemberTopbar name={user?.name} phone={user?.phone} />
        <main className="flex-1 pb-20 lg:pb-0 print:pb-0">{children}</main>
      </div>
      <MemberBottomBar />
    </div>
  );
}
