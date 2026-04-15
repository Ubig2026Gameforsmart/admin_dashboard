"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "@/lib/i18n";
import {
  GameDashboardClient,
  GameDashboardSkeleton,
} from "./game-dashboard-client";
import { type GameDashboardData } from "@/types/game-dashboard";

interface GameDashboardWrapperProps {
  initialData: GameDashboardData | null;
}

export function GameDashboardWrapper({
  initialData,
}: GameDashboardWrapperProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentRange = searchParams.get("timeRange") || "this-year";

  const [isPending, startTransition] = useTransition();

  const handleFilterChange = (val: string) => {
    startTransition(() => {
      router.push(`?timeRange=${val}`);
    });
  };

  return (
    <div className="flex-1 space-y-4">
      {/* Header with Filter */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Game Dashboard</h2>
        <Select value={currentRange} onValueChange={handleFilterChange}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder={t("master.this_year") || "This Year"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">
              {t("master.today") || "Today"}
            </SelectItem>
            <SelectItem value="yesterday">
              {t("master.yesterday") || "Yesterday"}
            </SelectItem>
            <SelectItem value="this-week">
              {t("master.this_week") || "This Week"}
            </SelectItem>
            <SelectItem value="last-week">
              {t("master.last_week") || "Last Week"}
            </SelectItem>
            <SelectItem value="this-month">
              {t("master.this_month") || "This Month"}
            </SelectItem>
            <SelectItem value="last-month">
              {t("master.last_month") || "Last Month"}
            </SelectItem>
            <SelectItem value="this-year">
              {t("master.this_year") || "This Year"}
            </SelectItem>
            <SelectItem value="last-year">
              {t("master.last_year") || "Last Year"}
            </SelectItem>
            <SelectItem value="all">
              {t("master.all_time") || "All Time"}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Content: Show Skeleton when filter is changing */}
      {isPending ? (
        <GameDashboardSkeleton />
      ) : (
        <GameDashboardClient data={initialData} />
      )}
    </div>
  );
}
