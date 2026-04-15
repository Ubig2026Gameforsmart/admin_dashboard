"use client";

import Link from "next/link";
import { MoreVertical, UserPen, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getAvatarUrl } from "@/lib/utils";

const roleColors: Record<string, string> = {
  admin: "bg-primary/20 text-primary border-primary/30",
  manager:
    "bg-[var(--success)]/20 text-[var(--success)] border-[var(--success)]/30",
  support:
    "bg-[var(--warning)]/20 text-[var(--warning)] border-[var(--warning)]/30",
  billing: "bg-chart-2/20 text-chart-2 border-chart-2/30",
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

interface ColumnProps {
  t: (key: string) => string;
  openConfirmDialog: (
    type: "role" | "status",
    id: string,
    currentValue: string,
    newValue: string,
    userName: string
  ) => void;
  openEditDialog: (row: Record<string, unknown>) => void;
  openDeleteDialog: (id: string, userName: string) => void;
}

export function getUserColumns({
  t,
  openConfirmDialog,
  openEditDialog,
  openDeleteDialog,
}: ColumnProps) {
  return [
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
}
