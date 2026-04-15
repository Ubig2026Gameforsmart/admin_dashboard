"use client";

import { BookOpen } from "lucide-react";
import { DataTable } from "@/components/dashboard/data-table";
import { type DeletedQuiz } from "@/types/trash-bin";
import { restoreQuizAction, permanentDeleteQuizAction } from "./actions";
import { useTrashTable } from "./_hooks/use-trash-table";
import { getTrashQuizColumns } from "./_components/trash-quiz-columns";
import { TrashDialogs } from "./_components/trash-dialogs";

interface TrashQuizTableProps {
  initialData: DeletedQuiz[];
}

export function TrashQuizTable({ initialData }: TrashQuizTableProps) {
  const {
    isPending,
    locale,
    t,
    restoreDialog,
    setRestoreDialog,
    deleteDialog,
    setDeleteDialog,
    handleRestore,
    handlePermanentDelete,
  } = useTrashTable<DeletedQuiz>({
    restoreAction: restoreQuizAction,
    deleteAction: permanentDeleteQuizAction,
    getItemName: (item) => item.title,
  });

  if (initialData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <BookOpen className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-lg font-medium">{t("trash.no_quizzes")}</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("trash.quizzes_desc")}
        </p>
      </div>
    );
  }

  const columns = getTrashQuizColumns(
    t,
    locale,
    initialData,
    (item) => setRestoreDialog({ open: true, item }),
    (item) => setDeleteDialog({ open: true, item, confirmText: "" })
  );

  const tableData = initialData.map((item) => ({
    id: item.id,
    title: item.title,
    category: item.category,
    questions_count: item.questions_count,
    creator: item.creator,
    deleted_at: item.deleted_at,
  }));

  return (
    <>
      <div className={isPending ? "opacity-60 pointer-events-none" : ""}>
        <DataTable
          columns={columns}
          data={tableData as Record<string, unknown>[]}
        />
      </div>

      <TrashDialogs
        t={t}
        isPending={isPending}
        restoreDialog={restoreDialog}
        restoreItemName={restoreDialog.item?.title || ""}
        onRestoreOpenChange={(open) =>
          setRestoreDialog({ open, item: restoreDialog.item })
        }
        onRestoreConfirm={handleRestore}
        onRestoreCancel={() => setRestoreDialog({ open: false, item: null })}
        deleteDialog={deleteDialog}
        onDeleteOpenChange={(open) =>
          setDeleteDialog((prev) => ({ ...prev, open, confirmText: "" }))
        }
        onDeleteConfirmTextChange={(text) =>
          setDeleteDialog((prev) => ({ ...prev, confirmText: text }))
        }
        onDeleteConfirm={handlePermanentDelete}
        onDeleteCancel={() =>
          setDeleteDialog((prev) => ({
            ...prev,
            open: false,
            confirmText: "",
          }))
        }
      />
    </>
  );
}
