"use client";

import { useTransition } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/shared/search-input";
import { DataTable } from "@/components/dashboard/data-table";

import { Category } from "@/types/category";
import { useCategoryTable } from "../_hooks/use-category-table";
import { getCategoryColumns } from "./category-columns";
import { CategoryDialogs } from "./category-dialogs";

interface CategoryTableProps {
  initialData: Category[];
}

export function CategoryTable({ initialData }: CategoryTableProps) {
  const [isPending] = useTransition();

  const {
    t,
    searchQuery,
    setSearchQuery,
    currentPage,
    paginatedData,
    totalPages,
    handlePageChange,
    editDialog,
    setEditDialog,
    handleOpenDialog,
    handleSave,
    handleToggleStatus,
    isSaving,
  } = useCategoryTable(initialData);

  const columns = getCategoryColumns({
    t,
    handleOpenDialog,
    handleToggleStatus,
    categories: paginatedData,
  });

  const tableData = paginatedData.map((cat) => ({
    id: cat.id,
    name: cat.name,
    status: cat.status,
    competitions_count: cat.competitions_count ?? 0,
    actions: null,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">
          {t("nav.competition_category") || "Category"}
        </h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <SearchInput
              placeholder={t("manage_competitions.search_placeholder") || "Search categories..."}
              className="w-64 bg-background border-border text-sm h-9"
              value={searchQuery}
              onSearch={(val) => setSearchQuery(val)}
            />
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            {t("action.add") || "Add"}
          </Button>
        </div>
      </div>

      <div className={isPending ? "opacity-60 pointer-events-none" : ""}>
        <DataTable
          columns={columns}
          data={tableData as Record<string, unknown>[]}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>

      <CategoryDialogs
        editDialog={editDialog}
        setEditDialog={setEditDialog}
        handleSave={handleSave}
        isSaving={isSaving}
      />
    </div>
  );
}
