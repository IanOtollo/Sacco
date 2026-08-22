"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { normalizeKenyanPhone } from "@/lib/phone";
import { resolveEmergencyLoanRate, resolveDevelopmentLoanRate } from "@/lib/loan-calc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { UserRoundX } from "lucide-react";

const CATEGORY_LABEL: Record<string, string> = {
  emergency: "Emergency loan (up to 4 weeks, lump sum)",
  development: "Development loan (monthly installments)",
};

const schema = z
  .object({
    firstName: z.string().min(1, "Required"),
    lastName: z.string().min(1, "Required"),
    phoneNumber: z
      .string()
      .min(1, "Required")
      .refine(
        (v) => {
          try {
            normalizeKenyanPhone(v);
            return true;
          } catch {
            return false;
          }
        },
        { message: "Enter a valid Kenyan phone number" }
      ),
    nationalId: z.string().min(1, "Required"),
    principalAmount: z
      .string()
      .min(1, "Required")
      .refine((v) => Number(v) > 0, "Enter an amount greater than zero"),
    category: z.enum(["emergency", "development"]),
    termDays: z.string().optional(),
    termMonths: z.string().optional(),
    purpose: z.string().min(1, "Required"),
    collateralDescription: z.string().min(1, "Required for non-member loans"),
    collateralValue: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.category === "emergency") {
      const n = Number(data.termDays);
      if (!data.termDays || !Number.isInteger(n) || n < 1 || n > 28) {
        ctx.addIssue({
          code: "custom",
          path: ["termDays"],
          message: "Enter a whole number of days between 1 and 28",
        });
      }
    } else {
      const n = Number(data.termMonths);
      if (!data.termMonths || !Number.isInteger(n) || n < 1 || n > 60) {
        ctx.addIssue({
          code: "custom",
          path: ["termMonths"],
          message: "Enter a whole number of months between 1 and 60",
        });
      }
    }
  });

type Values = z.infer<typeof schema>;

