"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from "@/lib/i18n";
import { getTemplates } from "../../rejection-templates/actions";
import { approveQuizAction, rejectQuizAction } from "../actions";

export interface DialogState {
  open: boolean;
  id: string;
  title: string;
}

export function useQuizApprovalTable(
  searchQuery: string,
  categoryFilter: string
) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const { t } = useTranslation();

  const [rejectionTemplates, setRejectionTemplates] = useState<any[]>([]);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [rejectionNote, setRejectionNote] = useState("");

  const [rejectDialog, setRejectDialog] = useState<DialogState>({
    open: false,
    id: "",
    title: "",
  });

  const [approveDialog, setApproveDialog] = useState<DialogState>({
    open: false,
    id: "",
    title: "",
  });

  useEffect(() => {
    getTemplates().then((data) => {
      setRejectionTemplates(
        data?.filter((t) => t.is_active && t.type === "quiz") || []
      );
    });
  }, []);

  const handleApprove = (id: string, title: string) => {
    setApproveDialog({ open: true, id, title });
  };

  const executeApprove = async () => {
    const { id } = approveDialog;
    if (!id) return;

    const { error } = await approveQuizAction(id);
    if (error) {
      toast({
        title: t("msg.error"),
        description: `${t("approval.failed_approve")} - ${error}`,
        variant: "destructive",
      });
    } else {
      toast({
        title: t("msg.success"),
        description: t("approval.approve_success"),
      });
      router.refresh();
    }

    setApproveDialog((prev) => ({ ...prev, open: false }));
  };

  const handleReject = (id: string, title: string) => {
    setRejectDialog({ open: true, id, title });
    setSelectedReasons([]);
    setRejectionNote("");
  };

  const executeReject = async () => {
    const { id } = rejectDialog;
    if (!id) return;

    if (selectedReasons.length === 0 && !rejectionNote.trim()) {
      toast({
        title: t("msg.error"),
        description:
          t("approval.reject_desc") || "Please provide at least one reason.",
        variant: "destructive",
      });
      return;
    }

    let finalReason = "";
    if (selectedReasons.length > 0) {
      finalReason += selectedReasons.map((r) => `• ${r}`).join("\n");
    }
    if (rejectionNote.trim()) {
      finalReason += finalReason
        ? `\n\nCatatan Tambahan:\n${rejectionNote}`
        : rejectionNote;
    }

    const { error } = await rejectQuizAction(id, finalReason);
    if (error) {
      toast({
        title: t("msg.error"),
        description: `${t("approval.failed_reject")} - ${error}`,
        variant: "destructive",
      });
    } else {
      toast({
        title: t("msg.success"),
        description: t("approval.reject_success"),
      });
      router.refresh();
    }

    setRejectDialog((prev) => ({ ...prev, open: false }));
  };

  const updateUrl = (params: Record<string, string | number>) => {
    const newParams = new URLSearchParams(searchParams.toString());

    Object.entries(params).forEach(([key, value]) => {
      if (value && value !== "" && value !== "all") {
        newParams.set(key, String(value));
      } else {
        newParams.delete(key);
      }
    });

    startTransition(() => {
      router.push(`?${newParams.toString()}`);
    });
  };

  const handlePageChange = (page: number) => {
    updateUrl({ page, search: searchQuery, category: categoryFilter });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return {
    t,
    router,
    isPending,
    rejectionTemplates,
    selectedReasons,
    setSelectedReasons,
    rejectionNote,
    setRejectionNote,
    approveDialog,
    setApproveDialog,
    handleApprove,
    executeApprove,
    rejectDialog,
    setRejectDialog,
    handleReject,
    executeReject,
    updateUrl,
    handlePageChange,
  };
}
