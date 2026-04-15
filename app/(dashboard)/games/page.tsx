"use client";

import { Search, Dices } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GameCard } from "./_components/game-card";
import { useGames, formatAppName, TIME_FILTER_LABELS, type TimeFilter } from "./_hooks/use-games";

export default function GamesPage() {
  const {
    loading,
    searchInput,
    setSearchInput,
    timeFilter,
    setTimeFilter,
    filteredData,
    handleSearch,
    handleKeyDown,
  } = useGames();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-40" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-64" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Games</h1>
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Input
              placeholder="Search application..."
              className="pr-10 w-64 bg-background border-border"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              onClick={handleSearch}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Search className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Time Filter */}
          <Select
            value={timeFilter}
            onValueChange={(val) => setTimeFilter(val as TimeFilter)}
          >
            <SelectTrigger className="w-fit gap-1 bg-background border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(TIME_FILTER_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredData.map((app, idx) => (
          <GameCard
            key={app.name}
            app={app}
            index={idx}
            formatAppName={formatAppName}
          />
        ))}
      </div>

      {/* Empty State */}
      {filteredData.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Dices className="h-12 w-12 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">No applications found</p>
        </div>
      )}
    </div>
  );
}
