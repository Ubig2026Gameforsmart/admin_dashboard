"use client";

import { useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n";
import { Category } from "@/types/category";
import { saveCategoryAction, toggleCategoryStatusAction } from "../actions";
import { usePagination } from "@/hooks/use-pagination";

export interface CategoryEditDialogState {
  open: boolean;
  category: Category | null;
  formData: {
    name: string;
    status: string;
  };
}

export function useCategoryTable(initialData: Category[]) {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [editDialog, setEditDialog] = useState<CategoryEditDialogState>({
    open: false,
    category: null,
    formData: { name: "", status: "active" },
  });

  const filteredData = useMemo(() => {
    return initialData.filter((c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [initialData, searchQuery]);

  const {
    currentPage,
    setCurrentPage,
    paginatedData,
    totalPages,
    handlePageChange,
  } = usePagination(filteredData, 15);

  const handleOpenDialog = (cat?: Category) => {
    if (cat) {
      setEditDialog({
        open: true,
        category: cat,
        formData: { name: cat.name, status: cat.status },
      });
    } else {
      setEditDialog({
        open: true,
        category: null,
        formData: { name: "", status: "active" },
      });
    }
  };

  const handleSave = async () => {
    if (!editDialog.formData.name.trim()) return;

    setIsSaving(true);
    const { error } = await saveCategoryAction(
      editDialog.category?.id || null,
      {
        name: editDialog.formData.name,
        status: editDialog.formData.status,
      }
    );

    setIsSaving(false);

    if (error) {
      toast({
        title: t("msg.error") || "Error",
        description: error,
        variant: "destructive",
      });
    } else {
      toast({
        title: t("msg.success") || "Success",
        description: `Category ${editDialog.category ? "updated" : "created"} successfully.`,
      });
      setEditDialog((prev) => ({ ...prev, open: false }));
    }
  };

  const handleToggleStatus = async (cat: Category) => {
    const { error, newStatus } = await toggleCategoryStatusAction(cat.id, cat.status);
    if (error) {
      toast({
        title: t("msg.error") || "Error",
        description: error,
        variant: "destructive",
      });
    } else {
      toast({
        title: t("msg.success") || "Success",
        description: `Category ${newStatus === "active" ? "activated" : "deactivated"} successfully.`,
      });
    }
  };

  return {
    t,
    searchQuery,
    setSearchQuery,
    currentPage,
    paginatedData,
    totalPages,
    handlePageChange,
    editDialog,
    setEditDialog,
    handleOpenDialog,
    handleSave,
    handleToggleStatus,
    isSaving,
  };
}
