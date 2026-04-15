import { useState, useMemo, useCallback, useEffect } from "react";
import { fetchGameApplications } from "../actions";
import { type GameApplication } from "@/types/game";
import {
  startOfDay,
  subDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subWeeks,
  subMonths,
  subYears,
} from "date-fns";

export type TimeFilter =
  | "today"
  | "yesterday"
  | "this_week"
  | "last_week"
  | "this_month"
  | "last_month"
  | "this_year"
  | "last_year"
  | "all_time";

export const TIME_FILTER_LABELS: Record<TimeFilter, string> = {
  today: "Today",
  yesterday: "Yesterday",
  this_week: "This Week",
  last_week: "Last Week",
  this_month: "This Month",
  last_month: "Last Month",
  this_year: "This Year",
  last_year: "Last Year",
  all_time: "All Time",
};

export function getDateRange(filter: TimeFilter): { start?: string; end?: string } {
  const now = new Date();

  switch (filter) {
    case "today":
      return {
        start: startOfDay(now).toISOString(),
        end: now.toISOString(),
      };
    case "yesterday": {
      const yesterday = subDays(now, 1);
      return {
        start: startOfDay(yesterday).toISOString(),
        end: startOfDay(now).toISOString(),
      };
    }
    case "this_week":
      return {
        start: startOfWeek(now, { weekStartsOn: 1 }).toISOString(),
        end: now.toISOString(),
      };
    case "last_week": {
      const lastWeek = subWeeks(now, 1);
      return {
        start: startOfWeek(lastWeek, { weekStartsOn: 1 }).toISOString(),
        end: endOfWeek(lastWeek, { weekStartsOn: 1 }).toISOString(),
      };
    }
    case "this_month":
      return {
        start: startOfMonth(now).toISOString(),
        end: now.toISOString(),
      };
    case "last_month": {
      const lastMonth = subMonths(now, 1);
      return {
        start: startOfMonth(lastMonth).toISOString(),
        end: endOfMonth(lastMonth).toISOString(),
      };
    }
    case "this_year":
      return {
        start: startOfYear(now).toISOString(),
        end: now.toISOString(),
      };
    case "last_year": {
      const lastYear = subYears(now, 1);
      return {
        start: startOfYear(lastYear).toISOString(),
        end: endOfYear(lastYear).toISOString(),
      };
    }
    case "all_time":
    default:
      return {};
  }
}

export function formatAppName(name: string): string {
  return name
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function useGames() {
  const [apps, setApps] = useState<GameApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("this_month");

  const loadData = useCallback((filter: TimeFilter) => {
    setLoading(true);
    const { start, end } = getDateRange(filter);
    fetchGameApplications(start, end).then(({ data }) => {
      setApps(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    loadData(timeFilter);
  }, [timeFilter, loadData]);

  const filteredData = useMemo(() => {
    if (!activeSearch) return apps;
    const q = activeSearch.toLowerCase();
    return apps.filter((app) =>
      formatAppName(app.name).toLowerCase().includes(q)
    );
  }, [apps, activeSearch]);

  const handleSearch = () => setActiveSearch(searchInput);
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearch();
  };

  return {
    apps,
    loading,
    searchInput,
    setSearchInput,
    timeFilter,
    setTimeFilter,
    filteredData,
    handleSearch,
    handleKeyDown,
  };
}
