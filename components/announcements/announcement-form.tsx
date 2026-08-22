"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmModal } from "@/components/shared/confirm-modal";
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

const PRIORITY_LABEL: Record<string, string> = {
  normal: "Normal",
  important: "Important",
  urgent: "Urgent",
};

const AUDIENCE_LABEL: Record<string, string> = {
  all: "Everyone",
  members: "Members only",
  admins: "Admins only",
};

const schema = z.object({
  title: z.string().min(1, "Required"),
  content: z.string().min(1, "Required"),
  priority: z.enum(["normal", "important", "urgent"]),
  targetAudience: z.enum(["all", "members", "admins"]),
  expiresAt: z.string().optional(),
});
type Values = z.infer<typeof schema>;

export function AnnouncementForm({
  announcement,
  onSuccess,
}: {
  announcement?: Doc<"announcements">;
  onSuccess: () => void;
}) {
  const create = useMutation(api.announcements.mutations.create);
  const update = useMutation(api.announcements.mutations.update);
  const setPublished = useMutation(api.announcements.mutations.setPublished);
  const [submitting, setSubmitting] = useState(false);
  const [pendingValues, setPendingValues] = useState<Values | null>(null);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: announcement?.title ?? "",
      content: announcement?.content ?? "",
      priority: announcement?.priority ?? "normal",
      targetAudience: announcement?.targetAudience ?? "all",
      expiresAt: announcement?.expiresAt?.slice(0, 10) ?? "",
    },
  });

  async function onSubmit(values: Values) {
    // Editing just saves in place — no re-send. Creating always goes
    // through the publish confirmation below.
    if (announcement) {
      setSubmitting(true);
      try {
        const payload = { ...values, expiresAt: values.expiresAt || undefined };
        await update({
          announcementId: announcement._id as Id<"announcements">,
          ...payload,
        });
        toast.success("Announcement updated");
        onSuccess();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Could not save announcement"
        );
      } finally {
        setSubmitting(false);
      }
      return;
    }
    setPendingValues(values);
  }

  async function handleConfirmPublish() {
    if (!pendingValues) return;
    setSubmitting(true);
    try {
      const payload = { ...pendingValues, expiresAt: pendingValues.expiresAt || undefined };
      const id = await create(payload);
      try {
        await setPublished({ announcementId: id, isPublished: true });
        toast.success("Announcement published");
      } catch (error) {
        toast.error(
          error instanceof Error
            ? `Saved as a draft, but publishing failed: ${error.message}`
            : "Saved as a draft, but publishing failed — publish it from the list."
        );
      }
      onSuccess();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not save announcement"
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input disabled={submitting} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Content</FormLabel>
              <FormControl>
                <Textarea rows={5} disabled={submitting} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority</FormLabel>
                <Select value={field.value} onValueChange={field.onChange} disabled={submitting}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        {(value: string | null) => PRIORITY_LABEL[value ?? ""] ?? ""}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="important">Important</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="targetAudience"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Audience</FormLabel>
                <Select value={field.value} onValueChange={field.onChange} disabled={submitting}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        {(value: string | null) => AUDIENCE_LABEL[value ?? ""] ?? ""}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="all">Everyone</SelectItem>
                    <SelectItem value="members">Members only</SelectItem>
                    <SelectItem value="admins">Admins only</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="expiresAt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Expires (optional)</FormLabel>
              <FormControl>
                <Input type="date" disabled={submitting} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting && <Loader2 className="size-4 animate-spin" />}
          {announcement ? "Save changes" : "Publish"}
        </Button>
      </form>

      <ConfirmModal
        open={pendingValues !== null}
        onOpenChange={(open) => !open && setPendingValues(null)}
        title="Publish this announcement?"
        description={
          pendingValues
            ? `This immediately notifies every ${pendingValues.targetAudience === "all" ? "member and admin" : pendingValues.targetAudience === "members" ? "member" : "admin"}.`
            : ""
        }
        confirmLabel="Publish"
        onConfirm={handleConfirmPublish}
      />
    </Form>
  );
}
