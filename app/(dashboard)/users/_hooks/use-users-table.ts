"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from "@/lib/i18n";
import { Profile } from "@/types/user";
import { updateProfileAction, deleteProfileAction } from "../actions";
import {
  ConfirmDialogState,
  EditDialogState,
  DeleteDialogState,
} from "../_components/user-dialogs";
import { usePagination } from "@/hooks/use-pagination";

export function useUsersTable(initialData: Profile[]) {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useTranslation();

  // Client-Side Filtering State
  const [activeSearchQuery, setActiveSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Filter Logic
  const filteredData = useMemo(() => {
    let data = [...initialData];

    if (activeSearchQuery) {
      const lowerQuery = activeSearchQuery.toLowerCase();
      data = data.filter(
        (user) =>
          user.username?.toLowerCase().includes(lowerQuery) ||
          user.fullname?.toLowerCase().includes(lowerQuery) ||
          user.email?.toLowerCase().includes(lowerQuery)
      );
    }

    if (roleFilter && roleFilter !== "all") {
      data = data.filter(
        (user) => user.role?.toLowerCase() === roleFilter.toLowerCase()
      );
    }

    if (statusFilter && statusFilter !== "all") {
      if (statusFilter === "blocked") {
        data = data.filter((user) => user.is_blocked);
      } else if (statusFilter === "active") {
        data = data.filter((user) => !user.is_blocked);
      }
    }

    return data;
  }, [initialData, activeSearchQuery, roleFilter, statusFilter]);

  // Global Pagination Hook (replaces local logic)
  const {
    currentPage,
    setCurrentPage,
    paginatedData,
    totalPages,
    handlePageChange,
  } = usePagination(filteredData, 15);

  // Reset to first page when filtering
  useEffect(() => {
    setCurrentPage(1);
  }, [activeSearchQuery, roleFilter, statusFilter, setCurrentPage]);

  // --- Dialog States ---
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    open: false,
    type: "role",
    id: "",
    currentValue: "",
    newValue: "",
    userName: "",
    reason: "",
  });

  const [editDialog, setEditDialog] = useState<EditDialogState>({
    open: false,
    id: "",
    fullname: "",
    username: "",
    role: "user",
    originalRole: "user",
    status: "active",
    showConfirm: false,
  });

  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState>({
    open: false,
    id: "",
    userName: "",
    confirmText: "",
  });

  // --- Handlers ---
  const openConfirmDialog = (
    type: "role" | "status",
    id: string,
    currentValue: string,
    newValue: string,
    userName: string
  ) => {
    setConfirmDialog({
      open: true,
      type,
      id,
      currentValue,
      newValue,
      userName,
      reason: "",
    });
  };

  const handleConfirm = async () => {
    if (confirmDialog.type === "role") {
      const isAdmin = confirmDialog.newValue === "admin";
      const { error } = await updateProfileAction(confirmDialog.id, {
        role: confirmDialog.newValue,
        admin_since: isAdmin ? new Date().toISOString() : null,
      });
      if (error) {
        toast({
          title: t("msg.error"),
          description: t("users.failed_update_role"),
          variant: "destructive",
        });
      } else {
        toast({ title: t("msg.success"), description: t("users.role_updated") });
        router.refresh();
      }
    } else {
      const isBlocked = confirmDialog.newValue === "Blocked";
      const { error } = await updateProfileAction(confirmDialog.id, {
        is_blocked: isBlocked,
        blocked_at: isBlocked ? new Date().toISOString() : null,
      });
      if (error) {
        toast({
          title: t("msg.error"),
          description: t("users.failed_update_status"),
          variant: "destructive",
        });
      } else {
        toast({ title: t("msg.success"), description: t("users.status_updated") });
        router.refresh();
      }
    }
    setConfirmDialog((prev) => ({ ...prev, open: false }));
  };

  const openEditDialog = (row: Record<string, unknown>) => {
    const role = ((row.role as string) || "user").toLowerCase();
    setEditDialog({
      open: true,
      id: row.id as string,
      fullname: (row.fullname as string) || "",
      username: (row.username as string) || "",
      role: role,
      originalRole: role,
      status: (row.status as string) === "Blocked" ? "blocked" : "active",
      showConfirm: false,
    });
  };

  const handleEditSave = async () => {
    if (!editDialog.showConfirm) {
      setEditDialog((prev) => ({ ...prev, showConfirm: true }));
      return;
    }

    const isBlocked = editDialog.status === "blocked";
    const updates: Partial<Profile> = {
      fullname: editDialog.fullname,
      username: editDialog.username,
      role: editDialog.role,
      is_blocked: isBlocked,
      blocked_at: isBlocked ? new Date().toISOString() : null,
    };

    if (editDialog.role === "admin" && editDialog.originalRole !== "admin") {
      updates.admin_since = new Date().toISOString();
    } else if (editDialog.role !== "admin" && editDialog.originalRole === "admin") {
      updates.admin_since = null;
    }

    const { error } = await updateProfileAction(editDialog.id, updates);

    if (error) {
      toast({
        title: t("msg.error"),
        description: t("users.failed_save"),
        variant: "destructive",
      });
    } else {
      toast({ title: t("msg.success"), description: t("users.user_updated") });
      router.refresh();
    }
    setEditDialog((prev) => ({ ...prev, open: false, showConfirm: false }));
  };

  const openDeleteDialog = (id: string, userName: string) => {
    setDeleteDialog({ open: true, id, userName, confirmText: "" });
  };

  const handleDeleteUser = async () => {
    const { error } = await deleteProfileAction(deleteDialog.id);
    if (error) {
      toast({
        title: t("msg.error"),
        description: t("users.failed_delete"),
        variant: "destructive",
      });
    } else {
      toast({ title: t("msg.success"), description: t("users.user_deleted") });
      router.refresh();
    }
    setDeleteDialog((prev) => ({ ...prev, open: false, confirmText: "" }));
  };

  return {
    t,
    currentPage,
    setCurrentPage,
    roleFilter,
    setRoleFilter,
    statusFilter,
    setStatusFilter,
    setActiveSearchQuery,
    paginatedData,
    totalPages,
    handlePageChange,
    confirmDialog,
    setConfirmDialog,
    openConfirmDialog,
    handleConfirm,
    editDialog,
    setEditDialog,
    openEditDialog,
    handleEditSave,
    deleteDialog,
    setDeleteDialog,
    openDeleteDialog,
    handleDeleteUser,
  };
}
