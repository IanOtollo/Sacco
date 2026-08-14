"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ApproveApplicationDialog } from "@/components/members/approve-application-dialog";
import { RejectApplicationDialog } from "@/components/members/reject-application-dialog";
import { formatDate } from "@/lib/utils";
import { UserPlus } from "lucide-react";
import type { Doc } from "@/convex/_generated/dataModel";

export function ApplicationsPageClient() {
  const applications = useQuery(api.membershipApplications.queries.listPending);
  const [reviewing, setReviewing] = useState<Doc<"membershipApplications"> | null>(null);
  const [declining, setDeclining] = useState<Doc<"membershipApplications"> | null>(null);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          Membership applications
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review self-registered applicants before they can sign in.
        </p>
      </div>

      <div className="mt-6 space-y-3">
        {applications === undefined && (
          <>
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
          </>
        )}

        {applications?.length === 0 && (
          <Card className="rounded-2xl border-border/50 p-8 text-center">
            <UserPlus className="mx-auto size-8 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">
              No pending applications right now.
            </p>
          </Card>
        )}

        {applications?.map((application) => (
          <Card
            key={application._id}
            className="rounded-2xl border-border/50 p-6"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold">
                  {application.firstName} {application.lastName}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  National ID {application.nationalId} · Reg. No.{" "}
                  {application.registrationNumber}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Applied {formatDate(application._creationTime)}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setDeclining(application)}
                >
                  Decline
                </Button>
                <Button onClick={() => setReviewing(application)}>
                  Review &amp; approve
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {reviewing && (
        <ApproveApplicationDialog
          application={reviewing}
          open={!!reviewing}
          onOpenChange={(open) => !open && setReviewing(null)}
        />
      )}

      {declining && (
        <RejectApplicationDialog
          applicationId={declining._id}
          applicantName={`${declining.firstName} ${declining.lastName}`}
          open={!!declining}
          onOpenChange={(open) => !open && setDeclining(null)}
        />
      )}
    </div>
  );
}
