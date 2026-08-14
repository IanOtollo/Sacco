"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import {
  GuarantorSelector,
  type GuarantorCandidate,
} from "@/components/loans/guarantor-selector";
import { calculateLoanSchedule } from "@/lib/loan-calc";
import { cn } from "@/lib/utils";
import { Loader2, Check, ArrowLeft, ArrowRight } from "lucide-react";

const STEPS = ["Product", "Amount", "Guarantors", "Review"];

export function LoanApplicationForm() {
  const router = useRouter();
  const products = useQuery(api.loanProducts.queries.listActive);
  const apply = useMutation(api.loans.mutations.apply);

  const [step, setStep] = useState(0);
  const [product, setProduct] = useState<Doc<"loanProducts"> | null>(null);
  const [amount, setAmount] = useState("");
  const [term, setTerm] = useState("");
  const [purpose, setPurpose] = useState("");
  const [guarantors, setGuarantors] = useState<GuarantorCandidate[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const estimate = useMemo(() => {
    if (!product || !amount || !term) return null;
    const principal = Number(amount);
    const termMonths = Number(term);
    if (!principal || !termMonths) return null;
    return calculateLoanSchedule({
      principal,
      annualRatePercent: product.interestRate,
      termMonths,
      method: product.interestMethod,
      disbursementDate: new Date(),
      gracePeriodDays: Number(product.gracePeriodDays),
    });
  }, [product, amount, term]);

  function canAdvance() {
    if (step === 0) return product !== null;
    if (step === 1) {
      if (!product) return false;
      const principal = Number(amount);
      const termMonths = Number(term);
      return (
        principal >= product.minimumAmount &&
        principal <= product.maximumAmount &&
        termMonths >= Number(product.minimumTermMonths) &&
        termMonths <= Number(product.maximumTermMonths) &&
        purpose.trim().length > 0
      );
    }
    if (step === 2) {
      return guarantors.length >= Number(product?.requiredGuarantors ?? 0);
    }
    return true;
  }

  async function handleSubmit() {
    if (!product) return;
    setSubmitting(true);
    try {
      const result = await apply({
        productId: product._id,
        principalAmount: Number(amount),
        termMonths: Number(term),
        purpose,
        guarantorMemberIds: guarantors.map((g) => g._id),
      });
      toast.success(`Loan application ${result.loanNumber} submitted`);
      router.push(`/portal/loans/${result.loanId}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not submit application"
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="mb-8 flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 items-center gap-2">
            <div
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-medium",
                i < step
                  ? "bg-primary text-primary-foreground"
                  : i === step
                    ? "bg-primary/15 text-primary ring-2 ring-primary"
                    : "bg-muted text-muted-foreground"
              )}
            >
              {i < step ? <Check className="size-3.5" /> : i + 1}
            </div>
            <span
              className={cn(
                "hidden text-sm sm:inline",
                i === step ? "font-medium text-foreground" : "text-muted-foreground"
              )}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <div className="h-px flex-1 bg-border" />
            )}
          </div>
        ))}
      </div>

      {step === 0 && (
        <div className="space-y-3">
          {products === undefined ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))
          ) : products.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No loan products are available right now.
            </p>
          ) : (
            products.map((p) => (
              <Card
                key={p._id}
                onClick={() => setProduct(p)}
                className={cn(
                  "cursor-pointer rounded-xl border-border/50 p-5 transition-colors hover:border-primary/40",
                  product?._id === p._id && "border-primary ring-1 ring-primary"
                )}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{p.name}</h3>
                  <span className="text-sm text-muted-foreground">
                    {p.interestRate}% p.a.
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {p.description}
                </p>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-muted-foreground">
                  <span>
                    KES {p.minimumAmount.toLocaleString()} – {p.maximumAmount.toLocaleString()}
                  </span>
                  <span>
                    {String(p.minimumTermMonths)}–{String(p.maximumTermMonths)} months
                  </span>
                  <span>{String(p.requiredGuarantors)} guarantor(s)</span>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {step === 1 && product && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Amount (KES)</label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={`${product.minimumAmount} – ${product.maximumAmount}`}
                className="mt-1.5"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Term (months)</label>
              <Input
                type="number"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder={`${product.minimumTermMonths} – ${product.maximumTermMonths}`}
                className="mt-1.5"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Purpose</label>
            <Textarea
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              rows={3}
              className="mt-1.5"
              placeholder="What is this loan for?"
            />
          </div>
          {estimate && (
            <Card className="rounded-xl border-border/50 bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">
                Estimated monthly repayment
              </p>
              <div className="mt-1 text-xl font-bold">
                <CurrencyDisplay amount={estimate.monthlyRepayment} />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Total repayable ≈{" "}
                <CurrencyDisplay amount={estimate.totalRepayable} /> (exact
                figures are confirmed at disbursement)
              </p>
            </Card>
          )}
        </div>
      )}

      {step === 2 && product && (
        <GuarantorSelector
          selected={guarantors}
          onChange={setGuarantors}
          max={Number(product.requiredGuarantors)}
        />
      )}

      {step === 3 && product && (
        <div className="space-y-4">
          <Card className="rounded-xl border-border/50 p-5">
            <dl className="grid grid-cols-2 gap-y-3 text-sm">
              <dt className="text-muted-foreground">Product</dt>
              <dd className="text-right">{product.name}</dd>
              <dt className="text-muted-foreground">Amount</dt>
              <dd className="text-right">
                <CurrencyDisplay amount={Number(amount)} />
              </dd>
              <dt className="text-muted-foreground">Term</dt>
              <dd className="text-right">{term} months</dd>
              <dt className="text-muted-foreground">Est. monthly repayment</dt>
              <dd className="text-right">
                <CurrencyDisplay amount={estimate?.monthlyRepayment ?? 0} />
              </dd>
              <dt className="text-muted-foreground">Guarantors</dt>
              <dd className="text-right">
                {guarantors.map((g) => g.name).join(", ")}
              </dd>
            </dl>
          </Card>
          <p className="text-xs text-muted-foreground">
            Submitting sends guarantor requests to the members above. Once
            they all accept, your admin will review the application.
          </p>
        </div>
      )}

      <div className="mt-8 flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          disabled={step === 0 || submitting}
          onClick={() => setStep((s) => s - 1)}
        >
          <ArrowLeft className="size-4" />
          Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button
            type="button"
            disabled={!canAdvance()}
            onClick={() => setStep((s) => s + 1)}
          >
            Next
            <ArrowRight className="size-4" />
          </Button>
        ) : (
          <Button type="button" disabled={submitting} onClick={handleSubmit}>
            {submitting && <Loader2 className="size-4 animate-spin" />}
            Submit application
          </Button>
        )}
      </div>
    </div>
  );
}
