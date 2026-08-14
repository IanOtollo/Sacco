import type { Metadata } from "next";
import { MemberProjectsPageClient } from "@/components/projects/member-projects-page-client";

export const metadata: Metadata = { title: "Projects" };

export default function PortalProjectsPage() {
  return <MemberProjectsPageClient />;
}
