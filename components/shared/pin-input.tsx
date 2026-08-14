"use client";

import { forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const PinInput = forwardRef<
  HTMLInputElement,
  Omit<React.ComponentProps<typeof Input>, "type">
>(function PinInput({ className, disabled, onChange, ...props }, ref) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        ref={ref}
        type={visible ? "text" : "password"}
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={4}
        placeholder="••••"
        disabled={disabled}
        className={cn("pr-10 tracking-[0.5em]", className)}
        onChange={(e) => {
          e.target.value = e.target.value.replace(/\D/g, "").slice(0, 4);
          onChange?.(e);
        }}
        {...props}
      />
      <button
        type="button"
        tabIndex={-1}
        disabled={disabled}
        onClick={() => setVisible((v) => !v)}
        className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground disabled:opacity-50"
        aria-label={visible ? "Hide PIN" : "Show PIN"}
      >
        {visible ? (
          <EyeOff className="size-4" />
        ) : (
          <Eye className="size-4" />
        )}
      </button>
    </div>
  );
});
