"use client";

import {
  ChevronDown,
  MoreVertical,
  Search,
  SlidersHorizontal,
  Eye,
  Trash2,
  MessageSquare,
  FileText,
  User,
} from "lucide-react";
import { useState, useTransition, useMemo, useEffect } from "react";
import { format } from "date-fns";
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
import { SearchInput } from "@/components/shared/search-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { type Report, updateReportAction, deleteReportAction } from "./actions";
import { useTranslation } from "@/lib/i18n";

const reportTypeColors: Record<string, string> = {
  bug: "bg-destructive/20 text-destructive border-destructive/30",
  content:
    "bg-[var(--warning)]/20 text-[var(--warning)] border-[var(--warning)]/30",
  user: "bg-primary/20 text-primary border-primary/30",
  other: "bg-secondary text-secondary-foreground border-border",
};

interface ReportTableProps {
  initialData: Report[];
}

export function ReportTable({ initialData }: ReportTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const { t } = useTranslation();

  // Client-Side State
  const [currentPage, setCurrentPage] = useState(1);
  const [activeSearchQuery, setActiveSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const ITEMS_PER_PAGE = 15;

  // Filter Logic
  const filteredData = useMemo(() => {
    let data = [...initialData];

    // 1. Search
    if (activeSearchQuery) {
      const lowerQuery = activeSearchQuery.toLowerCase();
      data = data.filter((report) => {
        const title = report.title?.toLowerCase() || "";
        const description = report.description?.toLowerCase() || "";
        const reporterName =
          report.reporter?.fullname?.toLowerCase() ||
          report.reporter?.username?.toLowerCase() ||
          "";
        return (
          title.includes(lowerQuery) ||
          description.includes(lowerQuery) ||
          reporterName.includes(lowerQuery)
        );
      });
    }

    // 2. Status Filter
    if (statusFilter && statusFilter !== "all") {
      data = data.filter(
        (report) => report.status?.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    // 3. Type Filter
    if (typeFilter && typeFilter !== "all") {
      data = data.filter(
        (report) =>
          report.report_type?.toLowerCase() === typeFilter.toLowerCase()
      );
    }

    return data;
  }, [initialData, activeSearchQuery, statusFilter, typeFilter]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredData.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredData, currentPage]);

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeSearchQuery, statusFilter, typeFilter]);

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    id: string;
    currentStatus: string;
    newStatus: string;
    reportTitle: string;
  }>({
    open: false,
    id: "",
    currentStatus: "",
    newStatus: "",
    reportTitle: "",
  });

  const [detailDialog, setDetailDialog] = useState<{
    open: boolean;
    report: Report | null;
  }>({ open: false, report: null });

  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    id: string;
    reportTitle: string;
    confirmText: string;
  }>({ open: false, id: "", reportTitle: "", confirmText: "" });

  const [notesDialog, setNotesDialog] = useState<{
    open: boolean;
    id: string;
    notes: string;
    reportTitle: string;
  }>({ open: false, id: "", notes: "", reportTitle: "" });


  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openConfirmDialog = (
    id: string,
    currentStatus: string,
    newStatus: string,
    reportTitle: string
  ) => {
    setConfirmDialog({ open: true, id, currentStatus, newStatus, reportTitle });
  };

  const handleConfirm = async () => {
    const updates: Record<string, unknown> = {
      status: confirmDialog.newStatus,
    };
    if (confirmDialog.newStatus === "resolved") {
      updates.resolved_at = new Date().toISOString();
    }
    const { error } = await updateReportAction(confirmDialog.id, updates);
    if (error) {
      toast({
        title: "Error",
        description: "Failed to change status",
        variant: "destructive",
      });
    } else {
      toast({ title: "Success", description: "Status changed successfully" });
      router.refresh();
    }
    setConfirmDialog((prev) => ({ ...prev, open: false }));
  };

  const handleDeleteReport = async () => {
    if (deleteDialog.confirmText !== "Delete Report") return;
    const { error } = await deleteReportAction(deleteDialog.id);
    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete report",
        variant: "destructive",
      });
    } else {
      toast({ title: "Success", description: "Report deleted successfully" });
      router.refresh();
    }
    setDeleteDialog((prev) => ({ ...prev, open: false, confirmText: "" }));
  };

  const handleSaveNotes = async () => {
    const { error } = await updateReportAction(notesDialog.id, {
      admin_notes: notesDialog.notes,
    });
    if (error) {
      toast({
        title: "Error",
        description: "Failed to save notes",
        variant: "destructive",
      });
    } else {
      toast({ title: "Success", description: "Notes saved successfully" });
      router.refresh();
    }
    setNotesDialog((prev) => ({ ...prev, open: false }));
  };

  const columns = [
    {
      key: "reporter",
      label: t("reports.reporter"),
      render: (_: unknown, row: Record<string, unknown>) => {
        const reporter = row.reporterData as Report["reporter"];
        if (!reporter) {
          return <span className="text-muted-foreground">—</span>;
        }
        const name = reporter.fullname || reporter.username || "Unknown";
        const username = reporter.username
          ? `@${reporter.username}`
          : "No username";
        return (
          <Link
            href={`/users/${reporter.id}`}
            className="flex items-center gap-3 cursor-pointer"
          >
            <div className="min-w-0">
              <p className="font-medium leading-tight hover:text-primary transition-colors truncate" title={name}>
                {name}
              </p>
              <p className="text-xs text-muted-foreground truncate" title={username}>{username}</p>
            </div>
          </Link>
        );
      },
    },
    {
      key: "title",
      label: t("reports.report"),
      render: (value: unknown) => {
        // Remove "Laporan " prefix if exists
        const title = ((value as string) || "Untitled").replace(
          /^Laporan\s+/i,
          ""
        );
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
            <Link
              href={`/users/${reportedUser.id}`}
              className="flex items-center gap-2 cursor-pointer"
            >
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm hover:text-primary transition-colors truncate block max-w-[150px]" title={reportedUser.fullname || reportedUser.username || "Unknown"}>
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
          return (
            <span className="text-sm text-muted-foreground capitalize">
              {contentType}
            </span>
          );
        }
        return <span className="text-muted-foreground">—</span>;
      },
    },
    {
      key: "status",
      label: t("table.status"),
      render: (value: unknown, row: Record<string, unknown>) => {
        const status = formatStatus(value as string);
        const id = row.id as string;
        const title = row.title as string;

        const statusStyles: Record<string, string> = {
          Active:
            "bg-[var(--success)]/20 text-[var(--success)] border-[var(--success)]/30",
          Pending:
            "bg-[var(--warning)]/20 text-[var(--warning)] border-[var(--warning)]/30",
          "In Progress": "bg-primary/20 text-primary border-primary/30",
          Resolved:
            "bg-[var(--success)]/20 text-[var(--success)] border-[var(--success)]/30",
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
                    statusStyles[status] ||
                    "bg-secondary text-secondary-foreground border-border"
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
                    onClick={() =>
                      openConfirmDialog(
                        id,
                        status,
                        s.toLowerCase().replace(" ", "_"),
                        title
                      )
                    }
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
        const fullReport = row.fullReport as Report;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger className="focus:outline-none">
              <div className="cursor-pointer hover:opacity-80 p-1 rounded hover:bg-muted">
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
                onClick={() =>
                  setNotesDialog({
                    open: true,
                    id,
                    notes: notes || "",
                    reportTitle: title,
                  })
                }
                className="cursor-pointer"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                {t("reports.admin_notes")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() =>
                  setDeleteDialog({
                    open: true,
                    id,
                    reportTitle: title,
                    confirmText: "",
                  })
                }
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

  const tableData = paginatedData.map((report) => ({
    id: report.id,
    reporterData: report.reporter,
    title: report.title,
    description: report.description,
    report_type: report.report_type,
    reported_content_type: report.reported_content_type,
    reported_content_id: report.reported_content_id,
    reportedUserData: report.reported_user,
    status: report.status,
    date: report.created_at,
    admin_notes: report.admin_notes,
    fullReport: report,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {t("reports.title")}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <SearchInput
            placeholder={t("reports.search")}
            onSearch={(val) => {
              setActiveSearchQuery(val);
              setCurrentPage(1);
            }}
            className="w-64 bg-background border-border"
          />

          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value)}
          >
            <SelectTrigger className="w-[180px]">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                <SelectValue placeholder={t("table.status")} />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("filter.all_status")}</SelectItem>
              <SelectItem value="pending">{t("status.pending")}</SelectItem>
              <SelectItem value="in_progress">
                {t("status.in_progress")}
              </SelectItem>
              <SelectItem value="resolved">{t("status.resolved")}</SelectItem>
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
          onRowClick={(row) => router.push(`/reports/${row.id}`)}
        />
      </div>

      {/* Confirm Dialog */}
      <Dialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Change Status</DialogTitle>
            <DialogDescription>
              Are you sure you want to change the status?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setConfirmDialog((prev) => ({ ...prev, open: false }))
              }
            >
              Cancel
            </Button>
            <Button onClick={handleConfirm}>Change</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog
        open={detailDialog.open}
        onOpenChange={(open) => setDetailDialog((prev) => ({ ...prev, open }))}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {detailDialog.report?.title || "Report Details"}
            </DialogTitle>
          </DialogHeader>
          {detailDialog.report && (
            <div className="space-y-4 py-4">
              <div>
                <Label className="text-muted-foreground">Description</Label>
                <p className="mt-1">{detailDialog.report.description || "—"}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Type</Label>
                  <p className="mt-1">
                    {formatReportType(detailDialog.report.report_type)}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <p className="mt-1">
                    {formatStatus(detailDialog.report.status)}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Created</Label>
                  <p className="mt-1">
                    {detailDialog.report.created_at
                      ? format(
                          new Date(detailDialog.report.created_at),
                          "dd MMM yyyy HH:mm"
                        )
                      : "—"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Reporter</Label>
                  <p className="mt-1">
                    {detailDialog.report.reporter?.fullname ||
                      detailDialog.report.reporter?.username ||
                      "—"}
                  </p>
                </div>
              </div>
              {detailDialog.report.admin_notes && (
                <div>
                  <Label className="text-muted-foreground">Admin Notes</Label>
                  <p className="mt-1 text-sm bg-muted p-2 rounded">
                    {detailDialog.report.admin_notes}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Notes Dialog */}
      <Dialog
        open={notesDialog.open}
        onOpenChange={(open) => setNotesDialog((prev) => ({ ...prev, open }))}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Admin Notes - {notesDialog.reportTitle}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={notesDialog.notes}
              onChange={(e) =>
                setNotesDialog((prev) => ({ ...prev, notes: e.target.value }))
              }
              placeholder="Add admin notes..."
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setNotesDialog((prev) => ({ ...prev, open: false }))
              }
            >
              Cancel
            </Button>
            <Button onClick={handleSaveNotes}>Save</Button>
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
              Delete Report
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete report{" "}
              <strong>{deleteDialog.reportTitle}</strong>? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-4">
            <Label htmlFor="confirmDelete">
              Type <strong className="text-destructive">Delete Report</strong>{" "}
              to confirm
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
              placeholder="Type 'Delete Report' here"
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
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteReport}
              disabled={deleteDialog.confirmText !== "Delete Report"}
            >
              Delete Report
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

function formatReportType(type: string | null) {
  if (!type) return "Other";
  return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
}

function formatStatus(status: string | null) {
  if (!status) return "Pending";
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}
