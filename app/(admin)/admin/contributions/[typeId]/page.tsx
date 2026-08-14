import type { Metadata } from "next";
import { ContributionTypeDetailClient } from "@/components/contributions/contribution-type-detail-client";

export const metadata: Metadata = { title: "Contribution folder" };

export default async function ContributionTypeDetailPage({
  params,
}: {
  params: Promise<{ typeId: string }>;
}) {
  const { typeId } = await params;
  return <ContributionTypeDetailClient typeId={typeId} />;
}
