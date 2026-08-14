"use client";

import { useRouter } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";
import { LogOut, User as UserIcon } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ROUTES } from "@/lib/constants";
import { formatPhoneDisplay } from "@/lib/phone";

function initials(name?: string | null) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function UserMenu({
  name,
  phone,
  profileHref,
}: {
  name?: string | null;
  phone?: string | null;
  profileHref?: string;
}) {
  const { signOut } = useAuthActions();
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            className="flex h-auto items-center gap-2 px-1.5 py-1"
          >
            <Avatar className="size-8">
              <AvatarFallback className="bg-primary text-xs text-primary-foreground">
                {initials(name)}
              </AvatarFallback>
            </Avatar>
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-1.5 py-1">
          <div className="truncate text-sm font-medium">{name ?? "Member"}</div>
          <div className="truncate text-xs font-normal text-muted-foreground">
            {phone ? formatPhoneDisplay(phone) : ""}
          </div>
        </div>
        <DropdownMenuSeparator />
        {profileHref && (
          <DropdownMenuItem onClick={() => router.push(profileHref)}>
            <UserIcon className="size-4" />
            Profile
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          variant="destructive"
          onClick={() => {
            void signOut();
            router.push(ROUTES.LOGIN);
          }}
        >
          <LogOut className="size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
