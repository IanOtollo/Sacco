import type { Metadata } from "next";
import { DepositClaimsPageClient } from "@/components/accounts/deposit-claims-page-client";

export const metadata: Metadata = { title: "Deposit Claims" };

export default function AdminDepositClaimsPage() {
  return <DepositClaimsPageClient />;
}
