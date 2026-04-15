import { Gamepad2, Users, Clock, HelpCircle } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { formatNumber } from "@/lib/utils";
import { type GameDashboardKPI } from "@/types/game-dashboard";

interface KPICardsProps {
  kpi: GameDashboardKPI;
  t: (key: string) => string;
}

export function KPICards({ kpi, t }: KPICardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title={t("game_dashboard.sessions")}
        value={formatNumber(kpi.totalSessions)}
        icon={Gamepad2}
        href="/game-sessions?status=finished"
      />
      <StatCard
        title={t("game_dashboard.participants")}
        value={formatNumber(kpi.totalParticipants)}
        icon={Users}
      />
      <StatCard
        title={t("game_dashboard.kpi_avg_duration")}
        value={`${kpi.avgDuration} min`}
        icon={Clock}
      />
      <StatCard
        title={t("game_dashboard.kpi_avg_questions")}
        value={kpi.avgQuestions.toString()}
        icon={HelpCircle}
      />
    </div>
  );
}
