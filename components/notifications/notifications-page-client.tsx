"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { NotificationIcon } from "@/components/shared/notification-icon";
import { formatDateTime, cn } from "@/lib/utils";
import { Bell, Check } from "lucide-react";

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
        "flex w-full gap-3 rounded-xl border border-border p-4 text-left transition-colors hover:bg-muted",
        !n.isRead && "bg-primary/5"
      )}
    >
      <NotificationIcon type={n.type} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{n.title}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{n.message}</p>
        <p className="mt-1.5 text-xs text-muted-foreground">
          {formatDateTime(n._creationTime)}
        </p>
      </div>
      {!n.isRead && (
        <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" />
      )}
    </button>
  );
}

export function NotificationsPageClient() {
  const notifications = useQuery(api.notifications.queries.getMine, {
    limit: 100,
  });
  const markAllRead = useMutation(api.notifications.mutations.markAllRead);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          Notifications
        </h1>
        <Button variant="outline" size="sm" onClick={() => void markAllRead({})}>
          <Check className="size-4" />
          Mark all read
        </Button>
      </div>

      <div className="mt-6 space-y-2">
        {notifications === undefined ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="No notifications yet"
            description="Updates about your loans, guarantees, and payments will appear here."
          />
        ) : (
          notifications.map((n) => <NotificationRow key={n._id} n={n} />)
        )}
      </div>
    </div>
  );
}
