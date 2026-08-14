import type { Metadata } from "next";
import { AdminLoanDetailClient } from "@/components/loans/admin-loan-detail-client";

export const metadata: Metadata = { title: "Loan details" };

export default async function AdminLoanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AdminLoanDetailClient loanId={id} />;
}
