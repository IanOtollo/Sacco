"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { BrandMark } from "@/components/shared/brand-mark";
import { PAYBILL } from "@/components/shared/paybill-info";
import { formatCurrency, formatDate } from "@/lib/utils";

type LoanForPrint = {
  loanNumber: string;
  status: string;
  purpose: string;
  principalAmount: number;
  interestAmount: number;
  totalRepayable: number;
  monthlyRepayment: number;
  termMonths: bigint | number;
  termDays?: bigint | number | null;
  nonMemberLoanCategory?: "emergency" | "development" | null;
  interestRate: number;
  appliedAt: string;
  disbursementDate?: string | null;
  maturityDate?: string | null;
  outstandingBalance: number;
  totalPaid: number;
  member: {
    firstName: string;
    lastName: string;
    memberNumber: string;
    nationalId: string;
    phoneNumber: string;
    email?: string | null;
  } | null;
  product: { name: string } | null;
  guarantors: { guarantorName: string; status: string }[];
  schedule: {
    installmentNumber: bigint | number;
    dueDate: string;
    principalDue: number;
    interestDue: number;
    totalDue: number;
    amountPaid: number;
    status: string;
  }[];
};

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <td className="w-2/5 py-1 pr-3 align-top text-[11px] uppercase tracking-wide text-neutral-500">
        {label}
      </td>
      <td className="py-1 text-sm font-semibold text-neutral-900">{value}</td>
    </tr>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="border-b border-neutral-900 pb-1 text-xs font-bold uppercase tracking-widest text-neutral-900">
      {children}
    </p>
  );
}

