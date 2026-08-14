"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/shared/status-badge";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { EmptyState } from "@/components/shared/empty-state";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Users, Check, X } from "lucide-react";

function PendingRequestCard({
  request,
}: {
  request: {
    _id: Id<"guarantors">;
    borrowerName: string;
    productName: string;
    loanAmount: number;
    amountGuaranteed: number;
  };
}) {
  const respond = useMutation(api.loans.mutations.respondToGuarantorRequest);
  const [declining, setDeclining] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handle(response: "accepted" | "declined") {
    setSubmitting(true);
    try {
      await respond({
        guarantorId: request._id,
        response,
        remarks: response === "declined" ? remarks || undefined : undefined,
      });
      toast.success(
        response === "accepted" ? "Guarantee accepted" : "Guarantee declined"
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not respond"
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="rounded-2xl border-border/50 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-medium">{request.borrowerName}</p>
          <p className="text-sm text-muted-foreground">{request.productName}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Loan amount</p>
          <p className="font-semibold">
            <CurrencyDisplay amount={request.loanAmount} />
          </p>
        </div>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        You&apos;re guaranteeing{" "}
        <CurrencyDisplay amount={request.amountGuaranteed} className="text-foreground" />
      </p>

      {declining && (
        <Textarea
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          placeholder="Reason (optional)"
          rows={2}
          className="mt-3"
        />
      )}

      <div className="mt-4 flex gap-2">
        {!declining ? (
          <>
            <Button
              size="sm"
              disabled={submitting}
              onClick={() => handle("accepted")}
            >
              <Check className="size-4" />
              Accept
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={submitting}
              onClick={() => setDeclining(true)}
            >
              <X className="size-4" />
              Decline
            </Button>
          </>
        ) : (
          <>
            <Button
              size="sm"
              variant="destructive"
              disabled={submitting}
              onClick={() => handle("declined")}
            >
              Confirm decline
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={submitting}
              onClick={() => setDeclining(false)}
            >
              Cancel
            </Button>
          </>
        )}
      </div>
    </Card>
  );
}

export function GuarantorsPageClient() {
  const pending = useQuery(api.loans.queries.getGuarantorRequests);
  const guarantees = useQuery(api.loans.queries.getMyGuarantees);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-heading text-2xl font-bold tracking-tight">
        Guarantor requests
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Review loans you&apos;ve been asked to guarantee.
      </p>

      <Tabs defaultValue="pending" className="mt-6">
        <TabsList>
          <TabsTrigger value="pending">Pending requests</TabsTrigger>
          <TabsTrigger value="mine">My guarantees</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4 space-y-3">
          {pending === undefined ? (
            Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-2xl" />
            ))
          ) : pending.filter((p) => p.status === "pending").length === 0 ? (
            <EmptyState
              icon={Users}
              title="No pending requests"
              description="You'll see guarantor requests here when a fellow member asks you to guarantee their loan."
            />
          ) : (
            pending
              .filter((p) => p.status === "pending")
              .map((request) => (
                <PendingRequestCard key={request._id} request={request} />
              ))
          )}
        </TabsContent>

        <TabsContent value="mine" className="mt-4 space-y-3">
          {guarantees === undefined ? (
            Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-2xl" />
            ))
          ) : guarantees.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No guarantees yet"
              description="Loans you've agreed to guarantee will show up here."
            />
          ) : (
            guarantees.map((g) => (
              <Card key={g._id} className="rounded-2xl border-border/50 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{g.borrowerName}</p>
                    <p className="text-sm text-muted-foreground">
                      <CurrencyDisplay amount={g.loanAmount} />
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <StatusBadge status={g.status} />
                    <StatusBadge status={g.loanStatus} />
                  </div>
                </div>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
