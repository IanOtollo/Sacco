"use client";

import { useRouter } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function SidebarLogoutButton({ collapsed }: { collapsed: boolean }) {
  const { signOut } = useAuthActions();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push(ROUTES.LOGIN);
  }

  const button = (
    <button
      onClick={() => void handleSignOut()}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-danger/10 hover:text-danger",
        collapsed && "justify-center px-0"
      )}
    >
      <LogOut className="size-4 shrink-0" />
      {!collapsed && <span className="truncate">Sign out</span>}
    </button>
  );

  return (
    <div className="border-t border-sidebar-border p-3">
      {collapsed ? (
        <Tooltip>
          <TooltipTrigger render={button} />
          <TooltipContent side="right">Sign out</TooltipContent>
        </Tooltip>
      ) : (
        button
      )}
    </div>
  );
}
