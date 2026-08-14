"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { PanelLeftClose, PanelLeftOpen, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { memberSidebarNav, committeeNavItems } from "@/lib/nav-config";
import { api } from "@/convex/_generated/api";
import { ROUTES } from "@/lib/constants";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SidebarLogoutButton } from "@/components/layout/sidebar-logout-button";
import { BrandMark } from "@/components/shared/brand-mark";

export function MemberSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const saccoName = useQuery(api.settings.queries.getSaccoName);
  const currentUser = useQuery(api.users.getCurrentUser);

  const isTopOffice =
    currentUser?.committeeRole === "chairman" ||
    currentUser?.committeeRole === "deputy_chairman";

  const navItems = [
    ...memberSidebarNav.slice(0, -1),
    ...committeeNavItems(currentUser?.committeeRole),
    ...memberSidebarNav.slice(-1),
  ];

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

      {isTopOffice && (
        <div className="px-3 pt-3">
          <Link
            href={ROUTES.ADMIN}
            className="flex items-center gap-2 rounded-lg bg-sidebar-accent px-3 py-2 text-sm font-medium text-sidebar-accent-foreground transition-colors hover:bg-sidebar-accent/80"
          >
            <LayoutDashboard className="size-4 shrink-0" />
            {!collapsed && <span className="truncate">Admin panel</span>}
          </Link>
        </div>
      )}

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {navItems.map((item) => {
          const active =
            item.href === "/portal"
              ? pathname === "/portal"
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

      <SidebarLogoutButton collapsed={collapsed} />
    </aside>
  );
}
