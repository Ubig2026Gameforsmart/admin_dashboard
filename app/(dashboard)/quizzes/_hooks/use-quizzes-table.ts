"use client";

import { useState, useEffect, useMemo, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from "@/lib/i18n";
import { updateQuizVisibility, blockQuizAction, unblockQuizAction } from "../actions";
import { Quiz } from "@/types/quiz";

export function useQuizzesTable(initialData: Quiz[]) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const { t } = useTranslation();

  const [data, setData] = useState(initialData);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeSearchQuery, setActiveSearchQuery] = useState(
    searchParams.get("search") || ""
  );
  const [categoryFilter, setCategoryFilter] = useState(
    searchParams.get("category") || "all"
  );
  const [visibilityFilter, setVisibilityFilter] = useState(
    searchParams.get("visibility") || "all"
  );
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get("status") || "all"
  );

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  const [filterDialogOpen, setFilterDialogOpen] = useState(false);

  const [tempFilters, setTempFilters] = useState({
    category: "all",
    visibility: "all",
    status: "all",
  });

  const ITEMS_PER_PAGE = 15;

  const categories = useMemo(() => {
    const cats = new Set(
      data.map((q) => q.category).filter((c): c is string => !!c)
    );
    return Array.from(cats).sort();
  }, [data]);

  useEffect(() => {
    if (filterDialogOpen) {
      const matchingCat = categories.find(
        (c) => c?.toLowerCase() === categoryFilter?.toLowerCase()
      );

      setTempFilters({
        category: matchingCat || categoryFilter,
        visibility: visibilityFilter,
        status: statusFilter,
      });
    }
  }, [filterDialogOpen, categoryFilter, visibilityFilter, statusFilter, categories]);

  const filteredData = useMemo(() => {
    let filtered = [...data];

    if (activeSearchQuery) {
      const lowerQuery = activeSearchQuery.toLowerCase();
      filtered = filtered.filter(
        (quiz) =>
          quiz.title?.toLowerCase().includes(lowerQuery) ||
          quiz.category?.toLowerCase().includes(lowerQuery)
      );
    }

    if (categoryFilter && categoryFilter !== "all") {
      filtered = filtered.filter(
        (quiz) => quiz.category?.toLowerCase() === categoryFilter.toLowerCase()
      );
    }

    if (visibilityFilter && visibilityFilter !== "all") {
      if (visibilityFilter === "publik") {
        filtered = filtered.filter((quiz) => quiz.is_public);
      } else if (visibilityFilter === "private") {
        filtered = filtered.filter((quiz) => !quiz.is_public);
      }
    }

    if (statusFilter && statusFilter !== "all") {
      if (statusFilter === "active") {
        filtered = filtered.filter((quiz) => quiz.status !== "block");
      } else if (statusFilter === "block") {
        filtered = filtered.filter((quiz) => quiz.status === "block");
      }
    }

    return filtered;
  }, [data, activeSearchQuery, categoryFilter, visibilityFilter, statusFilter]);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredData.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredData, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeSearchQuery, categoryFilter, visibilityFilter, statusFilter]);

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    id: string;
    currentValue: string;
    newValue: string;
    quizTitle: string;
    note: string;
  }>({
    open: false,
    id: "",
    currentValue: "",
    newValue: "",
    quizTitle: "",
    note: "",
  });

  const [blockDialog, setBlockDialog] = useState<{
    open: boolean;
    id: string;
    quizTitle: string;
    note: string;
  }>({
    open: false,
    id: "",
    quizTitle: "",
    note: "",
  });

  const [unblockDialog, setUnblockDialog] = useState<{
    open: boolean;
    id: string;
    quizTitle: string;
    note: string;
  }>({
    open: false,
    id: "",
    quizTitle: "",
    note: "",
  });

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleResetFilter = () => {
    setTempFilters({
      category: "all",
      visibility: "all",
      status: "all",
    });
  };

  const handleApplyFilter = () => {
    setCategoryFilter(tempFilters.category);
    setVisibilityFilter(tempFilters.visibility);
    setStatusFilter(tempFilters.status);
    setFilterDialogOpen(false);
  };

  const handleCancelFilter = () => {
    setFilterDialogOpen(false);
  };

  const openConfirmDialog = (
    id: string,
    currentValue: string,
    newValue: string,
    quizTitle: string
  ) => {
    setConfirmDialog({
      open: true,
      id,
      currentValue,
      newValue,
      quizTitle,
      note: "",
    });
  };

  const handleConfirm = async () => {
    const isPublic = confirmDialog.newValue === "Public";
    setData((prev) =>
      prev.map((q) =>
        q.id === confirmDialog.id ? { ...q, is_public: isPublic } : q
      )
    );
    setConfirmDialog((prev) => ({ ...prev, open: false }));

    const { error } = await updateQuizVisibility(
      confirmDialog.id,
      isPublic,
      confirmDialog.note
    );
    if (error) {
      setData((prev) =>
        prev.map((q) =>
          q.id === confirmDialog.id ? { ...q, is_public: !isPublic } : q
        )
      );
      toast({
        title: t("msg.error"),
        description: t("quiz.visibility_change_error"),
        variant: "destructive",
      });
    } else {
      toast({
        title: t("msg.success"),
        description: t("quiz.visibility_change_success"),
      });
      router.refresh();
    }
  };

  const openBlockDialog = (id: string, quizTitle: string) => {
    setBlockDialog({ open: true, id, quizTitle, note: "" });
  };

  const handleBlockQuiz = async () => {
    setData((prev) =>
      prev.map((q) => (q.id === blockDialog.id ? { ...q, status: "block" } : q))
    );
    setBlockDialog((prev) => ({ ...prev, open: false }));

    const { error } = await blockQuizAction(blockDialog.id, blockDialog.note);
    if (error) {
      setData((prev) =>
        prev.map((q) => (q.id === blockDialog.id ? { ...q, status: "Active" } : q))
      );
      toast({
        title: t("msg.error"),
        description: t("quiz.block_error"),
        variant: "destructive",
      });
    } else {
      toast({ title: t("msg.success"), description: t("quiz.block_success") });
      router.refresh();
    }
  };

  const openUnblockDialog = (id: string, quizTitle: string) => {
    setUnblockDialog({ open: true, id, quizTitle, note: "" });
  };

  const handleUnblock = async () => {
    setData((prev) =>
      prev.map((q) =>
        q.id === unblockDialog.id ? { ...q, status: "Active" } : q
      )
    );
    setUnblockDialog((prev) => ({ ...prev, open: false }));

    const { error } = await unblockQuizAction(
      unblockDialog.id,
      unblockDialog.note
    );
    if (error) {
      setData((prev) =>
        prev.map((q) =>
          q.id === unblockDialog.id ? { ...q, status: "block" } : q
        )
      );
      toast({
        title: t("msg.error"),
        description: t("quiz.unblock_error"),
        variant: "destructive",
      });
    } else {
      toast({
        title: t("msg.success"),
        description: t("quiz.unblock_success"),
      });
      router.refresh();
    }
  };

  return {
    t,
    router,
    isPending,
    activeSearchQuery,
    setActiveSearchQuery,
    currentPage,
    totalPages,
    paginatedData,
    handlePageChange,
    filterDialogOpen,
    setFilterDialogOpen,
    tempFilters,
    setTempFilters,
    categories,
    handleResetFilter,
    handleApplyFilter,
    handleCancelFilter,
    confirmDialog,
    setConfirmDialog,
    openConfirmDialog,
    handleConfirm,
    blockDialog,
    setBlockDialog,
    openBlockDialog,
    handleBlockQuiz,
    unblockDialog,
    setUnblockDialog,
    openUnblockDialog,
    handleUnblock,
  };
}
