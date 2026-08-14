import Link from "next/link";
import { redirect } from "next/navigation";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { getCurrentUserServer } from "@/lib/auth-server";
import { portalHomeForRole } from "@/lib/constants";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { HeroStats } from "@/components/landing/hero-stats";
import { LoginForm } from "@/components/auth/login-form";
import { MobileScrollIndicator } from "@/components/landing/mobile-scroll-indicator";
import { LegalDocumentDialog } from "@/components/landing/legal-document-dialog";
import {
  Landmark,
  PiggyBank,
  HandCoins,
  Users,
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";

export default async function LandingPage() {
  const user = await getCurrentUserServer();
  if (user) {
    redirect(portalHomeForRole(user.role));
  }

  const [stats, saccoInfo] = await Promise.all([
    fetchQuery(api.reports.queries.getLandingStats, {}),
    fetchQuery(api.settings.queries.getPublicSaccoInfo, {}),
  ]);

  return (
    <div className="flex flex-col lg:h-screen lg:flex-row lg:overflow-hidden">
      {/* Auth — first in the DOM so mobile shows it up top; pinned to the
          right and held in place (its own column never scrolls) on desktop. */}
      <div className="order-1 flex items-center justify-center border-b border-border px-4 py-12 sm:px-6 lg:order-2 lg:h-screen lg:w-[440px] lg:shrink-0 lg:border-b-0 lg:border-l lg:px-8 lg:py-0">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center gap-3">
            <Link
              href="/"
              className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground"
            >
              <Landmark className="size-6" />
            </Link>
            <span className="font-heading text-lg font-bold tracking-tight">
              {saccoInfo.name}
            </span>
          </div>
          <Card className="rounded-2xl border-border/50 shadow-sm">
            <CardHeader>
              <h1 className="font-heading text-xl font-semibold tracking-tight">
                Sign in to your account
              </h1>
              <p className="text-sm text-muted-foreground">
                Enter your member credentials to continue.
              </p>
            </CardHeader>
            <CardContent>
              <LoginForm />
            </CardContent>
          </Card>
          <a
            href="#about"
            className="mt-6 block text-center text-sm text-muted-foreground hover:text-foreground lg:hidden"
          >
            Learn more about us ↓
          </a>
        </div>
      </div>

      {/* Content — second in the DOM (below auth on mobile); left column on
          desktop, scrolling independently within its own pane. */}
      <div className="order-2 lg:order-1 lg:h-screen lg:flex-1 lg:overflow-y-auto">
        <section className="bg-primary/[0.04] py-20 px-4 sm:px-6 lg:px-12">
          <div className="mx-auto max-w-2xl">
            <h1 className="font-heading text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Save together. Borrow smart. Grow as one.
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              {saccoInfo.name} helps members build savings, access affordable
              credit, and share in the cooperative&apos;s success — all
              managed transparently in one place.
            </p>

            <HeroStats stats={stats} />
          </div>
        </section>

        <section id="about" className="bg-secondary/[0.035] py-20 px-4 sm:px-6 lg:px-12">
          <div className="mx-auto max-w-2xl">
            <h2 className="font-heading text-3xl font-bold tracking-tight">
              About the Sacco
            </h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              We are a member-owned savings and credit cooperative. Every
              shilling saved strengthens the pool members can borrow against,
              and every loan repaid keeps the cooperative growing for
              everyone.
            </p>

            <div className="mt-12 grid gap-6 sm:grid-cols-1 lg:grid-cols-1 xl:grid-cols-3">
              <Card className="rounded-2xl border-border/50 p-8 hover:shadow-lg transition-shadow">
                <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <PiggyBank className="size-6" />
                </div>
                <h3 className="mt-4 font-heading text-lg font-semibold">
                  Save Together
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Build your savings and share capital steadily every month,
                  with full visibility into your balances at all times.
                </p>
              </Card>
              <Card className="rounded-2xl border-border/50 p-8 hover:shadow-lg transition-shadow">
                <div className="flex size-12 items-center justify-center rounded-xl bg-accent/20 text-accent-foreground">
                  <HandCoins className="size-6" />
                </div>
                <h3 className="mt-4 font-heading text-lg font-semibold">
                  Borrow Smart
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Apply for a loan, get guarantors, and track your repayment
                  schedule from your member portal — no paperwork required.
                </p>
              </Card>
              <Card className="rounded-2xl border-border/50 p-8 hover:shadow-lg transition-shadow">
                <div className="flex size-12 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
                  <Users className="size-6" />
                </div>
                <h3 className="mt-4 font-heading text-lg font-semibold">
                  Grow as One
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Annual dividends are paid out on your shares, so the
                  cooperative&apos;s growth comes back to every member.
                </p>
              </Card>
            </div>

            <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
              <ShieldCheck className="size-4 text-success" />
              Every transaction is recorded and auditable.
            </div>
          </div>
        </section>

        <footer className="border-t border-border py-16 px-4 sm:px-6 lg:px-12">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Landmark className="size-4" />
              </div>
              <span className="font-heading font-bold">{saccoInfo.name}</span>
            </div>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              A member-owned savings and credit cooperative.
            </p>
            <div className="mt-6 grid gap-2 text-sm text-muted-foreground">
              {saccoInfo.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="size-4" />
                  {saccoInfo.phone}
                </div>
              )}
              {saccoInfo.email && (
                <div className="flex items-center gap-2">
                  <Mail className="size-4" />
                  {saccoInfo.email}
                </div>
              )}
              {saccoInfo.address && (
                <div className="flex items-center gap-2">
                  <MapPin className="size-4" />
                  {saccoInfo.address}
                </div>
              )}
            </div>
            <div className="mt-10 flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                &copy; {new Date().getFullYear()} {saccoInfo.name}. All rights
                reserved.
              </p>
              <div className="flex gap-4">
                <LegalDocumentDialog label="Privacy Policy" documentKey="privacy_policy" />
                <LegalDocumentDialog label="Terms of Service" documentKey="terms_of_service" />
              </div>
            </div>
          </div>
        </footer>
      </div>

      <MobileScrollIndicator />
    </div>
  );
}
