import type { Metadata } from "next";
import { LoansPageClient } from "@/components/loans/loans-page-client";

export const metadata: Metadata = { title: "My loans" };

export default function LoansPage() {
  return <LoansPageClient />;
}
