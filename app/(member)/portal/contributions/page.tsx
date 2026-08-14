import type { Metadata } from "next";
import { ContributionsPageClient } from "@/components/contributions/contributions-page-client";

export const metadata: Metadata = { title: "Contributions" };

export default function PortalContributionsPage() {
  return <ContributionsPageClient basePath="/portal/contributions" />;
}
