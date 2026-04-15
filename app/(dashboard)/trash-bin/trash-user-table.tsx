"use client";

import { User } from "lucide-react";
import { DataTable } from "@/components/dashboard/data-table";
import { type DeletedUser } from "@/types/trash-bin";
import { restoreUserAction, permanentDeleteUserAction } from "./actions";
import { useTrashTable } from "./_hooks/use-trash-table";
import { getTrashUserColumns } from "./_components/trash-user-columns";
import { TrashDialogs } from "./_components/trash-dialogs";

interface TrashUserTableProps {
  initialData: DeletedUser[];
}

export function TrashUserTable({ initialData }: TrashUserTableProps) {
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
  } = useTrashTable<DeletedUser>({
    restoreAction: restoreUserAction,
    deleteAction: permanentDeleteUserAction,
    getItemName: (item) => item.fullname || item.username || "Unknown",
  });

  if (initialData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <User className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-lg font-medium">{t("trash.no_users")}</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("trash.users_desc")}
        </p>
      </div>
    );
  }

  const columns = getTrashUserColumns(
    t,
    locale,
    initialData,
    (item) => setRestoreDialog({ open: true, item }),
    (item) => setDeleteDialog({ open: true, item, confirmText: "" })
  );

  const tableData = initialData.map((item) => ({
    id: item.id,
    fullname: item.fullname,
    username: item.username,
    email: item.email,
    avatar_url: item.avatar_url,
    role: item.role,
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
        restoreItemName={
          restoreDialog.item?.fullname ||
          restoreDialog.item?.username ||
          ""
        }
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
