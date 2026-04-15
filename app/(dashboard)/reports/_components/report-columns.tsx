import Link from "next/link";
import { format } from "date-fns";
import { Eye, MessageSquare, MoreVertical, Trash2, User, FileText, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type Report } from "@/types/report";
export const getReportColumns = (
  t: any,
  openConfirmDialog: (id: string, currentStatus: string, newStatus: string, reportTitle: string) => void,
  setNotesDialog: (val: { open: boolean; id: string; notes: string; reportTitle: string }) => void,
  setDeleteDialog: (val: { open: boolean; id: string; reportTitle: string; confirmText: string }) => void
) => [
  {
    key: "reporter",
    label: t("reports.reporter"),
    render: (_: unknown, row: Record<string, unknown>) => {
      const reporter = row.reporterData as Report["reporter"];
      if (!reporter) {
        return <span className="text-muted-foreground">—</span>;
      }
      const name = reporter.fullname || reporter.username || "Unknown";
      const username = reporter.username ? `@${reporter.username}` : "No username";
      return (
        <Link href={`/users/${reporter.id}`} className="flex items-center gap-3 cursor-pointer">
          <div className="min-w-0">
            <p className="font-medium leading-tight hover:text-primary transition-colors truncate" title={name}>
              {name}
            </p>
            <p className="text-xs text-muted-foreground truncate" title={username}>
              {username}
            </p>
          </div>
        </Link>
      );
    },
  },
  {
    key: "title",
    label: t("reports.report"),
    render: (value: unknown) => {
      const title = ((value as string) || "Untitled").replace(/^Laporan\s+/i, "");
      return (
        <div className="max-w-[250px]">
          <p className="font-medium truncate" title={title}>
            {title}
          </p>
        </div>
      );
    },
  },
  {
    key: "description",
    label: t("reports.description"),
    render: (value: unknown) => {
      const description = (value as string) || "";
      return (
        <div className="max-w-[250px]">
          <p className="truncate" title={description || "No description provided"}>
            {description || "No description provided"}
          </p>
        </div>
      );
    },
  },
  {
    key: "reported",
    label: t("reports.type"),
    render: (_: unknown, row: Record<string, unknown>) => {
      const contentType = row.reported_content_type as string;
      const reportedUser = row.reportedUserData as Report["reported_user"];
      const contentId = row.reported_content_id as string;
      if (contentType === "user" && reportedUser) {
        return (
          <Link href={`/users/${reportedUser.id}`} className="flex items-center gap-2 cursor-pointer">
            <User className="h-4 w-4 text-muted-foreground" />
            <span
              className="text-sm hover:text-primary transition-colors truncate block max-w-[150px]"
              title={reportedUser.fullname || reportedUser.username || "Unknown"}
            >
              {reportedUser.fullname || reportedUser.username || "Unknown"}
            </span>
          </Link>
        );
      }
      if (contentType === "quiz" && contentId) {
        return (
          <Link
            href={`/quizzes/${contentId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 cursor-pointer group"
          >
            <FileText className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="text-sm hover:text-primary transition-colors text-muted-foreground group-hover:text-primary">
              {t("stats.quizzes")}
            </span>
          </Link>
        );
      }
      if (contentType) {
        return <span className="text-sm text-muted-foreground capitalize">{contentType}</span>;
      }
      return <span className="text-muted-foreground">—</span>;
    },
  },
  {
    key: "status",
    label: t("table.status"),
    render: (value: unknown, row: Record<string, unknown>) => {
      const statusRaw = value as string;
      let status = "Pending";
      if (statusRaw) {
        status = statusRaw
          .split("_")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(" ");
      }

      const id = row.id as string;
      const title = row.title as string;

      const statusStyles: Record<string, string> = {
        Active: "bg-[var(--success)]/20 text-[var(--success)] border-[var(--success)]/30",
        Pending: "bg-[var(--warning)]/20 text-[var(--warning)] border-[var(--warning)]/30",
        "In Progress": "bg-primary/20 text-primary border-primary/30",
        Resolved: "bg-[var(--success)]/20 text-[var(--success)] border-[var(--success)]/30",
      };

      const getTranslatedStatus = (s: string) => {
        if (s === "Pending") return t("status.pending");
        if (s === "In Progress") return t("status.in_progress");
        if (s === "Resolved") return t("status.resolved");
        return s;
      };

      return (
        <DropdownMenu>
          <DropdownMenuTrigger className="focus:outline-none">
            <div className="cursor-pointer hover:opacity-80 flex items-center">
              <Badge
                variant="outline"
                className={
                  statusStyles[status] || "bg-secondary text-secondary-foreground border-border"
                }
              >
                {getTranslatedStatus(status)}
              </Badge>
              <ChevronDown className="ml-1.5 h-3 w-3 text-muted-foreground/50" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {["Pending", "In Progress", "Resolved"]
              .filter((s) => s !== status)
              .map((s) => (
                <DropdownMenuItem
                  key={s}
                  onClick={(e) => {
                    e.stopPropagation();
                    openConfirmDialog(id, status, s.toLowerCase().replace(" ", "_"), title);
                  }}
                  className="cursor-pointer"
                >
                  {getTranslatedStatus(s)}
                </DropdownMenuItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
  {
    key: "date",
    label: t("table.created"),
    render: (value: unknown) => (
      <span className="text-sm text-muted-foreground">
        {value ? format(new Date(value as string), "dd MMM yyyy") : "—"}
      </span>
    ),
  },
  {
    key: "action",
    label: t("table.actions"),
    render: (_: unknown, row: Record<string, unknown>) => {
      const id = row.id as string;
      const title = (row.title as string) || "Untitled";
      const notes = row.admin_notes as string;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger className="focus:outline-none" asChild>
            <div
              className="cursor-pointer hover:opacity-80 p-1 rounded hover:bg-muted inline-flex"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-4 w-4 text-muted-foreground" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link href={`/reports/${id}`}>
                <Eye className="h-4 w-4 mr-2" />
                {t("reports.view_details")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                setNotesDialog({
                  open: true,
                  id,
                  notes: notes || "",
                  reportTitle: title,
                });
              }}
              className="cursor-pointer"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              {t("reports.admin_notes")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                setDeleteDialog({
                  open: true,
                  id,
                  reportTitle: title,
                  confirmText: "",
                });
              }}
              className="cursor-pointer text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t("reports.delete_report")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
