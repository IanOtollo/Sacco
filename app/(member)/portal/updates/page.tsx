import type { Metadata } from "next";
import { UpdatesFeedClient } from "@/components/announcements/updates-feed-client";

export const metadata: Metadata = { title: "Updates" };

export default function UpdatesPage() {
  return <UpdatesFeedClient />;
}
