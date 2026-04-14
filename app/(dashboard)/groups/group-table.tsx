"use client";

import { useTransition } from "react";
import { Search, Users, Filter } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type Group, type Country } from "@/types/group";
import { useGroupsTable } from "./_hooks/use-groups-table";
import { GroupCard } from "./_components/group-card";
import { GroupDialogs } from "./_components/group-dialogs";

interface GroupTableProps {
  initialData: Group[];
  countries: Country[];
  categories: string[];
}

export function GroupTable({
  initialData,
  countries,
  categories,
}: GroupTableProps) {
  const { t } = useTranslation();
  const [isPending] = useTransition();

  const {
    currentPage,
    totalPages,
    searchInput,
    setSearchInput,
    activeSearchQuery,
    filterValues,
    setFilterValues,
    deleteDialog,
    setDeleteDialog,
    filterDialogOpen,
    setFilterDialogOpen,
    states,
    cities,
    loadingStates,
    loadingCities,
    groupsWithCount,
    handleCountryChange,
    handleStateChange,
    openDeleteDialog,
    handleResetFilter,
    handleApplyFilter,
    handleCancelFilter,
    handleDeleteGroup,
    handleSearch,
    handleKeyDown,
    handlePageChange,
  } = useGroupsTable(initialData);

  const countryOptions = countries.map((c) => ({
    value: String(c.id),
    label: c.name,
  }));

  const stateOptions = states.map((s) => ({
    value: String(s.id),
    label: s.name,
  }));

  const cityOptions = cities.map((c) => ({
    value: String(c.id),
    label: c.name,
  }));

  const categoryOptions = categories.map((c) => {
    const key = c.toLowerCase().replace(/[\/\s]/g, "_");
    return {
      value: c,
      label: t(`category.${key}`) || c,
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {t("groups.title")}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Input
              placeholder={t("groups.search")}
              className="pr-10 w-64 bg-background border-border"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              onClick={handleSearch}
              disabled={isPending}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              <Search className="h-3.5 w-3.5" />
            </button>
          </div>

          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 bg-black border-black hover:bg-black/80"
            onClick={() => setFilterDialogOpen(true)}
          >
            <Filter className="h-4 w-4 text-white" />
          </Button>
        </div>
      </div>

      {/* Group Cards Grid */}
      <div className={isPending ? "opacity-60 pointer-events-none" : ""}>
        {groupsWithCount.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {groupsWithCount.map((group) => (
              <GroupCard
                key={group.id}
                group={group as any}
                onDelete={openDeleteDialog}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border rounded-lg">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <Users className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-base font-medium text-foreground mb-1">
              {t("groups.no_groups")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {activeSearchQuery
                ? t("groups.no_groups_desc")
                : t("groups.no_groups")}
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-card px-6 py-4">
        <div className="text-sm text-muted-foreground">
          Page <span className="font-medium text-foreground">{currentPage}</span>{" "}
          of <span className="font-medium text-foreground">{totalPages || 1}</span>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1 || isPending}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors",
                currentPage === 1 || isPending
                  ? "border-border bg-secondary/50 text-muted-foreground cursor-not-allowed"
                  : "border-border bg-card text-foreground hover:bg-secondary/80 cursor-pointer"
              )}
            >
              {t("action.previous")}
            </button>

            <div className="flex items-center gap-1">
              {(() => {
                const pages: (number | string)[] = [];

                if (totalPages <= 7) {
                  for (let i = 1; i <= totalPages; i++) {
                    pages.push(i);
                  }
                } else {
                  pages.push(1);

                  if (currentPage <= 3) {
                    pages.push(2, 3, 4, "...", totalPages);
                  } else if (currentPage >= totalPages - 2) {
                    pages.push(
                      "...",
                      totalPages - 3,
                      totalPages - 2,
                      totalPages - 1,
                      totalPages
                    );
                  } else {
                    pages.push(
                      "...",
                      currentPage - 1,
                      currentPage,
                      currentPage + 1,
                      "...",
                      totalPages
                    );
                  }
                }

                return pages.map((page, index) => {
                  if (page === "...") {
                    return (
                      <span
                        key={`ellipsis-${index}`}
                        className="w-9 h-9 flex items-center justify-center text-sm text-muted-foreground"
                      >
                        ...
                      </span>
                    );
                  }

                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page as number)}
                      disabled={isPending}
                      className={cn(
                        "w-9 h-9 text-sm font-medium rounded-lg border transition-colors cursor-pointer",
                        currentPage === page
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card text-foreground hover:bg-secondary/80"
                      )}
                    >
                      {page}
                    </button>
                  );
                });
              })()}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages || isPending}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors",
                currentPage === totalPages || isPending
                  ? "border-border bg-secondary/50 text-muted-foreground cursor-not-allowed"
                  : "border-border bg-card text-foreground hover:bg-secondary/80 cursor-pointer"
              )}
            >
              {t("action.next")}
            </button>
          </div>
        )}
      </div>

      <GroupDialogs
        t={t}
        deleteDialog={deleteDialog}
        setDeleteDialog={setDeleteDialog}
        handleDeleteGroup={handleDeleteGroup}
        filterDialogOpen={filterDialogOpen}
        setFilterDialogOpen={setFilterDialogOpen}
        filterValues={filterValues}
        setFilterValues={setFilterValues}
        categoryOptions={categoryOptions}
        countryOptions={countryOptions}
        stateOptions={stateOptions}
        cityOptions={cityOptions}
        handleCountryChange={handleCountryChange}
        handleStateChange={handleStateChange}
        loadingStates={loadingStates}
        loadingCities={loadingCities}
        handleResetFilter={handleResetFilter}
        handleCancelFilter={handleCancelFilter}
        handleApplyFilter={handleApplyFilter}
      />
    </div>
  );
}
