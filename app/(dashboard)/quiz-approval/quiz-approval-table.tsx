"use client";

import {
  Search,
  Check,
  X,
  FileQuestion,
  SlidersHorizontal,
} from "lucide-react";
import { format } from "date-fns";
import { useState, useTransition, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

import { getAvatarUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { DataTable } from "@/components/dashboard/data-table";
import {
  type QuizApproval,
  approveQuizAction,
  rejectQuizAction,
} from "./actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "@/lib/i18n";

import { Checkbox } from "@/components/ui/checkbox";
import { SearchInput } from "@/components/shared/search-input";
import { getTemplates } from "../rejection-templates/actions";

interface QuizApprovalTableProps {
  initialData: QuizApproval[];
  totalPages: number;
  currentPage: number;
  totalCount: number;
  searchQuery: string;
  categories: string[];
  categoryFilter: string;
}

export function QuizApprovalTable({
  initialData,
  totalPages,
  currentPage,
  totalCount,
  searchQuery,
  categories,
  categoryFilter,
}: QuizApprovalTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const { t } = useTranslation();

  const [rejectionTemplates, setRejectionTemplates] = useState<any[]>([]);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [rejectionNote, setRejectionNote] = useState("");

  useEffect(() => {
    getTemplates().then((data) => {
      setRejectionTemplates(data?.filter(t => t.is_active && t.type === 'quiz') || []);
    });
  }, []);

  const [rejectDialog, setRejectDialog] = useState<{
    open: boolean;
    id: string;
    title: string;
  }>({
    open: false,
    id: "",
    title: "",
  });

  const [approveDialog, setApproveDialog] = useState<{
    open: boolean;
    id: string;
    title: string;
  }>({
    open: false,
    id: "",
    title: "",
  });

  const handleApprove = (id: string, title: string) => {
    setApproveDialog({ open: true, id, title });
  };

  const executeApprove = async () => {
    const { id, title } = approveDialog;
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
    const { id, title } = rejectDialog;
    if (!id) return;

    if (selectedReasons.length === 0 && !rejectionNote.trim()) {
      toast({
        title: t("msg.error"),
        description: t("approval.reject_desc") || "Please provide at least one reason.",
        variant: "destructive",
      });
      return;
    }

    // Build the final reason string
    let finalReason = "";
    if (selectedReasons.length > 0) {
      finalReason += selectedReasons.map(r => `• ${r}`).join("\n");
    }
    if (rejectionNote.trim()) {
      finalReason += finalReason ? `\n\nCatatan Tambahan:\n${rejectionNote}` : rejectionNote;
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

  const columns = [
    {
      key: "title",
      label: t("table.title"),
      render: (value: unknown) => (
        <span
          className="block max-w-[250px] truncate font-medium"
          title={value as string}
        >
          {value as string}
        </span>
      ),
    },
    {
      key: "creator",
      label: t("table.creator"),
      render: (value: unknown) => {
        const creator = value as {
          id: string;
          username: string;
          fullname: string;
          avatar_url: string;
        } | null;
        if (!creator) return <span className="text-muted-foreground">-</span>;
        return (
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
        );
      },
    },
    {
      key: "category",
      label: t("table.category"),
      render: (value: unknown) => {
        const val = value as string;
        if (!val || val === "-") {
          return (
            <Badge variant="secondary" className="text-xs">
              -
            </Badge>
          );
        }
        return (
          <Badge variant="secondary" className="text-xs">
            {t(`category.${val.toLowerCase().replace(/\s+/g, "_")}`)}
          </Badge>
        );
      },
    },
    { key: "questions", label: t("table.questions") },
    {
      key: "language",
      label: t("table.language"),
      render: (value: unknown) => (
        <span className="uppercase text-xs font-medium">
          {(value as string) || "ID"}
        </span>
      ),
    },
    { key: "createdAt", label: t("table.created") },
    {
      key: "actions",
      label: t("table.actions"),
      render: (_value: unknown, row: Record<string, unknown>) => {
        const id = row.id as string;
        const title = row.title as string;
        return (
          <div
            className="flex items-center gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              size="sm"
              className="h-8 gap-1 bg-emerald-500 hover:bg-emerald-600 text-white"
              onClick={() => handleApprove(id, title)}
            >
              <Check className="h-3.5 w-3.5" />
              {t("action.approve")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1 border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
              onClick={() => handleReject(id, title)}
            >
              <X className="h-3.5 w-3.5" />
              {t("action.reject")}
            </Button>
          </div>
        );
      },
    },
  ];

  const tableData = initialData.map((quiz) => ({
    id: quiz.id,
    title: quiz.title,
    creator: quiz.creator,
    category: quiz.category ?? "-",
    questions: Array.isArray(quiz.questions) ? quiz.questions.length : 0,
    language: quiz.language ?? "ID",
    createdAt: quiz.created_at
      ? format(new Date(quiz.created_at), "d MMM yyyy")
      : "-",
    actions: null,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {t("page.quiz_approval")}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <SearchInput
            placeholder={t("approval.search")}
            value={searchQuery}
            onSearch={(val) => updateUrl({ search: val, page: 1 })}
            className="w-64 bg-background border-border"
          />

          <Select
            value={categoryFilter}
            onValueChange={(value) => updateUrl({ category: value, page: 1 })}
          >
            <SelectTrigger className="w-[180px]">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                <SelectValue placeholder={t("table.category")} />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("quiz.all_category")}</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {t(`category.${cat.toLowerCase().replace(/\s+/g, "_")}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className={isPending ? "opacity-60 pointer-events-none" : ""}>
        {initialData.length > 0 ? (
          <DataTable
            columns={columns}
            data={tableData as Record<string, unknown>[]}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            onRowClick={(row) => router.push(`/quiz-approval/${row.id}`)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border rounded-xl bg-card">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <FileQuestion className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-base font-medium text-foreground mb-1">
              {t("approval.no_pending")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery
                ? t("approval.no_match")
                : t("approval.all_reviewed")}
            </p>
          </div>
        )}
      </div>

      {/* Approve Dialog */}
      <Dialog
        open={approveDialog.open}
        onOpenChange={(open) => setApproveDialog((prev) => ({ ...prev, open }))}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("approval.approve_title")}</DialogTitle>
            <DialogDescription>
              {t("approval.approve_desc")}{" "}
              <strong>{approveDialog.title}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setApproveDialog((prev) => ({ ...prev, open: false }))
              }
            >
              {t("action.cancel")}
            </Button>
            <Button
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
              onClick={executeApprove}
            >
              {t("action.approve")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog
        open={rejectDialog.open}
        onOpenChange={(open) => setRejectDialog((prev) => ({ ...prev, open }))}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t("rejection.title") || "Reject Quiz?"}</DialogTitle>
            <DialogDescription>
              {t("rejection.subtitle") || "Select 1-3 reasons for rejection to inform the creator."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="flex justify-between items-center text-sm font-medium">
              <Label>{t("rejection.title") || "Reason"}</Label>
              <span className="text-muted-foreground">{selectedReasons.length}/3</span>
            </div>
            <div className="flex flex-col gap-1 max-h-[280px] overflow-y-auto pr-1">
              {rejectionTemplates.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No templates available. Add them in Rejection Templates.</p>
              ) : (
                rejectionTemplates.map((template) => {
                  const labelStr = t("rejection_templates.reason_en") === "Reason (English)" 
                    ? template.reason_en 
                    : template.reason_id;
                  
                  return (
                    <div key={template.id} className="flex items-start gap-3 rounded-lg border border-border/50 px-3 py-3 hover:bg-secondary/40 transition-colors">
                      <Checkbox 
                        id={`reason-${template.id}`} 
                        checked={selectedReasons.includes(labelStr)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            if (selectedReasons.length < 3) {
                              setSelectedReasons([...selectedReasons, labelStr]);
                            }
                          } else {
                            setSelectedReasons(selectedReasons.filter(r => r !== labelStr));
                          }
                        }}
                        disabled={!selectedReasons.includes(labelStr) && selectedReasons.length >= 3}
                        className="mt-0.5"
                      />
                      <label 
                        htmlFor={`reason-${template.id}`} 
                        className="text-sm leading-relaxed peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {labelStr}
                      </label>
                    </div>
                  );
                })
              )}
            </div>
            <Textarea
              placeholder={t("rejection.additional_note") || "Additional note (optional)..."}
              value={rejectionNote}
              onChange={(e) => setRejectionNote(e.target.value)}
              className="h-20 resize-none mt-2"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setRejectDialog((prev) => ({ ...prev, open: false }))
              }
            >
              {t("rejection.cancel") || "Cancel"}
            </Button>
            <Button
              variant="destructive"
              onClick={executeReject}
              disabled={selectedReasons.length === 0 && !rejectionNote.trim()}
            >
              {t("rejection.reject") || "Reject"}
            </Button>
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
