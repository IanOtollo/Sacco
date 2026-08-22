"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { adminBottomBarNav, adminMoreSheetNav } from "@/lib/nav-config";
import { api } from "@/convex/_generated/api";
import { ROUTES } from "@/lib/constants";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

function isActivePath(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

export function AdminMobileBottomBar() {
  const pathname = usePathname();
  const pendingDepositClaims = useQuery(api.depositClaims.queries.countPending);
  const moreActive = adminMoreSheetNav.some((item) =>
    isActivePath(pathname, item.href)
  );

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-stretch border-t border-border bg-background/95 backdrop-blur-md lg:hidden print:hidden">
      {adminBottomBarNav.map((item) => {
        const active = isActivePath(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium text-muted-foreground",
              active && "text-primary"
            )}
          >
            <item.icon
              className={cn("size-5", active && "fill-primary/15")}
            />
            {item.label}
          </Link>
        );
      })}

      <Sheet>
        <SheetTrigger
          render={
            <button
              className={cn(
                "relative flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium text-muted-foreground",
                moreActive && "text-primary"
              )}
            >
              <span className="relative">
                <Menu className="size-5" />
                {!!pendingDepositClaims && (
                  <span className="absolute -top-1.5 -right-2 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-danger px-0.5 text-[9px] font-medium text-danger-foreground">
                    {pendingDepositClaims > 9 ? "9+" : pendingDepositClaims}
                  </span>
                )}
              </span>
              More
            </button>
          }
        />
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>More</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-3 gap-3 px-4 pb-6">
            {adminMoreSheetNav.map((item) => {
              const badgeCount =
                item.href === ROUTES.ADMIN_DEPOSIT_CLAIMS ? pendingDepositClaims : undefined;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative flex flex-col items-center gap-2 rounded-xl border border-border p-4 text-xs font-medium text-foreground hover:bg-muted"
                >
                  {!!badgeCount && (
                    <span className="absolute top-2 right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-medium text-danger-foreground">
                      {badgeCount > 9 ? "9+" : badgeCount}
                    </span>
                  )}
                  <item.icon className="size-5 text-primary" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
}
