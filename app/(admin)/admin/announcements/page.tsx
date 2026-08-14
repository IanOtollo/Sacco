import type { Metadata } from "next";
import { AnnouncementsPageClient } from "@/components/announcements/announcements-page-client";

export const metadata: Metadata = { title: "Announcements" };

export default function AnnouncementsPage() {
  return <AnnouncementsPageClient />;
}
