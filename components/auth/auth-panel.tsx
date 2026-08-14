"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { LoginForm } from "@/components/auth/login-form";
import { ApplyForm } from "@/components/auth/apply-form";
import { cn } from "@/lib/utils";

export function AuthPanel() {
  const [tab, setTab] = useState<"signin" | "signup">("signin");

  return (
    <Card className="rounded-2xl border-border/50 shadow-sm">
      <CardHeader className="pb-0">
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
          <button
            type="button"
            onClick={() => setTab("signin")}
            className={cn(
              "rounded-lg py-2 text-sm font-medium transition-colors",
              tab === "signin"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => setTab("signup")}
            className={cn(
              "rounded-lg py-2 text-sm font-medium transition-colors",
              tab === "signup"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Sign up
          </button>
        </div>
        <h1 className="mt-4 font-heading text-xl font-semibold tracking-tight">
          {tab === "signin" ? "Sign in to your account" : "Apply for membership"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {tab === "signin"
            ? "Enter your member credentials to continue."
            : "Submit your details for admin review and approval."}
        </p>
      </CardHeader>
      <CardContent>
        {tab === "signin" ? <LoginForm /> : <ApplyForm />}
      </CardContent>
    </Card>
  );
}
