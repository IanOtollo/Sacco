"use client";

import { useState } from "react";
import { MemberFolderGrid, type MemberSort } from "@/components/members/member-folder-grid";
import { SearchInput } from "@/components/shared/search-input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { downloadCsv } from "@/lib/csv";
import { Download } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
  { value: "dormant", label: "Dormant" },
  { value: "exited", label: "Exited" },
] as const;

type StatusFilter = (typeof STATUS_OPTIONS)[number]["value"];

const SORT_OPTIONS: { value: MemberSort; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "name", label: "Name (A–Z)" },
];

export function MembersPageClient() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<MemberSort>("newest");
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);

  function handleExport() {
    if (rows.length === 0) return;
    downloadCsv(
      "members.csv",
      [
        { key: "memberNumber", label: "Member No." },
        { key: "firstName", label: "First name" },
        { key: "lastName", label: "Last name" },
        { key: "nationalId", label: "National ID" },
        { key: "phoneNumber", label: "Phone" },
        { key: "status", label: "Status" },
        { key: "savingsBalance", label: "Savings" },
        { key: "sharesBalance", label: "Shares" },
        { key: "dateJoined", label: "Date joined" },
      ],
      rows
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            Members
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Members join via self-registration and admin approval — see
            Applications.
          </p>
        </div>
        <Button variant="outline" onClick={handleExport} disabled={rows.length === 0}>
          <Download className="size-4" />
          Export CSV
        </Button>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by name, member no., phone, or ID..."
          className="sm:max-w-sm"
        />
        <Select
          value={status}
          onValueChange={(v) => setStatus(v as StatusFilter)}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue>
              {(value: StatusFilter | null) =>
                STATUS_OPTIONS.find((opt) => opt.value === value)?.label ?? ""
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v) => setSort(v as MemberSort)}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue>
              {(value: MemberSort | null) =>
                SORT_OPTIONS.find((opt) => opt.value === value)?.label ?? ""
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-6">
        <MemberFolderGrid
          search={search}
          status={status === "all" ? undefined : status}
          sort={sort}
          onLoaded={setRows}
        />
      </div>
    </div>
  );
}
