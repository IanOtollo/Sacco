import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/shared/status-badge";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { formatDate } from "@/lib/utils";

export function LoanCard({
  loan,
}: {
  loan: {
    _id: string;
    loanNumber: string;
    productName: string;
    principalAmount: number;
    totalRepayable: number;
    totalPaid: number;
    outstandingBalance: number;
    monthlyRepayment: number;
    status: string;
    maturityDate?: string;
  };
}) {
  const percentRepaid =
    loan.totalRepayable > 0
      ? Math.min(100, Math.round((loan.totalPaid / loan.totalRepayable) * 100))
      : 0;

  return (
    <Link href={`/portal/loans/${loan._id}`}>
      <Card className="rounded-2xl border-border/50 p-6 transition-shadow hover:shadow-lg">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-semibold">{loan.productName}</p>
            <p className="mt-0.5 font-mono text-xs text-muted-foreground">
              {loan.loanNumber}
            </p>
          </div>
          <StatusBadge status={loan.status} />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Outstanding</p>
            <p className="mt-0.5 font-semibold">
              <CurrencyDisplay amount={loan.outstandingBalance} />
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Monthly payment</p>
            <p className="mt-0.5 font-semibold">
              <CurrencyDisplay amount={loan.monthlyRepayment} />
            </p>
          </div>
        </div>

        {["active", "disbursed"].includes(loan.status) && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{percentRepaid}% repaid</span>
              {loan.maturityDate && <span>Due {formatDate(loan.maturityDate)}</span>}
            </div>
            <Progress value={percentRepaid} className="mt-1.5 h-1.5" />
          </div>
        )}
      </Card>
    </Link>
  );
}
