import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";

export function CurrencyDisplay({
  amount,
  className,
}: {
  amount: number;
  className?: string;
}) {
  return (
    <span className={cn("font-mono tabular-nums", className)}>
      {formatCurrency(amount)}
    </span>
  );
}
