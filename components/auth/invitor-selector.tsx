"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { SearchInput } from "@/components/shared/search-input";
import { X } from "lucide-react";

export type InvitorCandidate = {
  _id: Id<"members">;
  memberNumber: string;
  name: string;
};

export function InvitorSelector({
  selected,
  onChange,
}: {
  selected: InvitorCandidate | null;
  onChange: (next: InvitorCandidate | null) => void;
}) {
  const [search, setSearch] = useState("");
  const candidates = useQuery(api.members.queries.searchForInvitor, { search });

  if (selected) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-sm">
        <div>
          <p className="font-medium">{selected.name}</p>
          <p className="font-mono text-xs text-muted-foreground">{selected.memberNumber}</p>
        </div>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Clear invitor"
        >
          <X className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Search by name or member number..."
      />
      {search.trim() && (
        <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-border p-2">
          {candidates === undefined ? (
            <p className="p-2 text-sm text-muted-foreground">Loading...</p>
          ) : candidates.length === 0 ? (
            <p className="p-2 text-sm text-muted-foreground">No members found.</p>
          ) : (
            candidates.map((c) => (
              <button
                type="button"
                key={c._id}
                onClick={() => {
                  onChange(c);
                  setSearch("");
                }}
                className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
              >
                <span>{c.name}</span>
                <span className="font-mono text-xs text-muted-foreground">
                  {c.memberNumber}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
