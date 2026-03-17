"use client";

import {
  ChevronDown,
  MoreVertical,
  UserPen,
  Trash2,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { useState, useTransition, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

import { DataTable, StatusBadge } from "@/components/dashboard/data-table";
import { getAvatarUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SearchInput } from "@/components/shared/search-input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import {
  type Profile,
  updateProfileAction,
  deleteProfileAction,
} from "./actions";
import { useTranslation } from "@/lib/i18n";

const roleColors: Record<string, string> = {
  admin: "bg-primary/20 text-primary border-primary/30",
  manager:
    "bg-[var(--success)]/20 text-[var(--success)] border-[var(--success)]/30",
  support:
    "bg-[var(--warning)]/20 text-[var(--warning)] border-[var(--warning)]/30",
  billing: "bg-chart-2/20 text-chart-2 border-chart-2/30",
};

interface UserTableProps {
  initialData: Profile[];
}

export function UserTable({ initialData }: UserTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams(); // Kept for other potential uses or safe removal later
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const { t } = useTranslation();

  // Client-Side Filtering & Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [activeSearchQuery, setActiveSearchQuery] = useState(""); // Triggered search value
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const ITEMS_PER_PAGE = 15;

  // Filter Logic (Client-Side)
  const filteredData = useMemo(() => {
    let data = [...initialData];

    // 1. Search
    if (activeSearchQuery) {
      const lowerQuery = activeSearchQuery.toLowerCase();
      data = data.filter(
        (user) =>
          user.username?.toLowerCase().includes(lowerQuery) ||
          user.fullname?.toLowerCase().includes(lowerQuery) ||
          user.email?.toLowerCase().includes(lowerQuery),
      );
    }

    // 2. Role Filter
    if (roleFilter && roleFilter !== "all") {
      data = data.filter(
        (user) => user.role?.toLowerCase() === roleFilter.toLowerCase(),
      );
    }

    // 3. Status Filter
    if (statusFilter && statusFilter !== "all") {
      if (statusFilter === "blocked") {
        data = data.filter((user) => user.is_blocked);
      } else if (statusFilter === "active") {
        data = data.filter((user) => !user.is_blocked);
      }
    }

    return data;
  }, [initialData, activeSearchQuery, roleFilter, statusFilter]);

  // Pagination Logic (Client-Side)
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredData.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredData, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeSearchQuery, roleFilter, statusFilter]);

  // --- Dialog States (Preserved) ---
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: "role" | "status";
    id: string;
    currentValue: string;
    newValue: string;
    userName: string;
    reason: string;
  }>({
    open: false,
    type: "role",
    id: "",
    currentValue: "",
    newValue: "",
    userName: "",
    reason: "",
  });

  const [editDialog, setEditDialog] = useState<{
    open: boolean;
    id: string;
    fullname: string;
    username: string;
    role: string;
    originalRole: string;
    status: string;
    showConfirm: boolean;
  }>({
    open: false,
    id: "",
    fullname: "",
    username: "",
    role: "user",
    originalRole: "user",
    status: "active",
    showConfirm: false,
  });

  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    id: string;
    userName: string;
    confirmText: string;
  }>({
    open: false,
    id: "",
    userName: "",
    confirmText: "",
  });

  // If URL sync is needed later, we can add useEffect to push router

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openConfirmDialog = (
    type: "role" | "status",
    id: string,
    currentValue: string,
    newValue: string,
    userName: string,
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
        toast({
          title: t("msg.success"),
          description: t("users.role_updated"),
        });
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
        toast({
          title: t("msg.success"),
          description: t("users.status_updated"),
        });
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
    } else if (
      editDialog.role !== "admin" &&
      editDialog.originalRole === "admin"
    ) {
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
      toast({
        title: t("msg.success"),
        description: t("users.user_updated"),
      });
      router.refresh();
    }
    setEditDialog((prev) => ({ ...prev, open: false, showConfirm: false }));
  };

  const openDeleteDialog = (id: string, userName: string) => {
    setDeleteDialog({ open: true, id, userName, confirmText: "" });
  };

  const handleDeleteUser = async () => {
    if (deleteDialog.confirmText !== t("users.move_to_trash")) return;

    const { error } = await deleteProfileAction(deleteDialog.id);
    if (error) {
      toast({
        title: t("msg.error"),
        description: t("users.failed_delete"),
        variant: "destructive",
      });
    } else {
      toast({
        title: t("msg.success"),
        description: t("users.user_deleted"),
      });
      router.refresh();
    }
    setDeleteDialog((prev) => ({ ...prev, open: false, confirmText: "" }));
  };

  const columns = [
    {
      key: "account",
      label: t("users.account"),
      render: (_: unknown, row: Record<string, unknown>) => {
        const id = row.id as string;
        const name =
          (row.fullname as string) ||
          (row.username as string) ||
          "Unknown user";

        const rawUsername = row.username as string;
        const displayUsername =
          rawUsername && rawUsername !== "—" ? `@${rawUsername}` : "—";

        const avatar = row.avatar as string | undefined;
        return (
          <Link
            href={`/users/${id}`}
            className="flex items-center gap-3 cursor-pointer"
          >
            <Avatar className="h-9 w-9">
              <AvatarImage src={avatar} alt={name} />
              <AvatarFallback>{getInitials(name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-medium leading-tight hover:text-primary transition-colors truncate max-w-[160px]" title={name}>
                {name}
              </p>
              <p className="text-xs text-muted-foreground truncate max-w-[160px]" title={displayUsername}>{displayUsername}</p>
            </div>
          </Link>
        );
      },
    },
    {
      key: "role",
      label: t("users.role"),
      render: (value: unknown, row: Record<string, unknown>) => {
        const role = ((value as string) || "user").toLowerCase();
        const id = row.id as string;
        const userName =
          (row.fullname as string) ||
          (row.username as string) ||
          "Unknown user";

        const nextRole = role === "admin" ? "user" : "admin";

        return (
          <div
            className="cursor-pointer hover:opacity-80 flex items-center w-fit"
            onClick={() =>
              openConfirmDialog("role", id, role, nextRole, userName)
            }
          >
            <Badge
              variant="outline"
              className={
                roleColors[role] ??
                "bg-secondary text-secondary-foreground border-border"
              }
            >
              {role === "admin" ? t("users.admin") : t("users.user")}
            </Badge>
          </div>
        );
      },
    },
    {
      key: "status",
      label: t("table.status"),
      render: (value: unknown, row: Record<string, unknown>) => {
        const status = value as string;
        const id = row.id as string;
        const userName =
          (row.fullname as string) ||
          (row.username as string) ||
          "Unknown user";

        const statusStyles: Record<string, string> = {
          Active:
            "bg-[var(--success)]/20 text-[var(--success)] border-[var(--success)]/30",
          Blocked: "bg-destructive/20 text-destructive border-destructive/30",
        };

        const nextStatus = status === "Active" ? "Blocked" : "Active";

        return (
          <div
            className="cursor-pointer hover:opacity-80 flex items-center w-fit"
            onClick={() =>
              openConfirmDialog("status", id, status, nextStatus, userName)
            }
          >
            <Badge
              variant="outline"
              className={
                statusStyles[status] ||
                "bg-secondary text-secondary-foreground border-border"
              }
            >
              {status === "Active" ? t("status.active") : t("status.blocked")}
            </Badge>
          </div>
        );
      },
    },
    {
      key: "location",
      label: t("users.location"),
      render: (_: unknown, row: Record<string, unknown>) => {
        const state = (row.state as string) || "";
        const city = (row.city as string) || "";

        if (!state && !city)
          return <span className="text-muted-foreground">-</span>;

        const locationText = [state, city].filter(Boolean).join(", ");
        const encodedLocation = encodeURIComponent(locationText);

        return (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodedLocation}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium hover:underline hover:text-primary transition-colors truncate block max-w-[160px]"
            title={locationText}
            onClick={(e) => e.stopPropagation()}
          >
            {locationText}
          </a>
        );
      },
    },
    {
      key: "action",
      label: t("table.actions"),
      render: (_: unknown, row: Record<string, unknown>) => {
        const userName =
          (row.fullname as string) ||
          (row.username as string) ||
          "Unknown user";
        const id = row.id as string;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger className="focus:outline-none">
              <div className="cursor-pointer hover:opacity-80 p-1 rounded hover:bg-muted">
                <MoreVertical className="h-4 w-4 text-muted-foreground" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => openEditDialog(row)}
                className="cursor-pointer"
              >
                <UserPen className="h-4 w-4 mr-2" />
                {t("users.edit_user")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => openDeleteDialog(id, userName)}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t("users.move_to_trash")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

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

        <div className="flex items-center gap-3">
          <SearchInput
            placeholder={t("users.search")}
            onSearch={(val) => {
              setActiveSearchQuery(val);
              setCurrentPage(1);
            }}
            className="w-64 bg-background border-border"
          />

          <Select
            value={roleFilter}
            onValueChange={(value) => setRoleFilter(value)}
          >
            <SelectTrigger className="w-[170px]">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                <SelectValue placeholder={t("users.role")} />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("users.all_roles")}</SelectItem>
              <SelectItem value="user">{t("users.user")}</SelectItem>
              <SelectItem value="admin">{t("users.admin")}</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value)}
          >
            <SelectTrigger className="w-[170px]">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                <SelectValue placeholder={t("table.status")} />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("users.all_status")}</SelectItem>
              <SelectItem value="active">{t("status.active")}</SelectItem>
              <SelectItem value="blocked">{t("status.blocked")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
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

      {/* Confirm Dialog */}
      <Dialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{t("users.confirm_change")}</DialogTitle>
            <DialogDescription>
              {t("users.confirm_change_desc")}{" "}
              {confirmDialog.type === "role"
                ? t("users.role").toLowerCase()
                : t("table.status").toLowerCase()}{" "}
              {t("users.from")} <strong>{confirmDialog.userName}</strong>{" "}
              {t("users.from")} <strong>{confirmDialog.currentValue}</strong>{" "}
              {t("users.to")} <strong>{confirmDialog.newValue}</strong>?
            </DialogDescription>
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
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setConfirmDialog((prev) => ({ ...prev, open: false }))
              }
            >
              {t("action.cancel")}
            </Button>
            <Button onClick={handleConfirm}>{t("action.change")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
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

      {/* Delete Dialog */}
      <Dialog
        open={deleteDialog.open}
        onOpenChange={(open) =>
          setDeleteDialog((prev) => ({ ...prev, open, confirmText: "" }))
        }
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="text-destructive">
              {t("users.move_trash_title")}
            </DialogTitle>
            <DialogDescription>
              {t("users.move_trash_desc")}{" "}
              <strong>{deleteDialog.userName}</strong>{" "}
              {t("users.move_trash_desc2")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-4">
            <Label htmlFor="confirmDelete">
              {t("users.type_confirm")}{" "}
              <strong className="text-destructive">
                {t("users.move_to_trash")}
              </strong>{" "}
              {t("users.to_confirm")}
            </Label>
            <Input
              id="confirmDelete"
              value={deleteDialog.confirmText}
              onChange={(e) =>
                setDeleteDialog((prev) => ({
                  ...prev,
                  confirmText: e.target.value,
                }))
              }
              placeholder={`${t("users.type_confirm")} '${t(
                "users.move_to_trash",
              )}'`}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setDeleteDialog((prev) => ({
                  ...prev,
                  open: false,
                  confirmText: "",
                }))
              }
            >
              {t("action.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={deleteDialog.confirmText !== t("users.move_to_trash")}
            >
              {t("users.move_to_trash")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatRole(role: string) {
  return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
}
