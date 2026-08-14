"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export function LegalDocumentEditor({
  label,
  documentKey,
}: {
  label: string;
  documentKey: "privacy_policy" | "terms_of_service";
}) {
  const doc = useQuery(api.legal.queries.getDocument, { key: documentKey });
  const setDocument = useMutation(api.legal.mutations.setDocument);
  const [content, setContent] = useState("");
  const [dirty, setDirty] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (doc && !dirty) setContent(doc.content);
  }, [doc, dirty]);

  async function handleSave() {
    setSubmitting(true);
    try {
      await setDocument({ key: documentKey, content });
      setDirty(false);
      toast.success(`${label} saved`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="rounded-2xl border-border/50 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">{label}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {doc?.updatedAt
              ? `Last updated ${formatDate(doc.updatedAt)}`
              : "Showing the default text — not yet customized"}
          </p>
        </div>
        <Button size="sm" onClick={handleSave} disabled={submitting || !dirty}>
          {submitting && <Loader2 className="size-4 animate-spin" />}
          Save
        </Button>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Use{" "}
        <code className="rounded bg-muted px-1 py-0.5 font-mono">## Heading</code>{" "}
        on its own line to start a new section; separate paragraphs with a
        blank line.
      </p>
      {doc === undefined ? (
        <Skeleton className="mt-3 h-64 w-full rounded-lg" />
      ) : (
        <Textarea
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            setDirty(true);
          }}
          disabled={submitting}
          rows={16}
          className="mt-3 font-mono text-xs leading-relaxed"
        />
      )}
    </Card>
  );
}
