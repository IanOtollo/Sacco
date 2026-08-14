"use client";

import { useEffect, useRef, useState } from "react";

export function CountUp({
  value,
  durationMs = 900,
  formatter = (n: number) => Math.round(n).toLocaleString("en-KE"),
  prefix = "",
  suffix = "",
}: {
  value: number;
  durationMs?: number;
  formatter?: (n: number) => string;
  prefix?: string;
  suffix?: string;
}) {
  const [display, setDisplay] = useState(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    startRef.current = null;
    let frame: number;

    const tick = (timestamp: number) => {
      if (startRef.current === null) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const progress = Math.min(elapsed / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(value * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, durationMs]);

  return (
    <span className="font-mono tabular-nums">
      {prefix}
      {formatter(display)}
      {suffix}
    </span>
  );
}
