"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Skeleton } from "@/components/ui/skeleton";
import { DividendsPageClient } from "@/components/dividends/dividends-page-client";
import { MemberDividendsPageClient } from "@/components/dividends/member-dividends-page-client";

// Treasurers (and admins visiting the portal) manage dividends here; every
// other member just sees their own payouts and redeems their 2nd share.
export function PortalDividendsGate() {
  const user = useQuery(api.users.getCurrentUser);

  if (user === undefined) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  const canManage =
    user?.role === "super_admin" ||
    user?.role === "admin" ||
    user?.committeeRole === "treasurer";

  return canManage ? <DividendsPageClient /> : <MemberDividendsPageClient />;
}
