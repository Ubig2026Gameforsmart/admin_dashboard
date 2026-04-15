"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useTransition,
} from "react";
import { Profile } from "@/app/(dashboard)/users/actions";
import { Quiz } from "@/app/(dashboard)/quizzes/actions";
import { Report } from "@/types/report";
import { getAllProfiles } from "@/app/(dashboard)/users/actions";
import { getAllQuizzes } from "@/app/(dashboard)/quizzes/actions";
import { getAllReports } from "@/app/(dashboard)/reports/actions";
import { getAllGroups } from "@/app/(dashboard)/groups/actions";
import { Group } from "@/types/group";

interface DashboardData {
  users: Profile[];
  quizzes: Quiz[];
  reports: Report[];
  groups: Group[];
  isLoading: boolean;
  lastUpdated: Date | null;
  refreshData: () => Promise<void>;
}

const DashboardContext = createContext<DashboardData | undefined>(undefined);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<{
    users: Profile[];
    quizzes: Quiz[];
    reports: Report[];
    groups: Group[];
  }>({ users: [], quizzes: [], reports: [], groups: [] });

  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isPending, startTransition] = useTransition();

  const refreshData = async () => {
    // If not first load, we might want background refresh, but for simplicity let's set loading
    // Or maybe keep old data while fetching?
    // Let's keep old data visible but maybe show legitimate loader if it's first time
    if (!lastUpdated) setIsLoading(true);

    startTransition(async () => {
      try {
        const [usersData, quizzesData, reportsData, groupsData] =
          await Promise.all([
            getAllProfiles(),
            getAllQuizzes(),
            getAllReports(),
            getAllGroups(),
          ]);

        setData({
          users: usersData,
          quizzes: quizzesData,
          reports: reportsData as Report[],
          groups: groupsData,
        });
        setLastUpdated(new Date());
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    });
  };

  // Initial Fetch on mount
  useEffect(() => {
    refreshData();
  }, []);

  return (
    <DashboardContext.Provider
      value={{
        ...data,
        isLoading: isLoading || isPending,
        lastUpdated,
        refreshData,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export const useDashboardData = () => {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error("useDashboardData must be used within a DashboardProvider");
  }
  return context;
};
