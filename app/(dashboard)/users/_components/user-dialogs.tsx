"use client";

import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import { ConfirmActionDialog } from "@/components/shared/confirm-action-dialog";

export interface ConfirmDialogState {
  open: boolean;
  type: "role" | "status";
  id: string;
  currentValue: string;
  newValue: string;
  userName: string;
  reason: string;
}

export interface EditDialogState {
  open: boolean;
  id: string;
  fullname: string;
  username: string;
  role: string;
  originalRole: string;
  status: string;
  showConfirm: boolean;
}

export interface DeleteDialogState {
  open: boolean;
  id: string;
  userName: string;
  confirmText?: string;
}

interface UserDialogsProps {
  confirmDialog: ConfirmDialogState;
  setConfirmDialog: React.Dispatch<React.SetStateAction<ConfirmDialogState>>;
  handleConfirm: () => void;
  
  editDialog: EditDialogState;
  setEditDialog: React.Dispatch<React.SetStateAction<EditDialogState>>;
  handleEditSave: () => void;
  
  deleteDialog: DeleteDialogState;
  setDeleteDialog: React.Dispatch<React.SetStateAction<DeleteDialogState>>;
  handleDeleteUser: () => void;
}

export function UserDialogs({
  confirmDialog,
  setConfirmDialog,
  handleConfirm,
  editDialog,
  setEditDialog,
  handleEditSave,
  deleteDialog,
  setDeleteDialog,
  handleDeleteUser,
}: UserDialogsProps) {
  const { t } = useTranslation();

  return (
    <>
      <ConfirmActionDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}
        title={t("users.confirm_change")}
        description={
          <>
            {t("users.confirm_change_desc")}{" "}
            {confirmDialog.type === "role"
              ? t("users.role").toLowerCase()
              : t("table.status").toLowerCase()}{" "}
            {t("users.from")} <strong>{confirmDialog.userName}</strong>{" "}
            {t("users.from")} <strong>{confirmDialog.currentValue}</strong>{" "}
            {t("users.to")} <strong>{confirmDialog.newValue}</strong>?
          </>
        }
        onConfirm={handleConfirm}
        confirmText={t("action.change")}
      >
        {confirmDialog.type === "status" && (
          <div className="grid gap-2 py-2">
            <Label>{t("users.reason_label")}</Label>
            <Textarea
              value={confirmDialog.reason}
              onChange={(e) =>
                setConfirmDialog((prev) => ({
                  ...prev,
                  reason: e.target.value,
                }))
              }
              placeholder={t("users.reason_placeholder")}
              className="h-24 resize-none"
            />
          </div>
        )}
      </ConfirmActionDialog>

      <Dialog
        open={editDialog.open}
        onOpenChange={(open) =>
          setEditDialog((prev) => ({ ...prev, open, showConfirm: false }))
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editDialog.showConfirm
                ? t("users.confirm_changes")
                : t("users.edit_user")}
            </DialogTitle>
            {editDialog.showConfirm && (
              <DialogDescription>
                {t("users.confirm_save_desc")}
              </DialogDescription>
            )}
          </DialogHeader>
          {!editDialog.showConfirm ? (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="fullname">{t("users.full_name")}</Label>
                <Input
                  id="fullname"
                  value={editDialog.fullname}
                  onChange={(e) =>
                    setEditDialog((prev) => ({
                      ...prev,
                      fullname: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="username">{t("users.username")}</Label>
                <Input
                  id="username"
                  value={editDialog.username}
                  onChange={(e) =>
                    setEditDialog((prev) => ({
                      ...prev,
                      username: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="role">{t("users.role")}</Label>
                  <Select
                    value={editDialog.role}
                    onValueChange={(value) =>
                      setEditDialog((prev) => ({ ...prev, role: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">{t("users.user")}</SelectItem>
                      <SelectItem value="admin">{t("users.admin")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status">{t("table.status")}</Label>
                  <Select
                    value={editDialog.status}
                    onValueChange={(value) =>
                      setEditDialog((prev) => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">
                        {t("status.active")}
                      </SelectItem>
                      <SelectItem value="blocked">
                        {t("status.blocked")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setEditDialog((prev) => ({
                  ...prev,
                  open: false,
                  showConfirm: false,
                }))
              }
            >
              {t("action.cancel")}
            </Button>
            <Button onClick={handleEditSave}>
              {editDialog.showConfirm ? t("users.yes_save") : t("action.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={deleteDialog.open}
        onOpenChange={(open) =>
          setDeleteDialog((prev) => ({ ...prev, open, confirmText: "" }))
        }
        title={t("users.move_trash_title")}
        description={
          <>
            {t("users.move_trash_desc")} <strong>{deleteDialog.userName}</strong> {t("users.move_trash_desc2")}
          </>
        }
        expectedText={t("users.move_to_trash")}
        onConfirm={handleDeleteUser}
      />
    </>
  );
}
