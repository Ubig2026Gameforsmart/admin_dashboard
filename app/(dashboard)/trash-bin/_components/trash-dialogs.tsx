import { RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface TrashDialogsProps {
  t: (key: string) => string;
  isPending: boolean;
  // Restore dialog
  restoreDialog: { open: boolean; item: { id: string } | null };
  restoreItemName: string;
  onRestoreOpenChange: (open: boolean) => void;
  onRestoreConfirm: () => void;
  onRestoreCancel: () => void;
  // Delete dialog
  deleteDialog: { open: boolean; item: { id: string } | null; confirmText: string };
  onDeleteOpenChange: (open: boolean) => void;
  onDeleteConfirmTextChange: (text: string) => void;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
}

export function TrashDialogs({
  t,
  isPending,
  restoreDialog,
  restoreItemName,
  onRestoreOpenChange,
  onRestoreConfirm,
  onRestoreCancel,
  deleteDialog,
  onDeleteOpenChange,
  onDeleteConfirmTextChange,
  onDeleteConfirm,
  onDeleteCancel,
}: TrashDialogsProps) {
  return (
    <>
      {/* Restore Dialog */}
      <Dialog open={restoreDialog.open} onOpenChange={onRestoreOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("trash.restore_title")}</DialogTitle>
            <DialogDescription>
              {t("trash.restore_desc")} &quot;{restoreItemName}&quot;?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={onRestoreCancel}>
              {t("action.cancel")}
            </Button>
            <Button onClick={onRestoreConfirm} disabled={isPending}>
              <RotateCcw className="mr-2 h-4 w-4" />
              {t("action.restore")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Permanently Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={onDeleteOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">
              {t("trash.delete_permanent_title")}
            </DialogTitle>
            <DialogDescription>
              {t("trash.delete_permanent_desc")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-4">
            <Label htmlFor="confirmDelete">
              {t("trash.type_confirm")}{" "}
              <strong className="text-destructive">
                {t("trash.delete_confirm_text")}
              </strong>{" "}
              {t("trash.to_confirm")}
            </Label>
            <Input
              id="confirmDelete"
              value={deleteDialog.confirmText}
              onChange={(e) => onDeleteConfirmTextChange(e.target.value)}
              placeholder={t("trash.delete_confirm_text")}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onDeleteCancel}>
              {t("action.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={onDeleteConfirm}
              disabled={
                deleteDialog.confirmText !== t("trash.delete_confirm_text") ||
                isPending
              }
            >
              {t("trash.delete_permanent_title")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
