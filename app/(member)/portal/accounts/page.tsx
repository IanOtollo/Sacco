import type { Metadata } from "next";
import { AccountsPageClient } from "@/components/accounts/accounts-page-client";

export const metadata: Metadata = { title: "My accounts" };

export default function AccountsPage() {
  return <AccountsPageClient />;
}
