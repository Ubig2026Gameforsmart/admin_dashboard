import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { type Report } from "@/types/report";
import { updateReportAction, deleteReportAction } from "../actions";
export function useReportsTable(initialData: Report[]) {
  const router = useRouter();
  const { toast } = useToast();

  const [currentPage, setCurrentPage] = useState(1);
  const [activeSearchQuery, setActiveSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const ITEMS_PER_PAGE = 15;

  const filteredData = useMemo(() => {
    let data = [...initialData];

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

    if (statusFilter && statusFilter !== "all") {
      data = data.filter(
        (report) => report.status?.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    if (typeFilter && typeFilter !== "all") {
      data = data.filter(
        (report) =>
          report.report_type?.toLowerCase() === typeFilter.toLowerCase()
      );
    }

    return data;
  }, [initialData, activeSearchQuery, statusFilter, typeFilter]);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredData.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredData, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeSearchQuery, statusFilter, typeFilter]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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

  return {
    currentPage,
    totalPages,
    activeSearchQuery,
    setActiveSearchQuery,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    tableData,
    handlePageChange,
    confirmDialog,
    setConfirmDialog,
    openConfirmDialog,
    handleConfirm,
    detailDialog,
    setDetailDialog,
    deleteDialog,
    setDeleteDialog,
    handleDeleteReport,
    notesDialog,
    setNotesDialog,
    handleSaveNotes,
  };
}
