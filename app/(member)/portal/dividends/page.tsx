import type { Metadata } from "next";
import { DividendsPageClient } from "@/components/dividends/dividends-page-client";

export const metadata: Metadata = { title: "Dividends" };

export default function PortalDividendsPage() {
  return <DividendsPageClient />;
}
