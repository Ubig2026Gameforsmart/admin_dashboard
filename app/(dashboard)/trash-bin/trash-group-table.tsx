"use client";

import { Users } from "lucide-react";
import { DataTable } from "@/components/dashboard/data-table";
import { type DeletedGroup } from "@/types/trash-bin";
import { restoreGroupAction, permanentDeleteGroupAction } from "./actions";
import { useTrashTable } from "./_hooks/use-trash-table";
import { getTrashGroupColumns } from "./_components/trash-group-columns";
import { TrashDialogs } from "./_components/trash-dialogs";

interface TrashGroupTableProps {
  initialData: DeletedGroup[];
}

export function TrashGroupTable({ initialData }: TrashGroupTableProps) {
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
  } = useTrashTable<DeletedGroup>({
    restoreAction: restoreGroupAction,
    deleteAction: permanentDeleteGroupAction,
    getItemName: (item) => item.name,
  });

  if (initialData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Users className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-lg font-medium">{t("trash.no_groups")}</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("trash.groups_desc")}
        </p>
      </div>
    );
  }

  const columns = getTrashGroupColumns(
    t,
    locale,
    initialData,
    (item) => setRestoreDialog({ open: true, item }),
    (item) => setDeleteDialog({ open: true, item, confirmText: "" })
  );

  const tableData = initialData.map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description,
    avatar_url: item.avatar_url,
    member_count: item.member_count,
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
        restoreItemName={restoreDialog.item?.name || ""}
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
