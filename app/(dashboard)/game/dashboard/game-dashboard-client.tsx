"use client";

import { useTranslation } from "@/lib/i18n";
import { type GameDashboardData } from "@/types/game-dashboard";
import { useGameDashboard } from "./_hooks/use-game-dashboard";
import { KPICards } from "./_components/kpi-cards";
import { HorizontalBarChart } from "./_components/horizontal-bar-chart";
import { GameDashboardSkeleton } from "./_components/game-dashboard-skeleton";

// Re-export skeleton for page.tsx usage
export { GameDashboardSkeleton };

interface GameDashboardProps {
  data: GameDashboardData | null;
}

export function GameDashboardClient({ data }: GameDashboardProps) {
  const { t } = useTranslation();
  const {
    activeLabel,
    setActiveLabel,
    handleAppClick,
    handleHostClick,
    handleCategoryClick,
    handleCountryClick,
    handleStateClick,
    handleCityClick,
  } = useGameDashboard();

  if (!data) return <GameDashboardSkeleton />;

  const { kpi, charts } = data;

  const topHostsData =
    charts.topHosts?.map((h: any) => ({
      name: h.fullname,
      count: h.count,
      id: h.id,
    })) || [];

  const topAppsData =
    charts.apps?.map((a: any) => ({
      name: a.name,
      count: a.value,
    })) || [];

  const topCategoriesData = charts.topCategories || [];
  const topCountriesData = charts.topCountries || [];
  const topStatesData = charts.topStates || [];
  const topCitiesData = charts.topCities || [];

  const sessionLabel = t("game_dashboard.sessions");
  const noDataLabel = t("msg.no_data");

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <KPICards kpi={kpi} t={t} />

      {/* First Row: Apps, Hosts, Categories */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <HorizontalBarChart
          title={t("game_dashboard.top_apps")}
          data={topAppsData}
          sessionLabel={sessionLabel}
          noDataLabel={noDataLabel}
          yAxisWidth={180}
          labelMaxLength={20}
          activeLabel={activeLabel}
          setActiveLabel={setActiveLabel}
          onBarClick={handleAppClick}
        />

        <HorizontalBarChart
          title={t("game_dashboard.top_hosts")}
          data={topHostsData}
          sessionLabel={sessionLabel}
          noDataLabel={noDataLabel}
          yAxisWidth={150}
          labelMaxLength={18}
          activeLabel={activeLabel}
          setActiveLabel={setActiveLabel}
          onBarClick={handleHostClick}
          onLabelClick={(item) => handleHostClick(item)}
        />

        <HorizontalBarChart
          title={t("stats.category_title")}
          data={topCategoriesData}
          sessionLabel={sessionLabel}
          noDataLabel={noDataLabel}
          yAxisWidth={110}
          labelMaxLength={14}
          activeLabel={activeLabel}
          setActiveLabel={setActiveLabel}
          onBarClick={handleCategoryClick}
        />
      </div>

      {/* Second Row: Location Charts */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <HorizontalBarChart
          title={
            t("master.top_countries") === "master.top_countries"
              ? "Top Countries"
              : t("master.top_countries")
          }
          data={topCountriesData}
          sessionLabel={sessionLabel}
          noDataLabel={noDataLabel}
          yAxisWidth={140}
          labelMaxLength={18}
          activeLabel={activeLabel}
          setActiveLabel={setActiveLabel}
          onBarClick={handleCountryClick}
        />

        <HorizontalBarChart
          title={t("master.top_states")}
          data={topStatesData}
          sessionLabel={sessionLabel}
          noDataLabel={noDataLabel}
          yAxisWidth={140}
          labelMaxLength={18}
          activeLabel={activeLabel}
          setActiveLabel={setActiveLabel}
          onBarClick={handleStateClick}
        />

        <HorizontalBarChart
          title={t("master.top_cities")}
          data={topCitiesData}
          sessionLabel={sessionLabel}
          noDataLabel={noDataLabel}
          yAxisWidth={160}
          labelMaxLength={22}
          activeLabel={activeLabel}
          setActiveLabel={setActiveLabel}
          onBarClick={handleCityClick}
        />
      </div>
    </div>
  );
}
