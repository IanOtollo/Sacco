"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Id, Doc } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2 } from "lucide-react";

const numeric = (message: string) =>
  z.string().min(1, "Required").refine((v) => !isNaN(Number(v)) && Number(v) >= 0, message);

const schema = z.object({
  name: z.string().min(1, "Required"),
  code: z
    .string()
    .min(1, "Required")
    .max(10)
    .transform((v) => v.toUpperCase()),
  description: z.string().min(1, "Required"),
  interestRate: numeric("Enter a valid rate"),
  interestMethod: z.enum(["reducing_balance", "flat_rate"]),
  minimumAmount: numeric("Enter a valid amount"),
  maximumAmount: numeric("Enter a valid amount"),
  minimumTermMonths: numeric("Enter a valid term"),
  maximumTermMonths: numeric("Enter a valid term"),
  requiredGuarantors: numeric("Enter a valid number"),
  maxLoanToSavingsRatio: numeric("Enter a valid ratio"),
  processingFeePercent: numeric("Enter a valid percentage"),
  insuranceFeePercent: z.string().optional(),
  gracePeriodDays: numeric("Enter a valid number of days"),
  penaltyRatePercent: numeric("Enter a valid percentage"),
});

type Values = z.infer<typeof schema>;

function toDefaults(product?: Doc<"loanProducts">): Values {
  if (!product) {
    return {
      name: "",
      code: "",
      description: "",
      interestRate: "",
      interestMethod: "reducing_balance",
      minimumAmount: "",
      maximumAmount: "",
      minimumTermMonths: "",
      maximumTermMonths: "",
      requiredGuarantors: "",
      maxLoanToSavingsRatio: "3",
      processingFeePercent: "1",
      insuranceFeePercent: "0.5",
      gracePeriodDays: "30",
      penaltyRatePercent: "5",
    };
  }
  return {
    name: product.name,
    code: product.code,
    description: product.description,
    interestRate: String(product.interestRate),
    interestMethod: product.interestMethod,
    minimumAmount: String(product.minimumAmount),
    maximumAmount: String(product.maximumAmount),
    minimumTermMonths: String(product.minimumTermMonths),
    maximumTermMonths: String(product.maximumTermMonths),
    requiredGuarantors: String(product.requiredGuarantors),
    maxLoanToSavingsRatio: String(product.maxLoanToSavingsRatio),
    processingFeePercent: String(product.processingFeePercent),
    insuranceFeePercent: String(product.insuranceFeePercent ?? 0),
    gracePeriodDays: String(product.gracePeriodDays),
    penaltyRatePercent: String(product.penaltyRatePercent),
  };
}

export function LoanProductForm({
  product,
  onSuccess,
}: {
  product?: Doc<"loanProducts">;
  onSuccess: () => void;
}) {
  const create = useMutation(api.loanProducts.mutations.create);
  const update = useMutation(api.loanProducts.mutations.update);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: toDefaults(product),
  });

  async function onSubmit(values: Values) {
    setSubmitting(true);
    try {
      const payload = {
        name: values.name,
        code: values.code,
        description: values.description,
        interestRate: Number(values.interestRate),
        interestMethod: values.interestMethod,
        minimumAmount: Number(values.minimumAmount),
        maximumAmount: Number(values.maximumAmount),
        minimumTermMonths: Number(values.minimumTermMonths),
        maximumTermMonths: Number(values.maximumTermMonths),
        requiredGuarantors: Number(values.requiredGuarantors),
        maxLoanToSavingsRatio: Number(values.maxLoanToSavingsRatio),
        processingFeePercent: Number(values.processingFeePercent),
        insuranceFeePercent: values.insuranceFeePercent
          ? Number(values.insuranceFeePercent)
          : undefined,
        gracePeriodDays: Number(values.gracePeriodDays),
        penaltyRatePercent: Number(values.penaltyRatePercent),
      };

      if (product) {
        await update({ productId: product._id as Id<"loanProducts">, ...payload });
        toast.success("Loan product updated");
      } else {
        await create(payload);
        toast.success("Loan product created");
      }
      onSuccess();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not save loan product"
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product name</FormLabel>
                <FormControl>
                  <Input disabled={submitting} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Code</FormLabel>
                <FormControl>
                  <Input
                    disabled={submitting || !!product}
                    placeholder="NRM"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea rows={2} disabled={submitting} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FormField
            control={form.control}
            name="interestRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Interest rate (% p.a.)</FormLabel>
                <FormControl>
                  <Input disabled={submitting} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="interestMethod"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Interest method</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={submitting}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="reducing_balance">Reducing balance</SelectItem>
                    <SelectItem value="flat_rate">Flat rate</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="requiredGuarantors"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Required guarantors</FormLabel>
                <FormControl>
                  <Input disabled={submitting} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="minimumAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Minimum amount (KES)</FormLabel>
                <FormControl>
                  <Input disabled={submitting} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="maximumAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Maximum amount (KES)</FormLabel>
                <FormControl>
                  <Input disabled={submitting} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="minimumTermMonths"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Minimum term (months)</FormLabel>
                <FormControl>
                  <Input disabled={submitting} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="maximumTermMonths"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Maximum term (months)</FormLabel>
                <FormControl>
                  <Input disabled={submitting} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="maxLoanToSavingsRatio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Max loan-to-savings ratio</FormLabel>
                <FormControl>
                  <Input disabled={submitting} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="processingFeePercent"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Processing fee (%)</FormLabel>
                <FormControl>
                  <Input disabled={submitting} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="insuranceFeePercent"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Insurance fee (%, optional)</FormLabel>
                <FormControl>
                  <Input disabled={submitting} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="gracePeriodDays"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Grace period (days)</FormLabel>
                <FormControl>
                  <Input disabled={submitting} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="penaltyRatePercent"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Late penalty rate (%)</FormLabel>
                <FormControl>
                  <Input disabled={submitting} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting && <Loader2 className="size-4 animate-spin" />}
          {product ? "Save changes" : "Create loan product"}
        </Button>
      </form>
    </Form>
  );
}
