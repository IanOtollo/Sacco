import type { Metadata } from "next";
import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/shared/brand-mark";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4 text-center">
      <BrandMark size={88} />
      <div>
        <p className="font-mono text-sm font-medium text-muted-foreground">
          404
        </p>
        <h1 className="mt-2 font-heading text-2xl font-bold tracking-tight">
          We couldn&apos;t find that page
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or may have
          moved.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Button render={<Link href="/">Back to home</Link>} nativeButton={false} />
        <Button
          variant="outline"
          render={<Link href="/login">Sign in</Link>}
          nativeButton={false}
        />
      </div>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Compass className="size-3.5" />
        Edulaepe Credit and Saving
      </div>
    </div>
  );
}
