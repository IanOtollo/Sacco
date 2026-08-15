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
        "flex w-full items-center gap-2.5 rounded-lg px-3 py-1.5 text-xs font-medium text-danger transition-colors hover:bg-danger/10",
        collapsed && "justify-center px-0"
      )}
    >
      <LogOut className="size-3.5 shrink-0" />
      {!collapsed && <span className="truncate">Sign out</span>}
    </button>
  );

  return (
    <div className="border-t border-sidebar-border p-2.5">
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
