"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";

import { DataTable } from "@/components/dashboard/data-table";
import { SearchInput } from "@/components/shared/search-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type Report } from "@/types/report";import { useTranslation } from "@/lib/i18n";

import { useReportsTable } from "./_hooks/use-reports-table";
import { getReportColumns } from "./_components/report-columns";
import { ReportDialogs } from "./_components/report-dialogs";

interface ReportTableProps {
  initialData: Report[];
}

export function ReportTable({ initialData }: ReportTableProps) {
  const router = useRouter();
  const [isPending] = useTransition();
  const { t } = useTranslation();

  const {
    currentPage,
    totalPages,
    activeSearchQuery,
    setActiveSearchQuery,
    statusFilter,
    setStatusFilter,
    typeFilter,
    tableData,
    handlePageChange,
    confirmDialog,
    setConfirmDialog,
    openConfirmDialog,
    handleConfirm,
    detailDialog,
    setDetailDialog,
    deleteDialog,
    setDeleteDialog,
    handleDeleteReport,
    notesDialog,
    setNotesDialog,
    handleSaveNotes,
  } = useReportsTable(initialData);

  const columns = getReportColumns(
    t,
    openConfirmDialog,
    setNotesDialog,
    setDeleteDialog
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {t("reports.title")}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <SearchInput
            placeholder={t("reports.search")}
            onSearch={(val) => {
              setActiveSearchQuery(val);
              handlePageChange(1);
            }}
            value={activeSearchQuery}
            className="w-full sm:w-64 bg-background border-border"
          />

          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value)}
          >
            <SelectTrigger className="w-[180px]">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                <SelectValue placeholder={t("table.status")} />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("filter.all_status")}</SelectItem>
              <SelectItem value="pending">{t("status.pending")}</SelectItem>
              <SelectItem value="in_progress">
                {t("status.in_progress")}
              </SelectItem>
              <SelectItem value="resolved">{t("status.resolved")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className={isPending ? "opacity-60 pointer-events-none" : ""}>
        <DataTable
          columns={columns}
          data={tableData as Record<string, unknown>[]}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          onRowClick={(row) => router.push(`/reports/${row.id}`)}
        />
      </div>

      <ReportDialogs
        confirmDialog={confirmDialog}
        setConfirmDialog={setConfirmDialog}
        handleConfirm={handleConfirm}
        detailDialog={detailDialog}
        setDetailDialog={setDetailDialog}
        notesDialog={notesDialog}
        setNotesDialog={setNotesDialog}
        handleSaveNotes={handleSaveNotes}
        deleteDialog={deleteDialog}
        setDeleteDialog={setDeleteDialog}
        handleDeleteReport={handleDeleteReport}
      />
    </div>
  );
}
