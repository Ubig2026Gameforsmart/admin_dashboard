"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { useTranslation } from "@/lib/i18n";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { SearchInput } from "@/components/shared/search-input";
import { Image as ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/dashboard/data-table";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

interface Competition {
  id: string;
  title: string;
  slug: string;
  status: string;
  registration_start_date: string;
  registration_end_date: string;
  final_end_date: string | null;
  poster_url: string | null;
  category: string | null;
}

export default function ReceptionistPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const supabase = getSupabaseBrowserClient();

  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [previewPoster, setPreviewPoster] = useState<{ url: string; title: string } | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    async function fetchCompetitions() {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("competitions")
        .select("id, title, slug, status, registration_start_date, registration_end_date, final_end_date, poster_url, category")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setCompetitions(data);
      }
      setIsLoading(false);
    }
    fetchCompetitions();
  }, []);

  const filtered = competitions.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const recColumns = [
    {
      key: "poster",
      label: t("manage_competitions.table_poster") || "Poster",
      render: (value: unknown, row: Record<string, unknown>) => {
        const posterUrl = row.poster_url as string | null;
        const title = row.title as string;
        return (
          <div
            className={`h-10 w-14 rounded overflow-hidden bg-muted flex items-center justify-center border shrink-0 ${posterUrl ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              if (posterUrl) setPreviewPoster({ url: posterUrl, title });
            }}
          >
            {posterUrl ? (
              <img src={posterUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <ImageIcon className="h-4 w-4 text-muted-foreground/30" />
            )}
          </div>
        );
      },
    },
    {
      key: "title",
      label: t("manage_competitions.table_title") || "Title",
      render: (value: unknown) => (
        <span className="font-medium truncate block max-w-[250px]" title={value as string}>
          {value as string}
        </span>
      ),
    },
    {
      key: "categoryDisplay",
      label: t("table.category") || "Category",
      render: (value: unknown) => {
        const cat = value as string;
        return cat ? (
          <span className="text-sm text-muted-foreground truncate block max-w-[150px]" title={cat}>{cat}</span>
        ) : (
          <span className="text-muted-foreground">\u2014</span>
        );
      },
    },
    {
      key: "status",
      label: t("manage_competitions.table_status") || "Status",
      render: (value: unknown) => {
        const status = value as string;
        const cfg = statusConfig[status] || { label: status, className: "border-gray-500/50 bg-gray-500/10 text-gray-500" };
        return (
          <Badge variant="outline" className={`capitalize border ${cfg.className}`}>
            {cfg.label}
          </Badge>
        );
      },
    },
    {
      key: "schedule",
      label: t("manage_competitions.table_schedule") || "Schedule",
      render: (value: unknown) => <span className="text-xs whitespace-nowrap">{value as string}</span>,
    },
  ];

  const tableData = paginated.map((comp) => {
    const catLabels = comp.category
      ? comp.category.split(',').map((c: string) => c.trim()).join(', ')
      : null;
    const scheduleStart = comp.registration_start_date ? format(new Date(comp.registration_start_date), "d MMM yyyy") : "\u2014";
    const scheduleEnd = (comp.final_end_date || comp.registration_end_date) ? format(new Date(comp.final_end_date || comp.registration_end_date), "d MMM yyyy") : "\u2014";
    return {
      id: comp.id,
      poster: null,
      poster_url: comp.poster_url,
      title: comp.title,
      categoryDisplay: catLabels,
      status: comp.status,
      schedule: `${scheduleStart} \u2014 ${scheduleEnd}`,
    };
  });

  const statusConfig: Record<string, { label: string; className: string }> = {
    published: {
      label: t("comp_detail.status_published") || "Published",
      className: "border-emerald-500/50 bg-emerald-500/10 text-emerald-500",
    },
    draft: {
      label: t("comp_detail.status_draft") || "Draft",
      className: "border-yellow-500/50 bg-yellow-500/10 text-yellow-500",
    },
    completed: {
      label: t("comp_detail.status_completed") || "Completed",
      className: "border-blue-500/50 bg-blue-500/10 text-blue-500",
    },
    coming_soon: {
      label: t("comp_detail.status_coming_soon") || "Coming Soon",
      className: "border-purple-500/50 bg-purple-500/10 text-purple-500",
    },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">{t("nav.receptionist") || "Receptionist"}</h1>
        <div className="flex items-center gap-3">
          <SearchInput
            placeholder={t("manage_competitions.search_placeholder") || "Search by title..."}
            value={searchQuery}
            onSearch={(val) => {
              setSearchQuery(val);
              setCurrentPage(1);
            }}
            className="w-64 bg-background border-border"
          />
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="rounded-xl border border-border bg-card overflow-hidden p-12 text-center text-muted-foreground">
          Loading...
        </div>
      ) : (
        <DataTable
          columns={recColumns}
          data={tableData as Record<string, unknown>[]}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={goToPage}
          onRowClick={(row) => router.push(`/receptionist/${row.id}`)}
        />
      )}

      {/* Poster Preview Dialog */}
      <Dialog open={!!previewPoster} onOpenChange={() => setPreviewPoster(null)}>
        <DialogContent className="max-w-lg p-2">
          <DialogTitle className="sr-only">Poster Preview</DialogTitle>
          {previewPoster && (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium px-2 pt-2">{previewPoster.title}</p>
              <img
                src={previewPoster.url}
                alt={previewPoster.title}
                className="w-full rounded-md object-contain max-h-[70vh]"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
