import type { Metadata } from "next";
import { MemberDetailClient } from "@/components/members/member-detail-client";

export const metadata: Metadata = { title: "Member details" };

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <MemberDetailClient memberId={id} />;
}