export function LoanPrintSheet({ loan }: { loan: LoanForPrint }) {
  const saccoInfo = useQuery(api.settings.queries.getPublicSaccoInfo);

  const term =
    loan.termDays != null
      ? `${Number(loan.termDays)} day${Number(loan.termDays) === 1 ? "" : "s"}`
      : `${Number(loan.termMonths)} month${Number(loan.termMonths) === 1 ? "" : "s"}`;

  return (
    <div
      id="loan-print-sheet"
      className="hidden bg-white p-10 text-neutral-900 print:block"
    >
      {/* Letterhead */}
      <div className="flex items-start justify-between gap-6 border-b-2 border-neutral-900 pb-4">
        <div className="flex items-center gap-3">
          <BrandMark size={60} />
          <div>
            <p className="font-heading text-lg font-bold leading-tight">
              {saccoInfo?.name ?? "Edulaepe Credit and Saving"}
            </p>
            {saccoInfo?.address && (
              <p className="text-xs text-neutral-600">{saccoInfo.address}</p>
            )}
            <p className="text-xs text-neutral-600">
              {[saccoInfo?.phone, saccoInfo?.email].filter(Boolean).join("   ·   ")}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-base font-bold uppercase tracking-widest">
            Loan Statement
          </p>
          <p className="mt-1 font-mono text-xs text-neutral-600">{loan.loanNumber}</p>
          <p className="text-xs text-neutral-600">
            Issued {formatDate(new Date().toISOString())}
          </p>
        </div>
      </div>

      {/* Member / Loan details */}
      <div className="mt-6 grid grid-cols-2 gap-8">
        <div>
          <SectionLabel>Member details</SectionLabel>
          <table className="mt-2 w-full border-collapse">
            <tbody>
              <InfoRow
                label="Full name"
                value={loan.member ? `${loan.member.firstName} ${loan.member.lastName}` : "—"}
              />
              <InfoRow label="Member no." value={loan.member?.memberNumber ?? "—"} />
              <InfoRow label="National ID" value={loan.member?.nationalId ?? "—"} />
              <InfoRow label="Phone" value={loan.member?.phoneNumber ?? "—"} />
              {loan.member?.email && <InfoRow label="Email" value={loan.member.email} />}
            </tbody>
          </table>
        </div>
        <div>
          <SectionLabel>Loan details</SectionLabel>
          <table className="mt-2 w-full border-collapse">
            <tbody>
              <InfoRow
                label="Product"
                value={
                  loan.nonMemberLoanCategory === "emergency"
                    ? "Emergency Loan"
                    : loan.nonMemberLoanCategory === "development"
                      ? "Development Loan"
                      : (loan.product?.name ?? "—")
                }
              />
              <InfoRow label="Status" value={loan.status.replace(/_/g, " ")} />
              <InfoRow label="Purpose" value={loan.purpose} />
              <InfoRow label="Interest rate" value={`${loan.interestRate}%`} />
              <InfoRow label="Term" value={term} />
              <InfoRow label="Applied" value={formatDate(loan.appliedAt)} />
              {loan.disbursementDate && (
                <InfoRow label="Disbursed" value={formatDate(loan.disbursementDate)} />
              )}
              {loan.maturityDate && (
                <InfoRow label="Maturity" value={formatDate(loan.maturityDate)} />
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary strip */}
      <div className="mt-6 grid grid-cols-4 divide-x divide-neutral-300 border border-neutral-900 text-center">
        <div className="px-3 py-3">
          <p className="text-[11px] uppercase tracking-wide text-neutral-500">Principal</p>
          <p className="mt-1 font-mono text-sm font-bold">{formatCurrency(loan.principalAmount)}</p>
        </div>
        <div className="px-3 py-3">
          <p className="text-[11px] uppercase tracking-wide text-neutral-500">Total repayable</p>
          <p className="mt-1 font-mono text-sm font-bold">{formatCurrency(loan.totalRepayable)}</p>
        </div>
        <div className="px-3 py-3">
          <p className="text-[11px] uppercase tracking-wide text-neutral-500">Total paid</p>
          <p className="mt-1 font-mono text-sm font-bold">{formatCurrency(loan.totalPaid)}</p>
        </div>
        <div className="px-3 py-3">
          <p className="text-[11px] uppercase tracking-wide text-neutral-500">Outstanding</p>
          <p className="mt-1 font-mono text-sm font-bold">{formatCurrency(loan.outstandingBalance)}</p>
        </div>
      </div>

      {loan.guarantors.length > 0 && (
        <div className="mt-6">
          <SectionLabel>Guarantors</SectionLabel>
          <table className="mt-2 w-full border-collapse text-sm">
            <tbody>
              {loan.guarantors.map((g, i) => (
                <tr key={i} className="border-b border-neutral-200">
                  <td className="py-1">{g.guarantorName}</td>
                  <td className="py-1 text-right capitalize text-neutral-600">{g.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Repayment schedule */}
      {loan.schedule.length > 0 && (
        <div className="mt-6">
          <SectionLabel>Repayment schedule</SectionLabel>
          <table className="mt-2 w-full border-collapse text-xs">
            <thead>
              <tr className="border-b-2 border-neutral-900">
                <th className="py-1.5 text-left font-semibold">#</th>
                <th className="py-1.5 text-left font-semibold">Due date</th>
                <th className="py-1.5 text-right font-semibold">Principal</th>
                <th className="py-1.5 text-right font-semibold">Interest</th>
                <th className="py-1.5 text-right font-semibold">Total due</th>
                <th className="py-1.5 text-right font-semibold">Paid</th>
                <th className="py-1.5 text-left font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {loan.schedule.map((s, i) => (
                <tr key={i} className="border-b border-neutral-300">
                  <td className="py-1">{String(s.installmentNumber)}</td>
                  <td className="py-1">{formatDate(s.dueDate)}</td>
                  <td className="py-1 text-right font-mono">{formatCurrency(s.principalDue)}</td>
                  <td className="py-1 text-right font-mono">{formatCurrency(s.interestDue)}</td>
                  <td className="py-1 text-right font-mono font-semibold">
                    {formatCurrency(s.totalDue)}
                  </td>
                  <td className="py-1 text-right font-mono text-neutral-600">
                    {formatCurrency(s.amountPaid)}
                  </td>
                  <td className="py-1 capitalize">{s.status.replace(/_/g, " ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Payment remittance panel */}
      <div className="mt-6 border-2 border-neutral-900 p-4">
        <p className="text-xs font-bold uppercase tracking-widest">Repay via M-Pesa</p>
        <div className="mt-2 grid grid-cols-3 gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-neutral-500">Paybill no.</p>
            <p className="font-mono text-base font-bold">{PAYBILL.number}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-neutral-500">Account no.</p>
            <p className="font-mono text-base font-bold">{PAYBILL.account}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-neutral-500">Account name</p>
            <p className="text-base font-bold">{PAYBILL.accountName}</p>
          </div>
        </div>
      </div>

      {/* Signatures */}
      <div className="mt-16 grid grid-cols-2 gap-12 text-xs">
        <div className="border-t border-neutral-900 pt-1">Member signature &amp; date</div>
        <div className="border-t border-neutral-900 pt-1">Authorized officer signature &amp; date</div>
      </div>

      <p className="mt-8 text-center text-[10px] text-neutral-500">
        This statement is computer-generated and reflects the loan record as at the date of
        printing. For queries, contact {saccoInfo?.name ?? "the SACCO"}
        {saccoInfo?.phone ? ` on ${saccoInfo.phone}` : ""}.
      </p>
    </div>
  );
}
