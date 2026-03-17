"use client";

import {
  Search,
  SlidersHorizontal,
  ChevronDown,
  Filter,
  RotateCcw,
  Smartphone,
} from "lucide-react";
import { format } from "date-fns";
import { useState, useTransition, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

import { DataTable } from "@/components/dashboard/data-table";
import { getAvatarUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { SearchInput } from "@/components/shared/search-input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Label } from "@/components/ui/label";
import {
  type Quiz,
  updateQuizVisibility,
  blockQuizAction,
  unblockQuizAction,
} from "./actions";
import { useTranslation } from "@/lib/i18n";

const visibilityColors: Record<string, string> = {
  Public:
    "bg-[var(--success)]/20 text-[var(--success)] border-[var(--success)]/30",
  Private:
    "bg-[var(--warning)]/20 text-[var(--warning)] border-[var(--warning)]/30",
};

const statusColors: Record<string, string> = {
  Active: "bg-blue-500/20 text-blue-500 border-blue-500/30",
  Block: "bg-red-500/20 text-red-500 border-red-500/30",
};

interface QuizTableProps {
  initialData: Quiz[];
}

export function QuizTable({ initialData }: QuizTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const { t } = useTranslation();

  // Client-Side State
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

  // Sync local data with server data when it changes (e.g. after router.refresh)
  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  const [filterDialogOpen, setFilterDialogOpen] = useState(false);

  // Temp state for dialog
  const [tempFilters, setTempFilters] = useState({
    category: "all",
    visibility: "all",
    status: "all",
  });

  const ITEMS_PER_PAGE = 15;

  // Derive Categories from Data
  const categories = useMemo(() => {
    const cats = new Set(
      data.map((q) => q.category).filter((c): c is string => !!c)
    );
    return Array.from(cats).sort();
  }, [data]);

  // Sync temp state when dialog opens
  useEffect(() => {
    if (filterDialogOpen) {
      // Try to find a matching category with correct casing
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



  // Filter Logic
  const filteredData = useMemo(() => {
    let filtered = [...data];

    // 1. Search
    if (activeSearchQuery) {
      const lowerQuery = activeSearchQuery.toLowerCase();
      filtered = filtered.filter(
        (quiz) =>
          quiz.title?.toLowerCase().includes(lowerQuery) ||
          quiz.category?.toLowerCase().includes(lowerQuery)
      );
    }

    // 2. Category Filter
    if (categoryFilter && categoryFilter !== "all") {
      filtered = filtered.filter(
        (quiz) => quiz.category?.toLowerCase() === categoryFilter.toLowerCase()
      );
    }

    // 3. Visibility Filter
    if (visibilityFilter && visibilityFilter !== "all") {
      if (visibilityFilter === "publik") {
        filtered = filtered.filter((quiz) => quiz.is_public);
      } else if (visibilityFilter === "private") {
        filtered = filtered.filter((quiz) => !quiz.is_public);
      }
    }

    // 4. Status Filter
    if (statusFilter && statusFilter !== "all") {
      if (statusFilter === "active") {
        filtered = filtered.filter((quiz) => quiz.status !== "block");
      } else if (statusFilter === "block") {
        filtered = filtered.filter((quiz) => quiz.status === "block");
      }
    }

    return filtered;
  }, [data, activeSearchQuery, categoryFilter, visibilityFilter, statusFilter]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredData.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredData, currentPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeSearchQuery, categoryFilter, visibilityFilter, statusFilter]);

  // --- Dialog States ---
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
    // Optimistic update
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
      // Revert on error
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
    // Optimistic update
    setData((prev) =>
      prev.map((q) => (q.id === blockDialog.id ? { ...q, status: "block" } : q))
    );
    setBlockDialog((prev) => ({ ...prev, open: false }));

    const { error } = await blockQuizAction(blockDialog.id, blockDialog.note);
    if (error) {
      // Revert
      setData((prev) =>
        prev.map(
          (q) => (q.id === blockDialog.id ? { ...q, status: "Active" } : q) // Assuming it was active
        )
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
    // Optimistic update
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
      // Revert
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

  const columns = [
    {
      key: "title",
      label: t("table.title"),
      render: (value: unknown) => (
        <span className="block max-w-[200px] truncate" title={value as string}>
          {value as string}
        </span>
      ),
    },
    {
      key: "creator",
      label: t("table.creator"),
      render: (value: unknown, row: Record<string, unknown>) => {
        const creator = value as {
          id: string;
          username: string;
          fullname: string;
          avatar_url: string;
        } | null;
        if (!creator) return <span className="text-muted-foreground">-</span>;
        return (
          <div className="flex items-center gap-2">
            <Link
              href={`/users/${creator.id}`}
              className="flex flex-col min-w-0 group"
              onClick={(e) => e.stopPropagation()}
            >
              <span
                className="text-sm font-medium truncate max-w-[120px] group-hover:text-primary transition-colors"
                title={`${creator.fullname} @${creator.username}`}
              >
                {creator.fullname}
              </span>
            </Link>
          </div>
        );
      },
    },
    {
      key: "category",
      label: t("table.category"),
      render: (value: unknown) => {
        const catValue = value as string;
        const category =
          t(`category.${catValue?.toLowerCase()?.replace(" ", "_")}`) ||
          capitalizeFirst(catValue);
        return (
          <span className="block max-w-[120px] truncate" title={category}>
            {category}
          </span>
        );
      },
    },
    { key: "questions", label: t("table.questions") },
    {
      key: "language",
      label: t("table.language"),
      render: (value: unknown) => capitalizeFirst(value as string),
    },
    {
      key: "difficulty", // Visibility
      label: t("table.visibility"),
      render: (value: unknown, row: Record<string, unknown>) => {
        const visibility = value as string;
        const id = row.id as string;
        const quizTitle = row.title as string;
        return (
          <div
            className="cursor-pointer hover:opacity-80 flex items-center"
            onClick={(e) => {
              e.stopPropagation();
              const targetVisibility =
                visibility === "Public" ? "Private" : "Public";
              openConfirmDialog(id, visibility, targetVisibility, quizTitle);
            }}
          >
            <Badge
              variant="outline"
              className={
                visibilityColors[visibility] ??
                "bg-secondary text-secondary-foreground"
              }
            >
              {visibility === "Public"
                ? t("status.public")
                : t("status.private")}
            </Badge>
          </div>
        );
      },
    },
    { key: "createdAt", label: t("table.created") },
    {
      key: "status",
      label: t("table.status"),
      render: (value: unknown, row: Record<string, unknown>) => {
        const status = value as string;
        const id = row.id as string;
        const quizTitle = row.title as string;
        return (
          <div
            className="cursor-pointer hover:opacity-80 flex items-center"
            onClick={(e) => {
              e.stopPropagation();
              if (status === "Active") {
                openBlockDialog(id, quizTitle);
              } else if (status === "Block") {
                openUnblockDialog(id, quizTitle);
              }
            }}
          >
            <Badge
              variant="outline"
              className={
                statusColors[status] ?? "bg-secondary text-secondary-foreground"
              }
            >
              {status === "Active" ? t("status.active") : t("status.blocked")}
            </Badge>
          </div>
        );
      },
    },
  ];

  const tableData = paginatedData.map((quiz) => ({
    id: quiz.id,
    title: quiz.title,
    creator: quiz.creator,
    category: quiz.category ?? "-",
    questions: Array.isArray(quiz.questions) ? quiz.questions.length : 0,
    language: quiz.language ?? "ID",
    difficulty: quiz.is_public ? "Public" : "Private",
    createdAt: quiz.created_at
      ? format(new Date(quiz.created_at), "d MMM yyyy")
      : "-",
    status: quiz.status === "block" ? "Block" : "Active",
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {t("quiz.title")}
          </h1>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          <SearchInput
            placeholder={t("quiz.search")}
            value={searchParams.get("search") || ""}
            onSearch={(val) => {
              setActiveSearchQuery(val);
              setCurrentPage(1);
            }}
            className="w-64 bg-background border-border"
          />

          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 bg-black border-black hover:bg-black/80"
            onClick={() => setFilterDialogOpen(true)}
          >
            <Filter className="h-4 w-4 text-white" />
          </Button>
        </div>
      </div>

      <div className={isPending ? "opacity-60 pointer-events-none" : ""}>
        <DataTable
          columns={columns}
          data={tableData as Record<string, unknown>[]}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          onRowClick={(row) => router.push(`/quizzes/${row.id}`)}
        />
      </div>

      <Dialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{t("quiz.change_visibility")}</DialogTitle>
            <DialogDescription>
              {t("quiz.change_visibility_desc")}{" "}
              <strong>{confirmDialog.quizTitle}</strong> {t("users.from")}{" "}
              <strong>
                {confirmDialog.currentValue === "Public"
                  ? t("status.public")
                  : t("status.private")}
              </strong>{" "}
              {t("users.to")}{" "}
              <strong>
                {confirmDialog.newValue === "Public"
                  ? t("status.public")
                  : t("status.private")}
              </strong>
              ?
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-4">
            <Label htmlFor="note">Reason</Label>
            <Textarea
              id="note"
              value={confirmDialog.note}
              onChange={(e) =>
                setConfirmDialog((prev) => ({ ...prev, note: e.target.value }))
              }
              placeholder="Reason for changing visibility..."
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setConfirmDialog((prev) => ({ ...prev, open: false }))
              }
            >
              {t("action.cancel")}
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!confirmDialog.note.trim()}
            >
              Change
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={blockDialog.open}
        onOpenChange={(open) =>
          setBlockDialog((prev) => ({ ...prev, open, note: "" }))
        }
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="text-destructive">
              {t("quiz.block_title")}
            </DialogTitle>
            <DialogDescription>
              {t("quiz.block_desc")} <strong>{blockDialog.quizTitle}</strong>.{" "}
              {t("quiz.block_desc2")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-4">
            <Label htmlFor="blockReason">Reason</Label>
            <Textarea
              id="blockReason"
              value={blockDialog.note}
              onChange={(e) =>
                setBlockDialog((prev) => ({
                  ...prev,
                  note: e.target.value,
                }))
              }
              placeholder="Reason for blocking..."
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setBlockDialog((prev) => ({
                  ...prev,
                  open: false,
                  note: "", // Reset note
                }))
              }
            >
              {t("action.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleBlockQuiz}
              disabled={!blockDialog.note.trim()}
            >
              {t("quiz.block_btn")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={unblockDialog.open}
        onOpenChange={(open) => setUnblockDialog((prev) => ({ ...prev, open }))}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{t("quiz.unblock_title")}</DialogTitle>
            <DialogDescription>
              {t("quiz.unblock_desc")}{" "}
              <strong>{unblockDialog.quizTitle}</strong>?
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-4">
            <Label htmlFor="unblockReason">Reason</Label>
            <Textarea
              id="unblockReason"
              value={unblockDialog.note}
              onChange={(e) =>
                setUnblockDialog((prev) => ({ ...prev, note: e.target.value }))
              }
              placeholder="Reason for unblocking..."
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setUnblockDialog((prev) => ({ ...prev, open: false }))
              }
            >
              {t("action.cancel")}
            </Button>
            <Button
              onClick={handleUnblock}
              disabled={!unblockDialog.note.trim()}
            >
              {t("quiz.unblock_btn")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={filterDialogOpen} onOpenChange={setFilterDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-primary" />
              {t("action.filter")}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Category */}
            <div className="grid gap-2">
              <Label htmlFor="category">{t("table.category")}</Label>
              <Select
                value={tempFilters.category}
                onValueChange={(value) =>
                  setTempFilters((prev) => ({ ...prev, category: value }))
                }
              >
                <SelectTrigger id="category" className="w-full">
                  <SelectValue placeholder={t("table.category")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("quiz.all_category")}</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {t(`category.${cat?.toLowerCase()?.replace(" ", "_")}`) ||
                        capitalizeFirst(cat)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Visibility */}
            <div className="grid gap-2">
              <Label htmlFor="visibility">{t("table.visibility")}</Label>
              <Select
                value={tempFilters.visibility}
                onValueChange={(value) =>
                  setTempFilters((prev) => ({ ...prev, visibility: value }))
                }
              >
                <SelectTrigger id="visibility" className="w-full">
                  <SelectValue placeholder={t("table.visibility")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t("filter.all_visibility")}
                  </SelectItem>
                  <SelectItem value="publik">{t("status.public")}</SelectItem>
                  <SelectItem value="private">{t("status.private")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="grid gap-2">
              <Label htmlFor="status">{t("table.status")}</Label>
              <Select
                value={tempFilters.status}
                onValueChange={(value) =>
                  setTempFilters((prev) => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger id="status" className="w-full">
                  <SelectValue placeholder={t("table.status")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("filter.all_status")}</SelectItem>
                  <SelectItem value="active">{t("status.active")}</SelectItem>
                  <SelectItem value="block">{t("status.blocked")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="flex-row gap-2 sm:justify-between">
            <Button
              variant="ghost"
              onClick={handleResetFilter}
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              {t("action.reset")}
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancelFilter}>
                {t("action.cancel")}
              </Button>
              <Button
                onClick={handleApplyFilter}
                className="bg-primary hover:bg-primary/90"
              >
                {t("action.apply")}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function capitalizeFirst(str: string) {
  if (!str || str === "-") return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
