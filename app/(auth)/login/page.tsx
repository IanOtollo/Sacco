import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Landmark } from "lucide-react";
import { getCurrentUserServer } from "@/lib/auth-server";
import { portalHomeForRole } from "@/lib/constants";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage() {
  const user = await getCurrentUserServer();
  if (user) {
    redirect(portalHomeForRole(user.role));
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-background px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <Link
            href="/"
            className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground"
          >
            <Landmark className="size-6" />
          </Link>
          <span className="font-heading text-lg font-bold tracking-tight">
            Client Sacco
          </span>
        </div>
        <Card className="rounded-2xl border-border/50 shadow-sm">
          <CardHeader>
            <h1 className="font-heading text-xl font-semibold tracking-tight">
              Sign in to your account
            </h1>
            <p className="text-sm text-muted-foreground">
              Enter your member credentials to continue.
            </p>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
