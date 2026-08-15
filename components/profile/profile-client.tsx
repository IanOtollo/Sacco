"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EditProfileForm } from "@/components/profile/edit-profile-form";
import { ChangePasswordForm } from "@/components/profile/change-password-form";
import { formatDate } from "@/lib/utils";

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm">{value}</dd>
    </div>
  );
}

export function ProfileClient() {
  const member = useQuery(api.members.queries.getMyMember);

  if (member === undefined) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  if (member === null) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-sm text-muted-foreground">
          No member profile is linked to your account. Contact your admin.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          My profile
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {member.memberNumber}
        </p>
      </div>

      <Card className="rounded-2xl border-border/50 p-6">
        <h2 className="text-sm font-semibold">Personal details</h2>
        <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
          <Detail label="Full name" value={`${member.firstName} ${member.lastName}`} />
          <Detail label="National ID" value={member.nationalId} />
          <Detail label="Phone number" value={member.phoneNumber} />
          <Detail label="Email" value={member.email ?? "—"} />
          <Detail label="Date joined" value={formatDate(member.dateJoined)} />
        </dl>
        <p className="mt-4 text-xs text-muted-foreground">
          To update your name, ID, or phone number, contact your Sacco
          administrator.
        </p>
      </Card>

      <Card className="rounded-2xl border-border/50 p-6">
        <h2 className="text-sm font-semibold">More about you</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Fill these in yourself — your admin only sets your name, ID, and
          phone number.
        </p>
        <div className="mt-4">
          <EditProfileForm
            memberId={member._id}
            defaults={{
              email: member.email ?? "",
              dateOfBirth: member.dateOfBirth ?? "",
              occupation: member.occupation ?? "",
              employer: member.employer ?? "",
              postalAddress: member.postalAddress ?? "",
              residentialAddress: member.residentialAddress ?? "",
              nextOfKinName: member.nextOfKinName ?? "",
              nextOfKinPhone: member.nextOfKinPhone ?? "",
              nextOfKinRelationship: member.nextOfKinRelationship ?? "",
            }}
          />
        </div>
      </Card>

      <Card className="rounded-2xl border-border/50 p-6">
        <h2 className="text-sm font-semibold">Change password</h2>
        <div className="mt-4">
          <ChangePasswordForm />
        </div>
      </Card>
    </div>
  );
}
