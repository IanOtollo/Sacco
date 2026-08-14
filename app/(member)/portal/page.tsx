import type { Metadata } from "next";
import { MemberDashboardClient } from "@/components/dashboard/member-dashboard-client";

export const metadata: Metadata = { title: "Home" };

export default function PortalHomePage() {
  return <MemberDashboardClient />;
}
