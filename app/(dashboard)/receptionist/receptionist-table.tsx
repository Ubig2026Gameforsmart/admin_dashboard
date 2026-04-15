"use client";

import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { useTranslation } from "@/lib/i18n";

import { SearchInput } from "@/components/shared/search-input";
import { DataTable } from "@/components/dashboard/data-table";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

import { type Competition } from "@/types/receptionist";
import { useReceptionistTable } from "./_hooks/use-receptionist-table";
import { getReceptionistColumns } from "./_components/receptionist-columns";

interface ReceptionistTableProps {
  initialData: Competition[];
  initialError: string | null;
}

export function ReceptionistTable({
  initialData,
  initialError,
}: ReceptionistTableProps) {
  const router = useRouter();
  const { t } = useTranslation();

  const {
    isPending,
    searchQuery,
    setSearchQuery,
    previewPoster,
    setPreviewPoster,
    currentPage,
    paginatedData,
    totalPages,
    handlePageChange,
  } = useReceptionistTable(initialData);

  const columns = getReceptionistColumns(t, setPreviewPoster);

  const tableData = paginatedData.map((comp) => {
    const catLabels = comp.category
      ? comp.category
          .split(",")
          .map((c: string) => c.trim())
          .join(", ")
      : null;
    const scheduleStart = comp.registration_start_date
      ? format(new Date(comp.registration_start_date), "d MMM yyyy")
      : "\u2014";
    const scheduleEnd =
      comp.final_end_date || comp.registration_end_date
        ? format(
            new Date(comp.final_end_date || comp.registration_end_date),
            "d MMM yyyy"
          )
        : "\u2014";

    return {
      id: comp.id,
      poster: null,
      poster_url: comp.poster_url,
      title: comp.title,
      categoryDisplay: catLabels,
      status: comp.status,
      schedule: `${scheduleStart} \u2014 ${scheduleEnd}`,
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">
          {t("nav.receptionist") || "Receptionist"}
        </h1>
        <div className="flex items-center gap-3">
          <SearchInput
            placeholder={
              t("manage_competitions.search_placeholder") ||
              "Search by title..."
            }
            value={searchQuery}
            onSearch={(val) => {
              setSearchQuery(val);
            }}
            className="w-64 bg-background border-border"
          />
        </div>
      </div>

      {initialError && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20">
          {initialError}
        </div>
      )}

      {/* Table */}
      <div className={isPending ? "opacity-60 pointer-events-none" : ""}>
        <DataTable
          columns={columns}
          data={tableData as Record<string, unknown>[]}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          onRowClick={(row) => router.push(`/receptionist/${row.id as string}`)}
        />
      </div>

      {/* Poster Preview Dialog */}
      <Dialog
        open={!!previewPoster}
        onOpenChange={() => setPreviewPoster(null)}
      >
        <DialogContent className="max-w-lg p-2">
          <DialogTitle className="sr-only">Poster Preview</DialogTitle>
          {previewPoster && (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium px-2 pt-2">
                {previewPoster.title}
              </p>
              <img
                src={previewPoster.url}
                alt={previewPoster.title}
                className="w-full rounded-md object-contain max-h-[70vh]"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
