"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { markdownToSections } from "@/lib/legal-content";
import { formatDate } from "@/lib/utils";

export function LegalDocumentDialog({
  label,
  documentKey,
}: {
  label: string;
  documentKey: "privacy_policy" | "terms_of_service";
}) {
  const [open, setOpen] = useState(false);
  const doc = useQuery(
    api.legal.queries.getDocument,
    open ? { key: documentKey } : "skip"
  );

  const sections = doc ? markdownToSections(doc.content) : [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-left text-sm text-muted-foreground hover:text-foreground hover:underline"
      >
        {label}
      </button>
      <DialogContent className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden sm:max-w-2xl">
        <DialogHeader className="shrink-0">
          <DialogTitle className="font-heading text-xl">
            {doc?.title ?? label}
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            {doc?.updatedAt
              ? `Last updated ${formatDate(doc.updatedAt)}`
              : "Last updated today"}
          </p>
        </DialogHeader>
        <div className="-mx-4 flex-1 space-y-6 overflow-y-auto px-4">
          {doc === undefined ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : (
            sections.map((section) => (
              <div key={section.heading}>
                <h3 className="font-heading text-sm font-semibold text-foreground">
                  {section.heading}
                </h3>
                <div className="mt-2 space-y-2">
                  {section.body.map((paragraph, i) => (
                    <p key={i} className="text-sm leading-relaxed text-muted-foreground">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
