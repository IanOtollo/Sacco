"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/shared/status-badge";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { TransactionModal } from "@/components/accounts/transaction-modal";
import { TransactionTable } from "@/components/accounts/transaction-table";
import { MemberContributionsTab } from "@/components/contributions/member-contributions-tab";
import { CommitteeRoleSelect } from "@/components/members/committee-role-select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import {
  MoreHorizontal,
  UserX,
  UserCheck,
  Wallet,
  HandCoins,
  Banknote,
  FileText,
  ArrowDownToLine,
  ArrowUpFromLine,
} from "lucide-react";

function initials(first: string, last: string) {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
}

export function MemberDetailClient({ memberId }: { memberId: string }) {
  const member = useQuery(api.members.queries.getById, {
    memberId: memberId as Id<"members">,
  });
  const updateStatus = useMutation(api.members.mutations.updateStatus);
  const [confirmAction, setConfirmAction] = useState<
    "suspend" | "activate" | null
  >(null);
  const [txnModal, setTxnModal] = useState<{
    mode: "deposit" | "withdraw";
    accountType: "savings" | "shares";
  } | null>(null);

  if (member === undefined) {
    return (
      <div className="mx-auto max-w-7xl space-y-4 px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (member === null) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <EmptyState
          icon={UserX}
          title="Member not found"
          description="This member may have been removed."
        />
      </div>
    );
  }

  const savings = member.accounts.find((a) => a.type === "savings");
  const shares = member.accounts.find((a) => a.type === "shares");

  async function handleStatusChange() {
    if (!confirmAction || !member) return;
    try {
      await updateStatus({
        memberId: member._id,
        status: confirmAction === "suspend" ? "suspended" : "active",
      });
      toast.success(
        confirmAction === "suspend"
          ? "Member suspended"
          : "Member reactivated"
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not update member"
      );
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Card className="flex flex-col gap-4 rounded-2xl border-border/50 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="size-14">
            <AvatarFallback className="bg-primary text-lg text-primary-foreground">
              {initials(member.firstName, member.lastName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-xl font-bold tracking-tight">
                {member.firstName} {member.lastName}
              </h1>
              <StatusBadge status={member.status} />
            </div>
            <p className="mt-0.5 font-mono text-sm text-muted-foreground">
              {member.memberNumber} · {member.phoneNumber}
            </p>
            <div className="mt-2">
              <CommitteeRoleSelect memberId={member._id} currentRole={member.committeeRole} />
            </div>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="outline">
                <MoreHorizontal className="size-4" />
                Actions
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            {member.status === "active" ? (
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setConfirmAction("suspend")}
              >
                <UserX className="size-4" />
                Suspend member
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => setConfirmAction("activate")}>
                <UserCheck className="size-4" />
                Activate member
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </Card>

      <Tabs defaultValue="overview" className="mt-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
          <TabsTrigger value="loans">Loans</TabsTrigger>
          <TabsTrigger value="contributions">Contributions</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="rounded-2xl border-border/50 p-6">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Wallet className="size-4" />
                <span className="text-sm">Savings balance</span>
              </div>
              <div className="mt-2 text-2xl font-bold">
                <CurrencyDisplay amount={savings?.balance ?? 0} />
              </div>
            </Card>
            <Card className="rounded-2xl border-border/50 p-6">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Banknote className="size-4" />
                <span className="text-sm">Shares balance</span>
              </div>
              <div className="mt-2 text-2xl font-bold">
                <CurrencyDisplay amount={shares?.balance ?? 0} />
              </div>
            </Card>
          </div>

          <Card className="rounded-2xl border-border/50 p-6">
            <h3 className="text-sm font-semibold">Personal details</h3>
            <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              <Detail label="National ID" value={member.nationalId} />
              <Detail
                label="Gender"
                value={
                  member.gender.charAt(0).toUpperCase() +
                  member.gender.slice(1)
                }
              />
              <Detail
                label="Date of birth"
                value={member.dateOfBirth ? formatDate(member.dateOfBirth) : "—"}
              />
              <Detail label="Email" value={member.email ?? "—"} />
              <Detail label="Occupation" value={member.occupation ?? "—"} />
              <Detail label="Employer" value={member.employer ?? "—"} />
              <Detail
                label="Postal address"
                value={member.postalAddress ?? "—"}
              />
              <Detail
                label="Residential address"
                value={member.residentialAddress ?? "—"}
              />
              <Detail
                label="Date joined"
                value={formatDate(member.dateJoined)}
              />
            </dl>
          </Card>

          <Card className="rounded-2xl border-border/50 p-6">
            <h3 className="text-sm font-semibold">Next of kin</h3>
            <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
              <Detail label="Name" value={member.nextOfKinName} />
              <Detail label="Phone" value={member.nextOfKinPhone} />
              <Detail
                label="Relationship"
                value={member.nextOfKinRelationship}
              />
            </dl>
          </Card>
        </TabsContent>

        <TabsContent value="accounts" className="mt-4 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="rounded-2xl border-border/50 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Savings account
                  </p>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    {savings?.accountNumber}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setTxnModal({ mode: "deposit", accountType: "savings" })
                    }
                  >
                    <ArrowDownToLine className="size-3.5" />
                    Deposit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setTxnModal({ mode: "withdraw", accountType: "savings" })
                    }
                  >
                    <ArrowUpFromLine className="size-3.5" />
                    Withdraw
                  </Button>
                </div>
              </div>
              <div className="mt-2 text-2xl font-bold">
                <CurrencyDisplay amount={savings?.balance ?? 0} />
              </div>
            </Card>
            <Card className="rounded-2xl border-border/50 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Shares account
                  </p>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    {shares?.accountNumber}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setTxnModal({ mode: "deposit", accountType: "shares" })
                    }
                  >
                    <ArrowDownToLine className="size-3.5" />
                    Deposit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setTxnModal({ mode: "withdraw", accountType: "shares" })
                    }
                  >
                    <ArrowUpFromLine className="size-3.5" />
                    Withdraw
                  </Button>
                </div>
              </div>
              <div className="mt-2 text-2xl font-bold">
                <CurrencyDisplay amount={shares?.balance ?? 0} />
              </div>
            </Card>
          </div>

          {savings && (
            <div>
              <h3 className="mb-2 text-sm font-semibold">
                Savings statement
              </h3>
              <TransactionTable accountId={savings._id} />
            </div>
          )}
          {shares && (
            <div>
              <h3 className="mb-2 text-sm font-semibold">Shares statement</h3>
              <TransactionTable accountId={shares._id} />
            </div>
          )}
        </TabsContent>

        <TabsContent value="loans" className="mt-4">
          <EmptyState
            icon={HandCoins}
            title="No loans yet"
            description="This member's loan applications and history will show up here once the loan engine ships."
          />
        </TabsContent>

        <TabsContent value="contributions" className="mt-4">
          <MemberContributionsTab memberId={member._id} />
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <EmptyState
            icon={FileText}
            title="No documents uploaded"
            description="KYC document uploads are planned for a future release."
          />
        </TabsContent>
      </Tabs>

      <ConfirmModal
        open={confirmAction !== null}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title={
          confirmAction === "suspend" ? "Suspend member?" : "Activate member?"
        }
        description={
          confirmAction === "suspend"
            ? "This member will no longer be able to log in or transact until reactivated."
            : "This member will regain access to their account."
        }
        confirmLabel={confirmAction === "suspend" ? "Suspend" : "Activate"}
        destructive={confirmAction === "suspend"}
        onConfirm={handleStatusChange}
      />

      {txnModal && (
        <TransactionModal
          open={txnModal !== null}
          onOpenChange={(open) => !open && setTxnModal(null)}
          mode={txnModal.mode}
          memberId={member._id}
          accountType={txnModal.accountType}
        />
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5">{value}</dd>
    </div>
  );
}
