"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { useAuthActions, useConvexAuth } from "@convex-dev/auth/react";
import { api } from "@/convex/_generated/api";
import { ROUTES, type Role, portalHomeForRole } from "@/lib/constants";
import { ForcePasswordChange } from "@/components/auth/force-password-change";
import { IdleLogoutWatcher } from "@/components/auth/idle-logout-watcher";
import { Loader2 } from "lucide-react";

export function PortalGate({
  allowedRoles,
  children,
}: {
  allowedRoles: Role[];
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const { signOut } = useAuthActions();
  const router = useRouter();
  const currentUser = useQuery(
    api.users.getCurrentUser,
    isAuthenticated ? {} : "skip"
  );

  const suspended = currentUser?.isActive === false;
  const wrongRole =
    currentUser && currentUser.role && !allowedRoles.includes(currentUser.role);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.replace(ROUTES.LOGIN);
      return;
    }
    if (suspended) {
      void signOut();
      router.replace(ROUTES.LOGIN);
      return;
    }
    if (wrongRole && currentUser) {
      router.replace(portalHomeForRole(currentUser.role));
    }
  }, [authLoading, isAuthenticated, suspended, wrongRole, currentUser, router, signOut]);

  if (authLoading || currentUser === undefined || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (currentUser === null || suspended || wrongRole) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (currentUser.isFirstLogin) {
    return <ForcePasswordChange />;
  }

  return (
    <>
      <IdleLogoutWatcher />
      {children}
    </>
  );
}
