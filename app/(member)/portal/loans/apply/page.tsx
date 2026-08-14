import type { Metadata } from "next";
import { LoanApplicationForm } from "@/components/loans/loan-application-form";

export const metadata: Metadata = { title: "Apply for a loan" };

export default function ApplyLoanPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-heading text-2xl font-bold tracking-tight">
        Apply for a loan
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Takes about two minutes.
      </p>
      <div className="mt-8">
        <LoanApplicationForm />
      </div>
    </div>
  );
}
