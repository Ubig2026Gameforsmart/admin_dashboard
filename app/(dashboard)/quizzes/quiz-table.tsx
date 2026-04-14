"use client";

import { Filter, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { useSearchParams } from "next/navigation";

import { DataTable } from "@/components/dashboard/data-table";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/shared/search-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

import { type Quiz } from "@/types/quiz";
import { useQuizzesTable } from "./_hooks/use-quizzes-table";
import { getQuizColumns, capitalizeFirst } from "./_components/quiz-columns";
import { QuizDialogs } from "./_components/quiz-dialogs";

interface QuizTableProps {
  initialData: Quiz[];
}

export function QuizTable({ initialData }: QuizTableProps) {
  const searchParams = useSearchParams();

  const {
    t,
    router,
    isPending,
    activeSearchQuery,
    setActiveSearchQuery,
    currentPage,
    totalPages,
    paginatedData,
    handlePageChange,
    filterDialogOpen,
    setFilterDialogOpen,
    tempFilters,
    setTempFilters,
    categories,
    handleResetFilter,
    handleApplyFilter,
    handleCancelFilter,
    confirmDialog,
    setConfirmDialog,
    openConfirmDialog,
    handleConfirm,
    blockDialog,
    setBlockDialog,
    openBlockDialog,
    handleBlockQuiz,
    unblockDialog,
    setUnblockDialog,
    openUnblockDialog,
    handleUnblock,
  } = useQuizzesTable(initialData);

  const columns = getQuizColumns({
    t,
    openConfirmDialog,
    openBlockDialog,
    openUnblockDialog,
  });

  const tableData = paginatedData.map((quiz) => ({
    id: quiz.id,
    title: quiz.title,
    creator: quiz.creator,
    category: quiz.category ?? "-",
    questions: Array.isArray(quiz.questions) ? quiz.questions.length : 0,
    language: quiz.language ?? "ID",
    difficulty: quiz.is_public ? "Public" : "Private",
    createdAt: quiz.created_at
      ? format(new Date(quiz.created_at), "d MMM yyyy")
      : "-",
    status: quiz.status === "block" ? "Block" : "Active",
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {t("quiz.title")}
          </h1>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          <SearchInput
            placeholder={t("quiz.search")}
            value={searchParams.get("search") || ""}
            onSearch={(val) => {
              setActiveSearchQuery(val);
            }}
            className="w-64 bg-background border-border"
          />

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

      <div className={isPending ? "opacity-60 pointer-events-none" : ""}>
        <DataTable
          columns={columns}
          data={tableData as Record<string, unknown>[]}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          onRowClick={(row) => router.push(`/quizzes/${row.id}`)}
        />
      </div>

      <QuizDialogs
        confirmDialog={confirmDialog}
        setConfirmDialog={setConfirmDialog}
        handleConfirm={handleConfirm}
        blockDialog={blockDialog}
        setBlockDialog={setBlockDialog}
        handleBlockQuiz={handleBlockQuiz}
        unblockDialog={unblockDialog}
        setUnblockDialog={setUnblockDialog}
        handleUnblock={handleUnblock}
      />

      <Dialog open={filterDialogOpen} onOpenChange={setFilterDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-primary" />
              {t("action.filter")}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="category">{t("table.category")}</Label>
              <Select
                value={tempFilters.category}
                onValueChange={(value) =>
                  setTempFilters((prev) => ({ ...prev, category: value }))
                }
              >
                <SelectTrigger id="category" className="w-full">
                  <SelectValue placeholder={t("table.category")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("quiz.all_category")}</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {t(`category.${cat?.toLowerCase()?.replace(" ", "_")}`) ||
                        capitalizeFirst(cat)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="visibility">{t("table.visibility")}</Label>
              <Select
                value={tempFilters.visibility}
                onValueChange={(value) =>
                  setTempFilters((prev) => ({ ...prev, visibility: value }))
                }
              >
                <SelectTrigger id="visibility" className="w-full">
                  <SelectValue placeholder={t("table.visibility")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t("filter.all_visibility")}
                  </SelectItem>
                  <SelectItem value="publik">{t("status.public")}</SelectItem>
                  <SelectItem value="private">{t("status.private")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="status">{t("table.status")}</Label>
              <Select
                value={tempFilters.status}
                onValueChange={(value) =>
                  setTempFilters((prev) => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger id="status" className="w-full">
                  <SelectValue placeholder={t("table.status")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("filter.all_status")}</SelectItem>
                  <SelectItem value="active">{t("status.active")}</SelectItem>
                  <SelectItem value="block">{t("status.blocked")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="flex-row gap-2 sm:justify-between">
            <Button
              variant="ghost"
              onClick={handleResetFilter}
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              {t("action.reset")}
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancelFilter}>
                {t("action.cancel")}
              </Button>
              <Button
                onClick={handleApplyFilter}
                className="bg-primary hover:bg-primary/90"
              >
                {t("action.apply")}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
