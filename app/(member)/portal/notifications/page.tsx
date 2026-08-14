import type { Metadata } from "next";
import { NotificationsPageClient } from "@/components/notifications/notifications-page-client";

export const metadata: Metadata = { title: "Notifications" };

export default function NotificationsPage() {
  return <NotificationsPageClient />;
}
