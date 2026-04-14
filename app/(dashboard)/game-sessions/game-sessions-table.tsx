"use client";

import { useRouter } from "next/navigation";
import { Search, Gamepad2, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/dashboard/data-table";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";
import { type GameSession } from "@/types/game-session";

import { useGameSessionsTable } from "./_hooks/use-game-sessions-table";
import { getGameSessionColumns } from "./_components/game-session-columns";
import { GameSessionDialogs } from "./_components/game-session-dialogs";

interface GameSessionsTableProps {
  initialData: GameSession[];
  totalPages: number;
  currentPage: number;
  totalCount: number;
  searchQuery: string;
  currentStatus: string;
  currentApplication: string;
  currentQuestions: string;
  currentDuration: string;
  currentSort: string;
  currentCategory: string;
}

export function GameSessionsTable({
  initialData,
  totalPages,
  currentPage,
  totalCount,
  searchQuery,
  currentStatus,
  currentApplication,
  currentQuestions,
  currentDuration,
  currentSort,
  currentCategory,
}: GameSessionsTableProps) {
  const router = useRouter();
  const { t, locale } = useTranslation();

  const {
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
  } = useGameSessionsTable({
    initialData,
    currentPage,
    searchQuery,
    currentStatus,
    currentApplication,
    currentQuestions,
    currentDuration,
    currentSort,
    currentCategory,
  });

  const columns = getGameSessionColumns(t, locale, setSelectedParticipants);

  const tableData = sessions.map((session) => {
    return {
      id: session.id,
      quiz_title: session.quiz_title,
      category: session.category,
      game_pin: session.game_pin,
      host: session.host,
      status: session.status,
      participant_count: session.participant_count,
      participants: session.participants,
      total_questions: session.total_questions,
      application: session.application,
      duration_minutes: session.duration_minutes,
      created_at: session.created_at,
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {t("game_sessions.title")}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Input
              placeholder={t("game_sessions.search_placeholder")}
              className="pr-10 w-64 bg-background border-border"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              onClick={handleSearch}
              disabled={isPending}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors cursor-pointer"
            >
              <Search className="h-3.5 w-3.5" />
            </button>
          </div>

          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 bg-black border-black hover:bg-black/80"
            onClick={() => setIsFilterOpen(true)}
          >
            <Filter className="h-4 w-4 text-white" />
          </Button>

          <GameSessionDialogs
            t={t}
            isFilterOpen={isFilterOpen}
            setIsFilterOpen={setIsFilterOpen}
            tempFilters={tempFilters}
            setTempFilters={setTempFilters}
            selectedParticipants={selectedParticipants}
            setSelectedParticipants={setSelectedParticipants}
            handleResetFilter={handleResetFilter}
            handleApplyFilter={handleApplyFilter}
          />
        </div>
      </div>

      {/* Table */}
      <div className={isPending ? "opacity-60 pointer-events-none" : ""}>
        {sessions.length > 0 ? (
          <DataTable
            columns={columns}
            data={tableData as Record<string, unknown>[]}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            onRowClick={(row) => router.push(`/game-sessions/${row.id as string}`)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border rounded-xl bg-card">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <Gamepad2 className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-base font-medium text-foreground mb-1">
              {t("game_sessions.no_sessions")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery
                ? t("game_sessions.no_match")
                : t("game_sessions.no_data")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
