"use client";

import { useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDate } from "@/lib/utils";
import { Megaphone } from "lucide-react";

const PRIORITY_TONE: Record<string, string> = {
  normal: "bg-muted text-muted-foreground",
  important: "bg-warning/15 text-warning-foreground",
  urgent: "bg-danger/10 text-danger",
};

export function UpdatesFeedClient() {
  const announcements = useQuery(api.announcements.queries.listForMe);
  const markAnnouncementsRead = useMutation(api.notifications.mutations.markAnnouncementsRead);

  useEffect(() => {
    markAnnouncementsRead({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-heading text-2xl font-bold tracking-tight">
        Updates
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        News and announcements from your Sacco.
      </p>

      <div className="mt-6 space-y-4">
        {announcements === undefined ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-2xl" />
          ))
        ) : announcements.length === 0 ? (
          <EmptyState
            icon={Megaphone}
            title="No updates yet"
            description="Announcements from your Sacco will appear here."
          />
        ) : (
          announcements.map((a) => (
            <Card key={a._id} className="rounded-2xl border-border/50 p-6">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_TONE[a.priority]}`}
                >
                  {a.priority}
                </span>
                <span className="text-xs text-muted-foreground">
                  {a.publishedAt ? formatDate(a.publishedAt) : ""}
                </span>
              </div>
              <h2 className="mt-2 font-semibold">{a.title}</h2>
              <p className="mt-1.5 whitespace-pre-wrap text-sm text-muted-foreground">
                {a.content}
              </p>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
