"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { memberBottomBarNav } from "@/lib/nav-config";

export function MemberBottomBar() {
  const pathname = usePathname();
  const unreadAnnouncements = useQuery(api.notifications.queries.getUnreadAnnouncementCount);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-stretch border-t border-border bg-background/95 backdrop-blur-md lg:hidden print:hidden">
      {memberBottomBarNav.map((item) => {
        const active =
          item.href === "/portal"
            ? pathname === "/portal"
            : pathname.startsWith(item.href);
        const badgeCount = item.href === ROUTES.PORTAL_UPDATES ? unreadAnnouncements : undefined;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium text-muted-foreground",
              active && "text-primary"
            )}
          >
            <span className="relative">
              <item.icon className={cn("size-5", active && "fill-primary/15")} />
              {!!badgeCount && (
                <span className="absolute -top-1.5 -right-2 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-danger px-0.5 text-[9px] font-medium text-danger-foreground">
                  {badgeCount > 9 ? "9+" : badgeCount}
                </span>
              )}
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
