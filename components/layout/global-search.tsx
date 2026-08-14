"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { type NavItem } from "@/lib/nav-config";
import { Search, Users } from "lucide-react";

export function GlobalSearch({
  sections,
  searchMembers = false,
  placeholder = "Search...",
}: {
  sections: NavItem[];
  searchMembers?: boolean;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const term = query.trim().toLowerCase();
  const matchedSections = term
    ? sections.filter((s) => s.label.toLowerCase().includes(term))
    : [];

  const memberResults = useQuery(
    api.members.queries.list,
    searchMembers && term ? { search: term } : "skip"
  );
  const matchedMembers = (memberResults ?? []).slice(0, 6);

  const hasResults = matchedSections.length > 0 || matchedMembers.length > 0;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function go(href: string) {
    router.push(href);
    setQuery("");
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-sm">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
          if (e.key === "Enter") {
            if (matchedSections[0]) go(matchedSections[0].href);
            else if (matchedMembers[0]) go(`/admin/members/${matchedMembers[0]._id}`);
          }
        }}
        placeholder={placeholder}
        className="h-9 pl-9"
      />

      {open && term && (
        <div className="absolute top-full left-0 z-50 mt-1.5 w-full overflow-hidden rounded-xl border border-border bg-popover shadow-md">
          {!hasResults ? (
            <div className="px-3 py-4 text-center text-sm text-muted-foreground">
              No matches for &ldquo;{query}&rdquo;
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto p-1.5">
              {matchedSections.length > 0 && (
                <div className="mb-1">
                  <p className="px-2 py-1 text-xs font-medium text-muted-foreground">
                    Sections
                  </p>
                  {matchedSections.map((s) => (
                    <button
                      key={s.href}
                      onClick={() => go(s.href)}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm hover:bg-muted"
                    >
                      <s.icon className="size-4 text-muted-foreground" />
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
              {searchMembers && matchedMembers.length > 0 && (
                <div>
                  <p className="px-2 py-1 text-xs font-medium text-muted-foreground">
                    Members
                  </p>
                  {matchedMembers.map((m) => (
                    <button
                      key={m._id}
                      onClick={() => go(`/admin/members/${m._id}`)}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm hover:bg-muted"
                    >
                      <Users className="size-4 text-muted-foreground" />
                      <span className="flex-1 truncate">
                        {m.firstName} {m.lastName}
                      </span>
                      <span
                        className={cn(
                          "font-mono text-xs text-muted-foreground"
                        )}
                      >
                        {m.memberNumber}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
