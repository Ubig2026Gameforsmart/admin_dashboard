import { RejectionTemplate } from "@/types/rejection-template";
import { Edit2, Trash2, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const getTemplateColumns = (
  t: any,
  onToggle: (id: string, currentStatus: boolean, t: any) => void,
  onEdit: (item: RejectionTemplate) => void,
  onDelete: (id: string, t: any) => void
) => [
  {
    label: t("rejection_templates.reason_en") || "Reason (English)",
    key: "reason_en",
    render: (val: unknown) => (
      <span className="block max-w-[220px] truncate" title={val as string}>
        {val as string}
      </span>
    ),
  },
  {
    label: t("rejection_templates.reason_id") || "Reason (Indonesian)",
    key: "reason_id",
    render: (val: unknown) => (
      <span className="block max-w-[220px] truncate" title={val as string}>
        {val as string}
      </span>
    ),
  },
  {
    label: t("rejection_templates.status") || "Status",
    key: "is_active",
    render: (val: unknown, item: Record<string, unknown>) => (
      <DropdownMenu>
        <DropdownMenuTrigger className="focus:outline-none">
          <span
            className={`cursor-pointer px-2 py-1 rounded-full text-xs font-semibold ${
              val
                ? "bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30"
                : "bg-red-500/20 text-red-500 hover:bg-red-500/30"
            }`}
          >
            {val
              ? t("rejection_templates.active") || "Active"
              : t("rejection_templates.inactive") || "Inactive"}
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem
            onClick={() => onToggle(item.id as string, val as boolean, t)}
            className="cursor-pointer"
          >
            Set to{" "}
            {val
              ? t("rejection_templates.inactive") || "Inactive"
              : t("rejection_templates.active") || "Active"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
  {
    label: t("rejection_templates.type") || "Type",
    key: "type",
    render: (val: unknown) => {
      const str = val as string;
      if (!str) return "-";
      return str.charAt(0).toUpperCase() + str.slice(1);
    },
  },
  {
    label: t("table.actions") || "Actions",
    key: "id",
    render: (_id: unknown, item: Record<string, unknown>) => (
      <DropdownMenu>
        <DropdownMenuTrigger className="focus:outline-none">
          <div className="cursor-pointer hover:opacity-80 p-1 rounded hover:bg-muted text-muted-foreground">
            <MoreVertical className="h-4 w-4" />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => onEdit(item as unknown as RejectionTemplate)}
            className="cursor-pointer"
          >
            <Edit2 className="h-4 w-4 mr-2" />
            {t("action.edit") || "Edit"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => onDelete(item.id as string, t)}
            className="cursor-pointer text-destructive focus:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {t("action.delete") || "Delete"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];
