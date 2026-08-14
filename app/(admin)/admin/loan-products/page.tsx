import type { Metadata } from "next";
import { LoanProductsPageClient } from "@/components/loan-products/loan-products-page-client";

export const metadata: Metadata = { title: "Loan products" };

export default function LoanProductsPage() {
  return <LoanProductsPageClient />;
}
