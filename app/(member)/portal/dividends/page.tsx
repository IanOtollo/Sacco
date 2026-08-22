import type { Metadata } from "next";
import { PortalDividendsGate } from "@/components/dividends/portal-dividends-gate";

export const metadata: Metadata = { title: "Dividends" };

export default function PortalDividendsPage() {
  return <PortalDividendsGate />;
}
