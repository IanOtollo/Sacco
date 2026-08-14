"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { PanelLeftClose, PanelLeftOpen, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { adminSidebarNav } from "@/lib/nav-config";
import { api } from "@/convex/_generated/api";
import { ROUTES } from "@/lib/constants";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SidebarLogoutButton } from "@/components/layout/sidebar-logout-button";
import { BrandMark } from "@/components/shared/brand-mark";

export function AdminSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const saccoName = useQuery(api.settings.queries.getSaccoName);
  const currentUser = useQuery(api.users.getCurrentUser);
  const hasMemberProfile = !!currentUser?.memberId;

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border bg-sidebar transition-[width] duration-200 lg:flex",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div
        className={cn(
          "flex min-h-16 items-center gap-2.5 border-b border-sidebar-border px-4 py-3",
          collapsed && "justify-center px-0"
        )}
      >
        {!collapsed && (
          <>
            <BrandMark size={40} />
            <span className="font-heading text-sm font-bold leading-tight tracking-tight text-sidebar-foreground">
              {saccoName ?? "Edulaepe Credit and Saving"}
            </span>
          </>
        )}
        <button
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-md text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            !collapsed && "ml-auto"
          )}
        >
          {collapsed ? (
            <PanelLeftOpen className="size-4" />
          ) : (
            <PanelLeftClose className="size-4" />
          )}
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {adminSidebarNav.map((item) => {
          const active =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          const link = (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg border-l-2 border-transparent px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                active &&
                  "border-sidebar-primary bg-sidebar-accent text-sidebar-primary",
                collapsed && "justify-center px-0"
              )}
            >
              <item.icon className="size-4 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );

          if (!collapsed) return link;

          return (
            <Tooltip key={item.href}>
              <TooltipTrigger render={link} />
              <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
          );
        })}
      </nav>

      {hasMemberProfile && (
        <div className="px-3 pb-1">
          <Link
            href={ROUTES.PORTAL}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <UserCircle className="size-4 shrink-0" />
            {!collapsed && <span className="truncate">My account</span>}
          </Link>
        </div>
      )}

      <SidebarLogoutButton collapsed={collapsed} />
    </aside>
  );
}
