"use client";

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { Megaphone, X } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { ANNOUNCEMENT_POPUP_START } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

const AUTO_CLOSE_MS = 10_000;

const PRIORITY_TONE: Record<string, string> = {
  normal: "bg-muted text-muted-foreground",
  important: "bg-warning/15 text-warning-foreground",
  urgent: "bg-danger/10 text-danger",
};

function storageKey(userId: string) {
  return `sacco:seen-announcement-popups:${userId}`;
}

function readSeen(userId: string): string[] {
  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function writeSeen(userId: string, ids: string[]) {
  try {
    window.localStorage.setItem(storageKey(userId), JSON.stringify(ids));
  } catch {
    // Storage blocked — the popup may show again next visit, which is fine.
  }
}

// One-time-per-announcement popup for members. Purely a nudge: dismissing it
// never marks the bell notification or Updates badge as read — those only
// clear when the member opens the announcement themselves.
export function AnnouncementPopup() {
  const user = useQuery(api.users.getCurrentUser);
  const announcements = useQuery(api.announcements.queries.listForMe);
  const [seen, setSeen] = useState<string[] | null>(null);

  const userId = user?._id;
  useEffect(() => {
    if (userId) setSeen(readSeen(userId));
  }, [userId]);

  if (!userId || !announcements || seen === null) return null;

  // Only announcements published after the popup feature shipped, oldest
  // unseen first so nothing gets skipped.
  const queue = announcements
    .filter(
      (a) =>
        a.publishedAt &&
        a.publishedAt > ANNOUNCEMENT_POPUP_START &&
        !seen.includes(a._id)
    )
    .sort((a, b) => (a.publishedAt! < b.publishedAt! ? -1 : 1));
  const current = queue[0];
  if (!current) return null;

  function dismiss() {
    const next = [...seen!, current._id];
    setSeen(next);
    writeSeen(userId!, next);
  }

  return (
    <PopupCard
      key={current._id}
      title={current.title}
      content={current.content}
      priority={current.priority}
      publishedAt={current.publishedAt!}
      onDismiss={dismiss}
    />
  );
}

function PopupCard({
  title,
  content,
  priority,
  publishedAt,
  onDismiss,
}: {
  title: string;
  content: string;
  priority: string;
  publishedAt: string;
  onDismiss: () => void;
}) {
  const [counting, setCounting] = useState(false);

  useEffect(() => {
    // Flip on the next frame so the ring transitions from full to empty.
    const frame = requestAnimationFrame(() => setCounting(true));
    const timer = setTimeout(onDismiss, AUTO_CLOSE_MS);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <DialogPrimitive.Root
      open
      onOpenChange={(open) => {
        if (!open) onDismiss();
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 isolate z-50 bg-black/40 backdrop-blur-xs duration-200 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <DialogPrimitive.Popup className="fixed top-1/2 left-1/2 z-50 w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-popover p-6 text-popover-foreground shadow-xl ring-1 ring-foreground/10 outline-none duration-200 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 sm:max-w-lg sm:p-8">
          <DialogPrimitive.Close
            aria-label="Close announcement"
            className="absolute top-3 right-3 flex size-12 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
          >
            <svg
              viewBox="0 0 48 48"
              className="absolute inset-0 size-12 -rotate-90"
              aria-hidden="true"
            >
              <circle
                cx="24"
                cy="24"
                r="21"
                fill="none"
                pathLength={1}
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="1"
                strokeDashoffset={counting ? 1 : 0}
                className="stroke-primary transition-[stroke-dashoffset] duration-[10000ms] ease-linear"
              />
            </svg>
            <X className="size-6" />
          </DialogPrimitive.Close>

          <div className="flex items-center gap-3 pr-12">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Megaphone className="size-5" />
            </div>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${PRIORITY_TONE[priority] ?? PRIORITY_TONE.normal}`}
            >
              {priority}
            </span>
          </div>

          <DialogPrimitive.Title className="mt-4 pr-12 font-heading text-xl font-bold leading-tight tracking-tight sm:text-2xl">
            {title}
          </DialogPrimitive.Title>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatDate(publishedAt)}
          </p>
          <DialogPrimitive.Description className="mt-4 max-h-[50vh] overflow-y-auto whitespace-pre-wrap text-base leading-relaxed">
            {content}
          </DialogPrimitive.Description>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
