"use client";

import {
  Trash2,
  CheckSquare,
  AlertTriangle,
  RefreshCw,
  Search,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DataTable } from "@/components/dashboard/data-table";
import { type StaleSession } from "@/types/manage-session";

import { useManageSessionsTable } from "./_hooks/use-manage-sessions-table";
import { getManageSessionsColumns } from "./_components/manage-sessions-columns";

interface ManageSessionsTableProps {
  initialData: StaleSession[];
  initialError: string | null;
}

export function ManageSessionsTable({
  initialData,
  initialError,
}: ManageSessionsTableProps) {
  const {
    isPending,
    selected,
    showConfirm,
    setShowConfirm,
    clearMode,
    clearResult,
    setClearResult,
    searchInput,
    setSearchInput,
    filteredData,
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedData,
    isPageSelected,
    toggleSelect,
    toggleSelectPage,
    handleClear,
    confirmClear,
    handleRefresh,
    handleSearch,
    handleKeyDown,
  } = useManageSessionsTable(initialData);

  const columns = getManageSessionsColumns(
    isPageSelected,
    selected,
    toggleSelectPage,
    toggleSelect
  );

  // Convert paginatedData to generic Record for DataTable
  const tableData = paginatedData.map((item) => ({
    ...item,
  })) as unknown as Record<string, unknown>[];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Manage Sessions</h2>
        </div>
        <div className="flex items-center gap-3">
          {/* Search Box */}
          <div className="relative hidden md:block">
            <Input
              placeholder="Search sessions..."
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

          <div className="flex items-center gap-2">
            {filteredData.length > 0 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleClear("selected")}
                  disabled={selected.size === 0 || isPending}
                  className="text-destructive hover:text-destructive border-destructive/20 hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4 mr-1.5" />
                  Clear ({selected.size})
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleClear("all")}
                  disabled={isPending}
                >
                  <Trash2 className="h-4 w-4 mr-1.5" />
                  Clear All
                </Button>
              </>
            )}
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={isPending}
              title="Refresh"
              className="h-9 w-9"
            >
              <RefreshCw
                className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`}
              />
              <span className="sr-only">Refresh</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Result Toast */}
      {clearResult && (
        <div
          className={`flex items-center gap-2 p-3 rounded-lg text-sm border animate-in fade-in slide-in-from-top-2 ${
            clearResult.error
              ? "bg-destructive/10 text-destructive border-destructive/20"
              : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
          }`}
        >
          {clearResult.error ? (
            <AlertTriangle className="h-4 w-4 shrink-0" />
          ) : (
            <CheckSquare className="h-4 w-4 shrink-0" />
          )}
          <span className="font-medium">
            {clearResult.error
              ? `Error: ${clearResult.error}`
              : `Successfully cleared ${clearResult.cleared} session(s)`}
          </span>
          <button
            onClick={() => setClearResult(null)}
            className="ml-auto text-xs underline opacity-70 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Error */}
      {initialError && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20">
          <AlertTriangle className="h-4 w-4" />
          {initialError}
        </div>
      )}

      {/* Sessions Table */}
      <DataTable
        columns={columns as any}
        data={tableData}
        currentPage={currentPage}
        totalPages={totalPages || 1}
        onPageChange={(page) => setCurrentPage(page)}
      />

      {/* Confirm Dialog */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Sessions</AlertDialogTitle>
            <AlertDialogDescription>
              {clearMode === "all"
                ? `Are you sure you want to clear all ${filteredData.length} visible stale waiting session(s)? This action cannot be undone.`
                : `Are you sure you want to clear ${selected.size} selected session(s)? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmClear}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              Clear
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
