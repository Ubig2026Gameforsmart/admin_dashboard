import { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { type GameSession } from "@/types/game-session";
import { fetchGameSessions } from "../actions";

export function useGameSessionsTable({
  initialData,
  currentPage,
  searchQuery,
  currentStatus,
  currentApplication,
  currentQuestions,
  currentDuration,
  currentSort,
  currentCategory,
}: {
  initialData: GameSession[];
  currentPage: number;
  searchQuery: string;
  currentStatus: string;
  currentApplication: string;
  currentQuestions: string;
  currentDuration: string;
  currentSort: string;
  currentCategory: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [searchInput, setSearchInput] = useState(searchQuery);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [tempFilters, setTempFilters] = useState({
    status: currentStatus,
    application: currentApplication,
    questions: currentQuestions,
    duration: currentDuration,
    sort: currentSort,
    category: currentCategory,
  });

  useEffect(() => {
    if (isFilterOpen) {
      setTempFilters({
        status: currentStatus,
        application: currentApplication,
        questions: currentQuestions,
        duration: currentDuration,
        sort: currentSort,
        category: currentCategory,
      });
    }
  }, [
    isFilterOpen,
    currentStatus,
    currentApplication,
    currentQuestions,
    currentDuration,
    currentSort,
    currentCategory,
  ]);

  const [sessions, setSessions] = useState<GameSession[]>(initialData);

  useEffect(() => {
    setSessions(initialData);
  }, [initialData]);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const { data } = await fetchGameSessions({
          page: currentPage,
          pageSize: 15,
          search: searchQuery,
          status: currentStatus,
          application: currentApplication,
          questions: currentQuestions,
          duration: currentDuration,
          sort: currentSort,
          category: currentCategory,
        });
        setSessions(data);
      } catch (error) {
        console.error("Auto-refresh failed:", error);
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [
    currentPage,
    searchQuery,
    currentStatus,
    currentApplication,
    currentQuestions,
    currentDuration,
    currentSort,
    currentCategory,
  ]);

  const [selectedParticipants, setSelectedParticipants] = useState<
    GameSession["participants"] | null
  >(null);

  const updateUrl = (params: Record<string, string | number>) => {
    const newParams = new URLSearchParams(searchParams.toString());

    Object.entries(params).forEach(([key, value]) => {
      if (value && value !== "" && value !== "all" && value !== "newest") {
        newParams.set(key, String(value));
      } else {
        newParams.delete(key);
      }
    });

    startTransition(() => {
      router.push(`?${newParams.toString()}`);
    });
  };

  const handleApplyFilter = () => {
    updateUrl({
      page: 1,
      search: searchInput,
      status: tempFilters.status,
      application: tempFilters.application,
      questions: tempFilters.questions,
      duration: tempFilters.duration,
      sort: tempFilters.sort,
      category: tempFilters.category,
    });
    setIsFilterOpen(false);
  };

  const handleResetFilter = () => {
    setTempFilters({
      status: "all",
      application: "all",
      questions: "all",
      duration: "all",
      sort: "newest",
      category: "all",
    });
  };

  const handleSearch = () => {
    updateUrl({ search: searchInput, page: 1 });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handlePageChange = (page: number) => {
    updateUrl({ page, search: searchQuery });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return {
    sessions,
    isPending,
    searchInput,
    setSearchInput,
    isFilterOpen,
    setIsFilterOpen,
    tempFilters,
    setTempFilters,
    selectedParticipants,
    setSelectedParticipants,
    handleApplyFilter,
    handleResetFilter,
    handleSearch,
    handleKeyDown,
    handlePageChange,
  };
}
