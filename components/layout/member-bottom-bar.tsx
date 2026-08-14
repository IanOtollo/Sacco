"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { memberBottomBarNav } from "@/lib/nav-config";

export function MemberBottomBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-stretch border-t border-border bg-background/95 backdrop-blur-md lg:hidden">
      {memberBottomBarNav.map((item) => {
        const active =
          item.href === "/portal"
            ? pathname === "/portal"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium text-muted-foreground",
              active && "text-primary"
            )}
          >
            <item.icon className={cn("size-5", active && "fill-primary/15")} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
