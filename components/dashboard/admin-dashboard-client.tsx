"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/shared/stat-card";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDateTime, formatCurrency } from "@/lib/utils";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  Users,
  Wallet,
  Banknote,
  HandCoins,
  AlertTriangle,
  Clock,
  TrendingUp,
  UserPlus,
  ClipboardCheck,
  Activity,
} from "lucide-react";

const PORTFOLIO_COLORS: Record<string, string> = {
  active: "var(--chart-1)",
  fully_paid: "var(--chart-4)",
  defaulted: "var(--chart-5)",
  written_off: "var(--muted-foreground)",
};

const PORTFOLIO_LABELS: Record<string, string> = {
  active: "Active",
  fully_paid: "Fully paid",
  defaulted: "Defaulted",
  written_off: "Written off",
};

function monthLabel(month: string) {
  const [year, m] = month.split("-");
  return new Date(Number(year), Number(m) - 1, 1).toLocaleDateString("en-KE", {
    month: "short",
  });
}

export function AdminDashboardClient() {
  const data = useQuery(api.reports.queries.getAdminDashboard);

  if (data === undefined) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-80 w-full rounded-2xl" />
      </div>
    );
  }

  const { stats, monthlyCollections, memberGrowth, loanPortfolio, recentActivity } = data;
  const portfolioData = loanPortfolio
    .filter((p) => p.count > 0)
    .map((p) => ({ ...p, label: PORTFOLIO_LABELS[p.status] ?? p.status }));

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your Sacco at a glance.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          icon={Users}
          label="Active members"
          value={stats.activeMembers}
          tone="primary"
        />
        <StatCard
          icon={Wallet}
          label="Savings pool"
          value={<CurrencyDisplay amount={stats.savingsPool} />}
          tone="success"
        />
        <StatCard
          icon={Banknote}
          label="Shares pool"
          value={<CurrencyDisplay amount={stats.sharesPool} />}
          tone="secondary"
        />
        <StatCard
          icon={HandCoins}
          label="Active loans"
          value={stats.activeLoansCount}
          tone="accent"
        />
        <StatCard
          icon={HandCoins}
          label="Outstanding loans"
          value={<CurrencyDisplay amount={stats.outstandingTotal} />}
          tone="info"
        />
        <StatCard
          icon={Clock}
          label="Pending applications"
          value={stats.pendingApplications}
          tone={stats.pendingApplications > 0 ? "warning" : "primary"}
        />
        <StatCard
          icon={AlertTriangle}
          label="Overdue loans"
          value={stats.overdueLoans}
          tone={stats.overdueLoans > 0 ? "danger" : "primary"}
        />
        <StatCard
          icon={TrendingUp}
          label="This month's collections"
          value={<CurrencyDisplay amount={stats.thisMonthCollections} />}
          tone="success"
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          nativeButton={false}
          render={
            <Link href="/admin/members">
              <UserPlus className="size-4" />
              Register member
            </Link>
          }
        />
        <Button
          variant="outline"
          nativeButton={false}
          render={
            <Link href="/admin/contributions">
              <Wallet className="size-4" />
              Record contribution
            </Link>
          }
        />
        <Button
          variant="outline"
          nativeButton={false}
          render={
            <Link href="/admin/loans">
              <ClipboardCheck className="size-4" />
              Review pending loans
            </Link>
          }
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="rounded-2xl border-border/50 p-6 lg:col-span-2">
          <h2 className="text-sm font-semibold">Monthly collections</h2>
          <p className="text-xs text-muted-foreground">
            Savings, shares & repayments — last 12 months
          </p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyCollections}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis
                  dataKey="month"
                  tickFormatter={monthLabel}
                  tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                />
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value))}
                  labelFormatter={(label) => monthLabel(String(label))}
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="total" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="rounded-2xl border-border/50 p-6">
          <h2 className="text-sm font-semibold">Loan portfolio</h2>
          <p className="text-xs text-muted-foreground">By status</p>
          <div className="mt-4 h-64">
            {portfolioData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No loans yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={portfolioData}
                    dataKey="count"
                    nameKey="label"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {portfolioData.map((entry) => (
                      <Cell key={entry.status} fill={PORTFOLIO_COLORS[entry.status]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            {portfolioData.map((p) => (
              <div key={p.status} className="flex items-center gap-1.5 text-xs">
                <span
                  className="size-2 rounded-full"
                  style={{ background: PORTFOLIO_COLORS[p.status] }}
                />
                {p.label} ({p.count})
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="rounded-2xl border-border/50 p-6">
        <h2 className="text-sm font-semibold">Membership growth</h2>
        <p className="text-xs text-muted-foreground">Last 12 months</p>
        <div className="mt-4 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={memberGrowth}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="month"
                tickFormatter={monthLabel}
                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                labelFormatter={(label) => monthLabel(String(label))}
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="var(--chart-2)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="rounded-2xl border-border/50 p-6">
        <h2 className="text-sm font-semibold">Recent activity</h2>
        {recentActivity.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="No activity yet"
            className="mt-4 border-none py-8"
          />
        ) : (
          <div className="mt-4 space-y-3">
            {recentActivity.map((a) => (
              <div key={a._id} className="flex items-center justify-between text-sm">
                <div>
                  <p>{a.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.memberName} · {formatDateTime(a.createdAt)}
                  </p>
                </div>
                <CurrencyDisplay amount={a.amount} className="font-medium" />
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
