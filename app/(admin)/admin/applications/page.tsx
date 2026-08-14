import type { Metadata } from "next";
import { ApplicationsPageClient } from "@/components/members/applications-page-client";

export const metadata: Metadata = { title: "Applications" };

export default function ApplicationsPage() {
  return <ApplicationsPageClient />;
}
