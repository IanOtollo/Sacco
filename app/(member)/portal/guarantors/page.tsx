import type { Metadata } from "next";
import { GuarantorsPageClient } from "@/components/guarantors/guarantors-page-client";

export const metadata: Metadata = { title: "Guarantor requests" };

export default function GuarantorsPage() {
  return <GuarantorsPageClient />;
}
