"use client";

import { StatCard } from "@/components/dashboard/stat-card";
import { ActionCard } from "@/components/dashboard/action-card";
import { SectionHeader } from "@/components/dashboard/section-header";
import { DataTable } from "@/components/dashboard/data-table";
import { revenueData } from "@/lib/dummy-data";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useTranslation } from "@/lib/i18n";
import {
  Users,
  ShieldCheck,
  FileQuestion,
  AlertTriangle,
  Headphones,
  Database,
  Settings,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

export default function GlobalDashboardPage() {
  const { t } = useTranslation();
  const { stats, recentActivity, userGrowthData, loading } =
    useDashboardStats();

  const activityColumns = [
    { key: "action", label: t("table.actions") },
    { key: "user", label: t("stats.users") },
    { key: "time", label: t("table.created") },
    {
      key: "type",
      label: "Type",
      render: (value: unknown) => {
        const typeColors: Record<string, string> = {
          billing: "text-[var(--success)]",
          support: "text-[var(--warning)]",
          content: "text-primary",
          user: "text-chart-2",
        };
        return (
          <span
            className={`capitalize font-medium ${
              typeColors[value as string] || ""
            }`}
          >
            {value as string}
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1>IWAK</h1>
        <h1 className="text-3xl font-bold text-foreground">
          {t("page.global_dashboard")}
        </h1>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          <>
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </>
        ) : (
          <>
            <StatCard
              title={t("stats.users")}
              value={stats.totalUsers.toLocaleString("id-ID")}
              icon={Users}
            />
            <StatCard
              title={t("stats.admins")}
              value={stats.totalAdmins.toLocaleString("id-ID")}
              icon={ShieldCheck}
            />
            <StatCard
              title={t("stats.quizzes")}
              value={stats.totalQuizzes.toLocaleString("id-ID")}
              icon={FileQuestion}
            />
            <StatCard
              title={t("stats.reports")}
              value={stats.pendingReports.toLocaleString("id-ID")}
              description={t("stats.pending")}
              icon={AlertTriangle}
            />
          </>
        )}
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">
              {t("dashboard.revenue_overview")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="oklch(0.7 0.15 180)"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor="oklch(0.7 0.15 180)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="oklch(0.28 0.01 260)"
                />
                <XAxis dataKey="month" stroke="oklch(0.65 0 0)" />
                <YAxis stroke="oklch(0.65 0 0)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "oklch(0.17 0.01 260)",
                    border: "1px solid oklch(0.28 0.01 260)",
                    borderRadius: "8px",
                    color: "oklch(0.95 0 0)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="oklch(0.7 0.15 180)"
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">
              {t("dashboard.user_activity")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={userGrowthData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="oklch(0.28 0.01 260)"
                  />
                  <XAxis dataKey="month" stroke="oklch(0.65 0 0)" />
                  <YAxis stroke="oklch(0.65 0 0)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "oklch(0.17 0.01 260)",
                      border: "1px solid oklch(0.28 0.01 260)",
                      borderRadius: "8px",
                      color: "oklch(0.95 0 0)",
                    }}
                  />
                  <Bar
                    dataKey="users"
                    fill="oklch(0.65 0.18 280)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Access Cards */}
      <div>
        <SectionHeader
          title={t("dashboard.quick_access")}
          description={t("dashboard.quick_access_desc")}
        />
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ActionCard
            title={t("dashboard.support_center")}
            description={t("dashboard.support_center_desc")}
            href="/support"
            icon={Headphones}
            stats={
              loading ? "..." : `${stats.pendingReports} ${t("stats.pending")}`
            }
          />
          <ActionCard
            title={t("stats.users")}
            description={t("dashboard.users_desc")}
            href="/administrator/user"
            icon={Users}
            stats={
              loading
                ? "..."
                : `${stats.totalUsers.toLocaleString("id-ID")} ${t(
                    "stats.users"
                  ).toLowerCase()}`
            }
          />
          <ActionCard
            title={t("nav.master_data")}
            description={t("dashboard.master_data_desc")}
            href="/master"
            icon={Database}
            stats={
              loading
                ? "..."
                : `${stats.totalQuizzes.toLocaleString("id-ID")} ${t(
                    "stats.quizzes"
                  ).toLowerCase()}`
            }
          />
          <ActionCard
            title={t("nav.settings")}
            description={t("dashboard.settings_desc")}
            href="/settings"
            icon={Settings}
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <SectionHeader
          title={t("dashboard.recent_activity")}
          description={t("dashboard.recent_activity_desc")}
        />
        <div className="mt-4">
          {loading ? (
            <Skeleton className="h-48 w-full rounded-xl" />
          ) : (
            <DataTable
              columns={activityColumns}
              data={recentActivity as unknown as Record<string, unknown>[]}
            />
          )}
        </div>
      </div>
    </div>
  );
}
