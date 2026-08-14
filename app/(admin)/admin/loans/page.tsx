import type { Metadata } from "next";
import { AdminLoansPageClient } from "@/components/loans/admin-loans-page-client";

export const metadata: Metadata = { title: "Loans" };

export default function AdminLoansPage() {
  return <AdminLoansPageClient />;
}
