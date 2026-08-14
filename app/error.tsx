"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
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
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-danger/10 text-danger">
        <AlertTriangle className="size-7" />
      </div>
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          Something went wrong
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
          An unexpected error occurred. You can try again, or head back home.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Button onClick={() => reset()}>Try again</Button>
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href="/">Back to home</Link>}
        />
      </div>
    </div>
  );
}
