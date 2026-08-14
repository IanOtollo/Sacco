"use client";

import { useEffect, useState } from "react";
import { ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

const RADIUS = 20;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// Mobile-only: as the visitor scrolls down through the content below the
// auth panel, this fills up like a progress ring. Clicking it scrolls back
// to the top, where the sign-in form lives.
export function MobileScrollIndicator() {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function handleScroll() {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? Math.min(100, (scrollTop / docHeight) * 100) : 0;
      setProgress(pct);
      setVisible(scrollTop > 240);
    }
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const offset = CIRCUMFERENCE - (progress / 100) * CIRCUMFERENCE;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Back to sign in"
      className={cn(
        "fixed right-5 bottom-5 z-50 flex size-12 items-center justify-center rounded-full bg-card shadow-lg ring-1 ring-border transition-opacity duration-200 lg:hidden",
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      )}
    >
      <svg className="absolute inset-0 -rotate-90" width="48" height="48" viewBox="0 0 48 48">
        <circle
          cx="24"
          cy="24"
          r={RADIUS}
          stroke="var(--border)"
          strokeWidth="3"
          fill="none"
        />
        <circle
          cx="24"
          cy="24"
          r={RADIUS}
          stroke="var(--primary)"
          strokeWidth="3"
          fill="none"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-[stroke-dashoffset] duration-150"
        />
      </svg>
      <ChevronUp className="size-5 text-primary" />
    </button>
  );
}
