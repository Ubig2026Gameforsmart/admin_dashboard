import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from "@/lib/i18n";

interface UseTrashTableOptions<T> {
  restoreAction: (id: string) => Promise<{ error: string | null }>;
  deleteAction: (id: string) => Promise<{ error: string | null }>;
  getItemName: (item: T) => string;
}

export function useTrashTable<T extends { id: string }>(
  options: UseTrashTableOptions<T>
) {
  const router = useRouter();
  const { toast } = useToast();
  const { t, locale } = useTranslation();
  const [isPending, startTransition] = useTransition();

  const [restoreDialog, setRestoreDialog] = useState<{
    open: boolean;
    item: T | null;
  }>({
    open: false,
    item: null,
  });

  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    item: T | null;
    confirmText: string;
  }>({
    open: false,
    item: null,
    confirmText: "",
  });

  const handleRestore = async () => {
    if (!restoreDialog.item) return;

    const { error } = await options.restoreAction(restoreDialog.item.id);

    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
    } else {
      toast({
        title: t("trash.restore_success"),
        description: `"${options.getItemName(restoreDialog.item)}" has been restored.`,
      });
      startTransition(() => router.refresh());
    }
    setRestoreDialog({ open: false, item: null });
  };

  const handlePermanentDelete = async () => {
    if (
      !deleteDialog.item ||
      deleteDialog.confirmText !== t("trash.delete_confirm_text")
    )
      return;

    const { error } = await options.deleteAction(deleteDialog.item.id);

    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
    } else {
      toast({
        title: t("trash.delete_success"),
        description: `"${options.getItemName(deleteDialog.item)}" has been permanently deleted.`,
        variant: "destructive",
      });
      startTransition(() => router.refresh());
    }
    setDeleteDialog({ open: false, item: null, confirmText: "" });
  };

  return {
    isPending,
    locale,
    t,
    restoreDialog,
    setRestoreDialog,
    deleteDialog,
    setDeleteDialog,
    handleRestore,
    handlePermanentDelete,
  };
}

// Shared utility functions
export function getDaysUntilPermanentDelete(deletedAt: string): number {
  const deletedDate = new Date(deletedAt);
  const permanentDeleteDate = new Date(
    deletedDate.getTime() + 7 * 24 * 60 * 60 * 1000
  );
  const now = new Date();
  const diffTime = permanentDeleteDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

export function formatDeletedDate(dateStr: string, localeCode: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString(localeCode === "id" ? "id-ID" : "en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
