import type { Metadata } from "next";
import { AdminDashboardClient } from "@/components/dashboard/admin-dashboard-client";

export const metadata: Metadata = { title: "Dashboard" };

export default function AdminDashboardPage() {
  return <AdminDashboardClient />;
}