export function IssueNonMemberLoanDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<Values | null>(null);
  const issueLoan = useMutation(api.loans.mutations.issueNonMemberLoan);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phoneNumber: "",
      nationalId: "",
      principalAmount: "",
      category: "emergency",
      termDays: "",
      termMonths: "",
      purpose: "",
      collateralDescription: "",
      collateralValue: "",
    },
  });

  const category = useWatch({ control: form.control, name: "category" });
  const watchedAmount = useWatch({ control: form.control, name: "principalAmount" });
  const watchedTermDays = useWatch({ control: form.control, name: "termDays" });
  const watchedTermMonths = useWatch({ control: form.control, name: "termMonths" });
  const previewAmount = Number(watchedAmount);

  let previewRate: number | null = null;
  let previewTermLabel = "";
  if (previewAmount > 0) {
    try {
      if (category === "emergency") {
        const days = Number(watchedTermDays);
        if (Number.isInteger(days) && days >= 1) {
          previewRate = resolveEmergencyLoanRate(days);
          previewTermLabel = `${days} day${days === 1 ? "" : "s"}`;
        }
      } else {
        const months = Number(watchedTermMonths);
        if (Number.isInteger(months) && months >= 1) {
          previewRate = resolveDevelopmentLoanRate(months);
          previewTermLabel = `${months} month${months === 1 ? "" : "s"}`;
        }
      }
    } catch {
      previewRate = null;
    }
  }
  const previewInterest =
    previewRate != null ? Math.round(previewAmount * (previewRate / 100) * 100) / 100 : null;
  const previewTotal = previewInterest != null ? previewAmount + previewInterest : null;
  const previewMonthly =
    category === "development" && previewTotal != null && Number(watchedTermMonths) > 0
      ? Math.round((previewTotal / Number(watchedTermMonths)) * 100) / 100
      : null;

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setPending(null);
      form.reset();
    }
  }

  async function handleConfirm() {
    if (!pending) return;
    try {
      const result = await issueLoan({
        firstName: pending.firstName,
        lastName: pending.lastName,
        phoneNumber: pending.phoneNumber,
        nationalId: pending.nationalId,
        principalAmount: Number(pending.principalAmount),
        category: pending.category,
        termDays: pending.category === "emergency" ? Number(pending.termDays) : undefined,
        termMonths: pending.category === "development" ? Number(pending.termMonths) : undefined,
        purpose: pending.purpose,
        collateralDescription: pending.collateralDescription,
        collateralValue: Number(pending.collateralValue || 0),
      });
      toast.success(`Loan ${result.loanNumber} issued — pending approval`);
      handleOpenChange(false);
      router.push(`/admin/loans/${result.loanId}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not issue loan"
      );
      setPending(null);
    }
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <UserRoundX className="size-4" />
        Issue non-member loan
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-h-[90vh] w-full max-w-2xl overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Issue a loan to a non-member</DialogTitle>
            <DialogDescription>
              For borrowers who aren&apos;t Sacco members — identified by
              name, phone, and National ID. Collateral replaces guarantors.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((values) => setPending(values))}
              className="space-y-4"
            >
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Borrower identity
                </h3>
                <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone number</FormLabel>
                        <FormControl>
                          <Input type="tel" placeholder="0712345678" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="nationalId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>National ID</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-foreground">Loan details</h3>
                <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel>Loan type</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue>
                                {(value: string | null) =>
                                  value ? CATEGORY_LABEL[value] : ""
                                }
                              </SelectValue>
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="emergency">
                              {CATEGORY_LABEL.emergency}
                            </SelectItem>
                            <SelectItem value="development">
                              {CATEGORY_LABEL.development}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="principalAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount (KES)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {category === "emergency" ? (
                    <FormField
                      control={form.control}
                      name="termDays"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Term (days, max 28)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="e.g. 7" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ) : (
                    <FormField
                      control={form.control}
                      name="termMonths"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Term (months)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="e.g. 3" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  {previewRate != null && (
                    <div className="sm:col-span-2 rounded-lg border border-border/60 bg-muted/40 px-3 py-2 text-sm">
                      Rate for {previewTermLabel}:{" "}
                      <span className="font-semibold text-foreground">{previewRate}%</span> flat
                      — interest of{" "}
                      <span className="font-semibold text-foreground">
                        KES {previewInterest?.toLocaleString()}
                      </span>
                      {category === "emergency" ? (
                        <>
                          , repayable KES {previewTotal?.toLocaleString()} in full at the end
                          of the term.
                        </>
                      ) : (
                        <>
                          , repayable KES {previewTotal?.toLocaleString()} in{" "}
                          {watchedTermMonths} equal monthly installments of KES{" "}
                          {previewMonthly?.toLocaleString()}.
                        </>
                      )}
                    </div>
                  )}
                  <FormField
                    control={form.control}
                    name="purpose"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel>Purpose</FormLabel>
                        <FormControl>
                          <Textarea rows={2} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-foreground">Collateral</h3>
                <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="collateralDescription"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            rows={2}
                            placeholder="e.g. Motor vehicle logbook KAB 123X, title deed, electronics..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="collateralValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estimated value (KES, optional)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg">
                Review and issue loan
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <ConfirmModal
        open={pending !== null}
        onOpenChange={(next) => !next && setPending(null)}
        title="Issue this loan?"
        description={
          pending
            ? `KES ${Number(pending.principalAmount).toLocaleString()} to ${pending.firstName} ${pending.lastName} (non-member, ${CATEGORY_LABEL[pending.category]}) for ${pending.category === "emergency" ? `${pending.termDays} days` : `${pending.termMonths} months`}, secured by: ${pending.collateralDescription}. This creates the loan pending approval.`
            : ""
        }
        confirmLabel="Issue loan"
        onConfirm={handleConfirm}
      />
    </>
  );
}
