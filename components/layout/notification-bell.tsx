"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { Bell, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationIcon } from "@/components/shared/notification-icon";
import { formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

function NotificationRow({ n }: { n: Doc<"notifications"> }) {
  const router = useRouter();
  const markRead = useMutation(api.notifications.mutations.markRead);

  function handleClick() {
    if (!n.isRead) void markRead({ notificationId: n._id });
    if (n.actionUrl) router.push(n.actionUrl);
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        "flex w-full gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-muted",
        !n.isRead && "bg-primary/5"
      )}
    >
      <NotificationIcon type={n.type} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{n.title}</p>
        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
          {n.message}
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          {formatDateTime(n._creationTime)}
        </p>
      </div>
      {!n.isRead && (
        <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" />
      )}
    </button>
  );
}

export function NotificationBell({ viewAllHref }: { viewAllHref?: string }) {
  const notifications = useQuery(api.notifications.queries.getMine, {
    limit: 8,
  });
  const unreadCount = useQuery(api.notifications.queries.getUnreadCount);
  const markAllRead = useMutation(api.notifications.mutations.markAllRead);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
            <Bell className="size-5" />
            {!!unreadCount && (
              <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-danger text-[10px] font-medium text-danger-foreground">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-80 p-2">
        <div className="flex items-center justify-between px-1 py-1">
          <span className="text-sm font-semibold">Notifications</span>
          {!!unreadCount && (
            <button
              onClick={() => void markAllRead({})}
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <Check className="size-3" />
              Mark all read
            </button>
          )}
        </div>
        <div className="max-h-96 space-y-0.5 overflow-y-auto">
          {notifications === undefined ? (
            <div className="px-3 py-6 text-center text-sm text-muted-foreground">
              Loading...
            </div>
          ) : notifications.length === 0 ? (
            <div className="px-3 py-6 text-center text-sm text-muted-foreground">
              You&apos;re all caught up.
            </div>
          ) : (
            notifications.map((n) => <NotificationRow key={n._id} n={n} />)
          )}
        </div>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="mt-1 block rounded-lg px-3 py-2 text-center text-sm text-primary hover:bg-muted"
          >
            View all
          </Link>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
