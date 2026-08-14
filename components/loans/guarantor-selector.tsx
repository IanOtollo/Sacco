"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { SearchInput } from "@/components/shared/search-input";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

export type GuarantorCandidate = {
  _id: Id<"members">;
  memberNumber: string;
  name: string;
};

export function GuarantorSelector({
  selected,
  onChange,
  max,
}: {
  selected: GuarantorCandidate[];
  onChange: (next: GuarantorCandidate[]) => void;
  max: number;
}) {
  const [search, setSearch] = useState("");
  const candidates = useQuery(api.members.queries.searchGuarantorCandidates, {
    search,
  });

  function toggle(candidate: GuarantorCandidate) {
    const already = selected.some((s) => s._id === candidate._id);
    if (already) {
      onChange(selected.filter((s) => s._id !== candidate._id));
    } else if (selected.length < max) {
      onChange([...selected, candidate]);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {selected.map((s) => (
          <Badge key={s._id} variant="secondary" className="gap-1.5 py-1.5">
            {s.name}
            <button
              type="button"
              onClick={() => toggle(s)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="size-3" />
            </button>
          </Badge>
        ))}
        {selected.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No guarantors selected yet — pick {max} below.
          </p>
        )}
      </div>

      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Search members by name or number..."
      />

      <div className="max-h-64 space-y-1 overflow-y-auto rounded-lg border border-border p-2">
        {candidates === undefined ? (
          <p className="p-2 text-sm text-muted-foreground">Loading...</p>
        ) : candidates.length === 0 ? (
          <p className="p-2 text-sm text-muted-foreground">No members found.</p>
        ) : (
          candidates.map((c) => {
            const isSelected = selected.some((s) => s._id === c._id);
            const disabled = !isSelected && selected.length >= max;
            return (
              <button
                type="button"
                key={c._id}
                disabled={disabled}
                onClick={() => toggle(c)}
                className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors ${
                  isSelected
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                }`}
              >
                <span>{c.name}</span>
                <span className="font-mono text-xs text-muted-foreground">
                  {c.memberNumber}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
