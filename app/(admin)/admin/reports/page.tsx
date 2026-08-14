import type { Metadata } from "next";
import { ReportsPageClient } from "@/components/reports/reports-page-client";

export const metadata: Metadata = { title: "Reports" };

export default function ReportsPage() {
  return <ReportsPageClient />;
}
