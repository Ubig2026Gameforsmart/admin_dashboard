"use client";

import { FileQuestion, SlidersHorizontal } from "lucide-react";
import { format } from "date-fns";
import { DataTable } from "@/components/dashboard/data-table";
import { useTranslation } from "@/lib/i18n";

import { SearchInput } from "@/components/shared/search-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { QuizApproval } from "@/types/quiz-approval";

import { useQuizApprovalTable } from "./_hooks/use-quiz-approval-table";
import { getQuizApprovalColumns } from "./_components/quiz-approval-columns";
import { QuizApprovalDialogs } from "./_components/quiz-approval-dialogs";

interface QuizApprovalTableProps {
  initialData: QuizApproval[];
  totalPages: number;
  currentPage: number;
  totalCount: number;
  searchQuery: string;
  categories: string[];
  categoryFilter: string;
}

export function QuizApprovalTable({
  initialData,
  totalPages,
  currentPage,
  searchQuery,
  categories,
  categoryFilter,
}: QuizApprovalTableProps) {
  const {
    t,
    router,
    isPending,
    rejectionTemplates,
    selectedReasons,
    setSelectedReasons,
    rejectionNote,
    setRejectionNote,
    approveDialog,
    setApproveDialog,
    handleApprove,
    executeApprove,
    rejectDialog,
    setRejectDialog,
    handleReject,
    executeReject,
    updateUrl,
    handlePageChange,
  } = useQuizApprovalTable(searchQuery, categoryFilter);

  const columns = getQuizApprovalColumns({
    t,
    handleApprove,
    handleReject,
  });

  const tableData = initialData.map((quiz) => ({
    id: quiz.id,
    title: quiz.title,
    creator: quiz.creator,
    category: quiz.category ?? "-",
    questions: Array.isArray(quiz.questions) ? quiz.questions.length : 0,
    language: quiz.language ?? "ID",
    createdAt: quiz.created_at
      ? format(new Date(quiz.created_at), "d MMM yyyy")
      : "-",
    actions: null,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {t("page.quiz_approval")}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <SearchInput
            placeholder={t("approval.search")}
            value={searchQuery}
            onSearch={(val) => updateUrl({ search: val, page: 1 })}
            className="w-64 bg-background border-border"
          />

          <Select
            value={categoryFilter}
            onValueChange={(value) => updateUrl({ category: value, page: 1 })}
          >
            <SelectTrigger className="w-[180px]">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                <SelectValue placeholder={t("table.category")} />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("quiz.all_category")}</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {t(`category.${cat.toLowerCase().replace(/\s+/g, "_")}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className={isPending ? "opacity-60 pointer-events-none" : ""}>
        {initialData.length > 0 ? (
          <DataTable
            columns={columns}
            data={tableData as Record<string, unknown>[]}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            onRowClick={(row) => router.push(`/quiz-approval/${row.id}`)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border rounded-xl bg-card">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <FileQuestion className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-base font-medium text-foreground mb-1">
              {t("approval.no_pending")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery
                ? t("approval.no_match")
                : t("approval.all_reviewed")}
            </p>
          </div>
        )}
      </div>

      <QuizApprovalDialogs
        approveDialog={approveDialog}
        setApproveDialog={setApproveDialog}
        executeApprove={executeApprove}
        rejectDialog={rejectDialog}
        setRejectDialog={setRejectDialog}
        executeReject={executeReject}
        rejectionTemplates={rejectionTemplates}
        selectedReasons={selectedReasons}
        setSelectedReasons={setSelectedReasons}
        rejectionNote={rejectionNote}
        setRejectionNote={setRejectionNote}
      />
    </div>
  );
}
