import type { Metadata } from "next";
import { LoanDetailClient } from "@/components/loans/loan-detail-client";

export const metadata: Metadata = { title: "Loan details" };

export default async function LoanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <LoanDetailClient loanId={id} />;
}
