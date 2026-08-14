import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { formatDate } from "@/lib/utils";

type Installment = {
  _id: string;
  installmentNumber: bigint | number;
  dueDate: string;
  principalDue: number;
  interestDue: number;
  totalDue: number;
  amountPaid: number;
  status: string;
};

export function RepaymentSchedule({ schedule }: { schedule: Installment[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <Table>
        <TableHeader>
          <TableRow className="[&>th]:bg-muted/50">
            <TableHead>#</TableHead>
            <TableHead>Due date</TableHead>
            <TableHead className="text-right">Principal</TableHead>
            <TableHead className="text-right">Interest</TableHead>
            <TableHead className="text-right">Total due</TableHead>
            <TableHead className="text-right">Paid</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {schedule.map((s, i) => (
            <TableRow
              key={s._id}
              className={i % 2 === 1 ? "bg-muted/20" : undefined}
            >
              <TableCell>{String(s.installmentNumber)}</TableCell>
              <TableCell>{formatDate(s.dueDate)}</TableCell>
              <TableCell className="text-right">
                <CurrencyDisplay amount={s.principalDue} />
              </TableCell>
              <TableCell className="text-right">
                <CurrencyDisplay amount={s.interestDue} />
              </TableCell>
              <TableCell className="text-right font-medium">
                <CurrencyDisplay amount={s.totalDue} />
              </TableCell>
              <TableCell className="text-right text-muted-foreground">
                <CurrencyDisplay amount={s.amountPaid} />
              </TableCell>
              <TableCell>
                <StatusBadge status={s.status} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
