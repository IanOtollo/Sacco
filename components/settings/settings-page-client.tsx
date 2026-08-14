"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

type FormValues = Record<string, string>;

// react-hook-form parses dots in field names as nested paths, so settings
// keys (which use dots, e.g. "sacco.name") are mapped to safe flat form
// field names here and back to real keys on submit.
function toFieldName(key: string) {
  return key.replace(/\./g, "__");
}
function toSettingsKey(fieldName: string) {
  return fieldName.replace(/__/g, ".");
}

const SECTIONS: { title: string; fields: { key: string; label: string; type?: string }[] }[] = [
  {
    title: "Sacco details",
    fields: [
      { key: "sacco.name", label: "Sacco name" },
      { key: "sacco.registrationNumber", label: "Registration number" },
      { key: "sacco.address", label: "Address" },
      { key: "sacco.phone", label: "Phone" },
      { key: "sacco.email", label: "Email", type: "email" },
    ],
  },
  {
    title: "Financial settings",
    fields: [
      { key: "financial.minMonthlySavings", label: "Min. monthly savings (KES)", type: "number" },
      { key: "financial.minMonthlyShares", label: "Min. monthly shares (KES)", type: "number" },
      { key: "financial.registrationFee", label: "Registration fee (KES)", type: "number" },
      { key: "financial.fyStartMonth", label: "Financial year start month (1-12)", type: "number" },
    ],
  },
  {
    title: "Loan settings",
    fields: [
      { key: "loan.defaultGracePeriodDays", label: "Default grace period (days)", type: "number" },
      { key: "loan.maxActiveLoansPerMember", label: "Max active loans per member", type: "number" },
      { key: "loan.latePenaltyGraceDays", label: "Late penalty grace (days)", type: "number" },
    ],
  },
];

export function SettingsPageClient() {
  const settings = useQuery(api.settings.queries.getAll);
  const setMany = useMutation(api.settings.mutations.setMany);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset } = useForm<FormValues>();

  useEffect(() => {
    if (!settings) return;
    const defaults: FormValues = {};
    for (const s of settings) defaults[toFieldName(s.key)] = s.value;
    reset(defaults);
  }, [settings, reset]);

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      await setMany({
        entries: Object.entries(values).map(([fieldName, value]) => ({
          key: toSettingsKey(fieldName),
          value,
        })),
      });
      toast.success("Settings saved");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not save settings"
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (settings === undefined) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-8 sm:px-6 lg:px-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-48 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-heading text-2xl font-bold tracking-tight">
        Settings
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        System-wide configuration. Only super admins can make changes.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">
        {SECTIONS.map((section) => (
          <Card key={section.title} className="rounded-2xl border-border/50 p-6">
            <h2 className="text-sm font-semibold">{section.title}</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {section.fields.map((field) => (
                <div key={field.key}>
                  <label className="text-sm font-medium">{field.label}</label>
                  <Input
                    type={field.type ?? "text"}
                    disabled={submitting}
                    className="mt-1.5"
                    {...register(toFieldName(field.key))}
                  />
                </div>
              ))}
            </div>
          </Card>
        ))}

        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="size-4 animate-spin" />}
          Save settings
        </Button>
      </form>
    </div>
  );
}
