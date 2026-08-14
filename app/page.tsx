import Link from "next/link";
import { redirect } from "next/navigation";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { getCurrentUserServer } from "@/lib/auth-server";
import { portalHomeForRole } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { HeroStats } from "@/components/landing/hero-stats";
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

  const stats = await fetchQuery(api.reports.queries.getLandingStats, {});

  return (
    <div className="flex flex-1 flex-col">
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Landmark className="size-5" />
            </div>
            <span className="font-heading text-lg font-bold tracking-tight">
              Client Sacco
            </span>
          </div>
          <Button
            nativeButton={false}
            render={<Link href="/login">Member Login</Link>}
          />
        </div>
      </nav>

      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="font-heading text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
              Save together. Borrow smart. Grow as one.
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              Client Sacco helps members build savings, access affordable
              credit, and share in the cooperative&apos;s success — all
              managed transparently in one place.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Button
                size="lg"
                nativeButton={false}
                render={<Link href="/login">Member Login</Link>}
              />
              <Button
                size="lg"
                variant="outline"
                nativeButton={false}
                render={<a href="#about">Learn more</a>}
              />
            </div>
          </div>

          <HeroStats stats={stats} />
        </div>
      </section>

      <section id="about" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
              About the Sacco
            </h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              We are a member-owned savings and credit cooperative. Every
              shilling saved strengthens the pool members can borrow against,
              and every loan repaid keeps the cooperative growing for
              everyone.
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-3">
            <Card className="rounded-2xl border-border/50 p-8 hover:shadow-lg transition-shadow">
              <PiggyBank className="size-8 text-primary" />
              <h3 className="mt-4 font-heading text-lg font-semibold">
                Save Together
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Build your savings and share capital steadily every month,
                with full visibility into your balances at all times.
              </p>
            </Card>
            <Card className="rounded-2xl border-border/50 p-8 hover:shadow-lg transition-shadow">
              <HandCoins className="size-8 text-primary" />
              <h3 className="mt-4 font-heading text-lg font-semibold">
                Borrow Smart
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Apply for a loan, get guarantors, and track your repayment
                schedule from your member portal — no paperwork required.
              </p>
            </Card>
            <Card className="rounded-2xl border-border/50 p-8 hover:shadow-lg transition-shadow">
              <Users className="size-8 text-primary" />
              <h3 className="mt-4 font-heading text-lg font-semibold">
                Grow as One
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Annual dividends are paid out on your shares, so the
                cooperative&apos;s growth comes back to every member.
              </p>
            </Card>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="size-4 text-success" />
            Every transaction is recorded and auditable.
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-16 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-start justify-between gap-8 sm:flex-row">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Landmark className="size-4" />
                </div>
                <span className="font-heading font-bold">Client Sacco</span>
              </div>
              <p className="mt-3 max-w-xs text-sm text-muted-foreground">
                A member-owned savings and credit cooperative.
              </p>
            </div>
            <div className="grid gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Phone className="size-4" />
                +254 700 000 000
              </div>
              <div className="flex items-center gap-2">
                <Mail className="size-4" />
                info@clientsacco.co.ke
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="size-4" />
                Nairobi, Kenya
              </div>
            </div>
          </div>
          <div className="mt-10 border-t border-border pt-6 text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Client Sacco. All rights
            reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
