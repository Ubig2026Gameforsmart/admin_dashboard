"use client";

import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { CategoryEditDialogState } from "../_hooks/use-category-table";

interface CategoryDialogsProps {
  editDialog: CategoryEditDialogState;
  setEditDialog: React.Dispatch<React.SetStateAction<CategoryEditDialogState>>;
  handleSave: () => void;
  isSaving: boolean;
}

export function CategoryDialogs({
  editDialog,
  setEditDialog,
  handleSave,
  isSaving,
}: CategoryDialogsProps) {
  const { t } = useTranslation();

  return (
    <Dialog
      open={editDialog.open}
      onOpenChange={(open) => setEditDialog((prev) => ({ ...prev, open }))}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {editDialog.category
              ? t("action.edit") + " " + (t("nav.competition_category") || "Category")
              : t("action.add") + " " + (t("nav.competition_category") || "Category")}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">
              {t("table.name") || "Name"} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={editDialog.formData.name}
              onChange={(e) =>
                setEditDialog((prev) => ({
                  ...prev,
                  formData: { ...prev.formData, name: e.target.value },
                }))
              }
              placeholder="e.g. E-Sports"
            />
          </div>
          {editDialog.category && (
            <div className="grid gap-2">
              <Label>{t("table.status") || "Status"}</Label>
              <Select
                value={editDialog.formData.status}
                onValueChange={(val) =>
                  setEditDialog((prev) => ({
                    ...prev,
                    formData: { ...prev.formData, status: val },
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{t("status.active") || "Active"}</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setEditDialog((prev) => ({ ...prev, open: false }))}
            disabled={isSaving}
          >
            {t("action.cancel") || "Cancel"}
          </Button>
          <Button
            onClick={handleSave}
            disabled={!editDialog.formData.name.trim() || isSaving}
          >
            {isSaving ? t("msg.loading") || "Saving..." : t("action.save") || "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
