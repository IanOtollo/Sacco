"use client";

import type { PaginationStatus } from "convex/react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// Footer for lists backed by usePaginatedQuery: shows "Load more" while
// there are further pages and nothing once the end is reached.
export function LoadMore({
  status,
  onLoadMore,
  pageSize,
}: {
  status: PaginationStatus;
  onLoadMore: (numItems: number) => void;
  pageSize: number;
}) {
  if (status === "Exhausted" || status === "LoadingFirstPage") return null;
  const loading = status === "LoadingMore";
  return (
    <div className="mt-6 flex justify-center">
      <Button
        variant="outline"
        disabled={loading}
        onClick={() => onLoadMore(pageSize)}
      >
        {loading && <Loader2 className="size-4 animate-spin" />}
        {loading ? "Loading…" : "Load more"}
      </Button>
    </div>
  );
}
