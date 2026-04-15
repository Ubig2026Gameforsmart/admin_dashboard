import { RotateCcw, Trash2, Clock, MoreVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getAvatarUrl } from "@/lib/utils";
import { type DeletedUser } from "@/types/trash-bin";
import { getDaysUntilPermanentDelete, formatDeletedDate } from "../_hooks/use-trash-table";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const roleColors: Record<string, string> = {
  admin: "bg-primary/20 text-primary border-primary/30",
  user: "bg-secondary text-secondary-foreground border-border",
};

export const getTrashUserColumns = (
  t: (key: string) => string,
  locale: string,
  initialData: DeletedUser[],
  onRestore: (item: DeletedUser) => void,
  onDelete: (item: DeletedUser) => void
) => [
  {
    key: "user",
    label: t("nav.users"),
    render: (_: unknown, row: Record<string, unknown>) => {
      const name =
        (row.fullname as string) || (row.username as string) || "Unknown";
      const email = row.email as string;
      const avatarUrl = row.avatar_url as string | null;
      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={getAvatarUrl(avatarUrl)} />
            <AvatarFallback>{getInitials(name)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0">
            <span className="font-medium truncate" title={name}>{name}</span>
            <span className="text-xs text-muted-foreground truncate" title={email}>{email}</span>
          </div>
        </div>
      );
    },
  },
  {
    key: "role",
    label: t("table.role"),
    render: (value: unknown) => {
      const role = (value as string) || "user";
      return (
        <Badge
          variant="outline"
          className={roleColors[role.toLowerCase()] || roleColors.user}
        >
          {role.charAt(0).toUpperCase() + role.slice(1)}
        </Badge>
      );
    },
  },
  {
    key: "deleted_at",
    label: t("trash.deleted_at"),
    render: (value: unknown) => (
      <span className="text-sm text-muted-foreground">
        {formatDeletedDate(value as string, locale)}
      </span>
    ),
  },
  {
    key: "time_left",
    label: t("trash.time_left"),
    render: (_: unknown, row: Record<string, unknown>) => {
      const daysLeft = getDaysUntilPermanentDelete(row.deleted_at as string);
      return (
        <Badge
          variant="outline"
          className={
            daysLeft <= 2
              ? "bg-destructive/10 text-destructive border-destructive/30"
              : "bg-[var(--warning)]/20 text-[var(--warning)] border-[var(--warning)]/30"
          }
        >
          <Clock className="mr-1 h-3 w-3" />
          {daysLeft} {t("trash.days_left")}
        </Badge>
      );
    },
  },
  {
    key: "action",
    label: t("table.actions"),
    render: (_: unknown, row: Record<string, unknown>) => {
      const item = initialData.find((i) => i.id === row.id);
      return (
        <DropdownMenu>
          <DropdownMenuTrigger className="focus:outline-none">
            <div className="cursor-pointer hover:opacity-80 p-1 rounded hover:bg-muted">
              <MoreVertical className="h-4 w-4 text-muted-foreground" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => item && onRestore(item)}
              className="cursor-pointer"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              {t("action.restore")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => item && onDelete(item)}
              className="cursor-pointer text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t("trash.delete_permanent_title")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
