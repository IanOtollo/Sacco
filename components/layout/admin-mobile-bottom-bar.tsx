"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { adminBottomBarNav, adminMoreSheetNav } from "@/lib/nav-config";
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
  const moreActive = adminMoreSheetNav.some((item) =>
    isActivePath(pathname, item.href)
  );

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-stretch border-t border-border bg-background/95 backdrop-blur-md lg:hidden">
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
                "flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium text-muted-foreground",
                moreActive && "text-primary"
              )}
            >
              <Menu className="size-5" />
              More
            </button>
          }
        />
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>More</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-3 gap-3 px-4 pb-6">
            {adminMoreSheetNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-2 rounded-xl border border-border p-4 text-xs font-medium text-foreground hover:bg-muted"
              >
                <item.icon className="size-5 text-primary" />
                {item.label}
              </Link>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
}
