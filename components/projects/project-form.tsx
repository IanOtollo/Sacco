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

const schema = z.object({
  name: z.string().min(1, "Required"),
  category: z.string().optional(),
  status: z.enum(["planning", "active", "completed", "on_hold"]),
  startDate: z.string().optional(),
  investmentAmount: z
    .string()
    .optional()
    .refine((v) => !v || !isNaN(Number(v)), "Enter a valid amount"),
  description: z.string().optional(),
  notes: z.string().optional(),
});

type Values = z.infer<typeof schema>;

function toDefaults(project?: Doc<"projects">): Values {
  if (!project) {
    return {
      name: "",
      category: "",
      status: "planning",
      startDate: "",
      investmentAmount: "",
      description: "",
      notes: "",
    };
  }
  return {
    name: project.name,
    category: project.category ?? "",
    status: project.status,
    startDate: project.startDate ?? "",
    investmentAmount:
      project.investmentAmount !== undefined ? String(project.investmentAmount) : "",
    description: project.description ?? "",
    notes: project.notes ?? "",
  };
}

export function ProjectForm({
  project,
  onSuccess,
}: {
  project?: Doc<"projects">;
  onSuccess: () => void;
}) {
  const create = useMutation(api.projects.mutations.create);
  const update = useMutation(api.projects.mutations.update);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: toDefaults(project),
  });

  async function onSubmit(values: Values) {
    setSubmitting(true);
    try {
      const payload = {
        name: values.name,
        category: values.category || undefined,
        status: values.status,
        startDate: values.startDate || undefined,
        investmentAmount: values.investmentAmount
          ? Number(values.investmentAmount)
          : undefined,
        description: values.description || undefined,
        notes: values.notes || undefined,
      };

      if (project) {
        await update({ projectId: project._id as Id<"projects">, ...payload });
        toast.success("Project updated");
      } else {
        await create(payload);
        toast.success("Project added");
      }
      onSuccess();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not save project"
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
                <FormLabel>Project name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g. Chicken coop"
                    disabled={submitting}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category (optional)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g. Poultry, Agriculture"
                    disabled={submitting}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
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
                    <SelectItem value="planning">Planning</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="on_hold">On hold</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start date (optional)</FormLabel>
                <FormControl>
                  <Input type="date" disabled={submitting} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="investmentAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Investment (KES, optional)</FormLabel>
                <FormControl>
                  <Input type="number" disabled={submitting} {...field} />
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
              <FormLabel>Description (optional)</FormLabel>
              <FormControl>
                <Textarea rows={2} disabled={submitting} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (optional)</FormLabel>
              <FormControl>
                <Textarea
                  rows={3}
                  placeholder="Progress updates, records, anything worth keeping track of..."
                  disabled={submitting}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting && <Loader2 className="size-4 animate-spin" />}
          {project ? "Save changes" : "Add project"}
        </Button>
      </form>
    </Form>
  );
}
