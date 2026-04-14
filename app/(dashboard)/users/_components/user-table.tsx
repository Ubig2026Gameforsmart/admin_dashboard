"use client";

import { useTransition } from "react";
import { DataTable } from "@/components/dashboard/data-table";
import { getAvatarUrl } from "@/lib/utils";
import { Profile } from "@/types/user";

import { UserFilters } from "./user-filters";
import { UserDialogs } from "./user-dialogs";
import { getUserColumns } from "./user-columns";
import { useUsersTable } from "../_hooks/use-users-table";

interface UserTableProps {
  initialData: Profile[];
}

export function UserTable({ initialData }: UserTableProps) {
  const [isPending] = useTransition();

  const {
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
  } = useUsersTable(initialData);

  const columns = getUserColumns({
    t,
    openConfirmDialog,
    openEditDialog,
    openDeleteDialog,
  });

  const tableData = paginatedData.map((profile) => ({
    id: profile.id,
    account: profile.id,
    avatar: getAvatarUrl(profile.avatar_url),
    fullname: profile.fullname,
    username: profile.username ?? "—",
    email: profile.email,
    role: profile.role ?? "user",
    status: profile.is_blocked ? "Blocked" : "Active",
    state: profile.state?.name,
    city: profile.city?.name,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {t("users.title")}
          </h1>
        </div>

        <UserFilters
          roleFilter={roleFilter}
          setRoleFilter={setRoleFilter}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          onSearch={(val) => {
            setActiveSearchQuery(val);
            setCurrentPage(1);
          }}
        />
      </div>

      <div className={isPending ? "opacity-60 pointer-events-none" : ""}>
        <DataTable
          columns={columns}
          data={tableData as Record<string, unknown>[]}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>

      <UserDialogs
        confirmDialog={confirmDialog}
        setConfirmDialog={setConfirmDialog}
        handleConfirm={handleConfirm}
        editDialog={editDialog}
        setEditDialog={setEditDialog}
        handleEditSave={handleEditSave}
        deleteDialog={deleteDialog}
        setDeleteDialog={setDeleteDialog}
        handleDeleteUser={handleDeleteUser}
      />
    </div>
  );
}
