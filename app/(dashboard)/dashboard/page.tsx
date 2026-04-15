"use client";

import { ActionCard } from "@/components/dashboard/action-card";
import { SectionHeader } from "@/components/dashboard/section-header";
import { DataTable } from "@/components/dashboard/data-table";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useTranslation } from "@/lib/i18n";
import { Users, Headphones, Database, Settings } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardStatsGrid } from "./_components/dashboard-stats-grid";
import { DashboardCharts } from "./_components/dashboard-charts";
import { getActivityColumns } from "./_components/activity-columns";

export default function GlobalDashboardPage() {
  const { t } = useTranslation();
  const { stats, recentActivity, userGrowthData, loading } =
    useDashboardStats();

  const activityColumns = getActivityColumns(t);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          {t("page.global_dashboard")}
        </h1>
      </div>

      {/* Stats Grid */}
      <DashboardStatsGrid loading={loading} stats={stats} t={t} />

      {/* Charts Section */}
      <DashboardCharts
        loading={loading}
        userGrowthData={userGrowthData}
        t={t}
      />

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
