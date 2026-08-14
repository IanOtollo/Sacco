"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-danger/10 text-danger">
        <AlertTriangle className="size-6" />
      </div>
      <div>
        <h2 className="font-heading text-lg font-semibold">
          This page hit an error
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Try again, or navigate elsewhere using the sidebar.
        </p>
      </div>
      <Button onClick={() => reset()}>Try again</Button>
    </div>
  );
}
