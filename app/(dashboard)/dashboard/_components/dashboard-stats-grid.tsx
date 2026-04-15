import {
  Users,
  ShieldCheck,
  FileQuestion,
  AlertTriangle,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardStatsGridProps {
  loading: boolean;
  stats: {
    totalUsers: number;
    totalAdmins: number;
    totalQuizzes: number;
    pendingReports: number;
  };
  t: (key: string) => string;
}

export function DashboardStatsGrid({
  loading,
  stats,
  t,
}: DashboardStatsGridProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
    </div>
  );
}
