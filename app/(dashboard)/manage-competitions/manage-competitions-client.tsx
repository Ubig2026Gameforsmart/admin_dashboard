"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { useTranslation } from "@/lib/i18n";
import { toast } from "sonner";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { generateXID } from "@/lib/id-generator";
import {
  Plus,
  Search,
  MoreHorizontal,
  Image as ImageIcon,
  Edit,
  Trash2,
  Eye,
  CalendarDays,
  Users,
  Upload,
  X,
  GraduationCap,
  BookOpen,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

// --- DUMMY DATA ---
interface Competition {
  id: string;
  title: string;
  slug: string;
  status: "draft" | "published" | "completed";
  regStartDate: string;
  regEndDate: string;
  finalEndDate: string | null;
  posterUrl: string | null;
  participantCount: number;
  category: string | null;
}
const DUMMY: Competition[] = [
  {
    id: "comp_1",
    title: "Cerdas Cermat Online - Sains",
    slug: "cerdas-cermat-online-sains",
    status: "published",
    regStartDate: "2026-03-10T08:00:00Z",
    regEndDate: "2026-03-12T17:00:00Z",
    finalEndDate: "2026-03-20T17:00:00Z",
    posterUrl: "/images/poster1.jpg",
    participantCount: 1542,
    category: "SMP, SMA",
  },
  {
    id: "comp_2",
    title: "Cerdas Cermat Online - Matematika",
    slug: "cerdas-cermat-online-matematika",
    status: "published",
    regStartDate: "2026-04-15T09:00:00Z",
    regEndDate: "2026-04-17T15:00:00Z",
    finalEndDate: "2026-04-25T15:00:00Z",
    posterUrl: "/images/poster1.jpg",
    participantCount: 870,
    category: "SD",
  },
  {
    id: "comp_3",
    title: "Cerdas Cermat Online - Bahasa Inggris",
    slug: "cerdas-cermat-online-bahasa-inggris",
    status: "published",
    regStartDate: "2026-05-20T10:00:00Z",
    regEndDate: "2026-05-22T18:00:00Z",
    finalEndDate: "2026-05-30T18:00:00Z",
    posterUrl: "/images/poster1.jpg",
    participantCount: 634,
    category: "SMA, College",
  },
  {
    id: "comp_4",
    title: "Cerdas Cermat Online - IPS",
    slug: "cerdas-cermat-online-ips",
    status: "published",
    regStartDate: "2026-06-01T09:00:00Z",
    regEndDate: "2026-06-03T17:00:00Z",
    finalEndDate: "2026-06-10T17:00:00Z",
    posterUrl: "/images/poster1.jpg",
    participantCount: 421,
    category: "Others",
  },
];

export function ManageCompetitionsClient() {
  const router = useRouter();
  const { t } = useTranslation();
  const supabase = getSupabaseBrowserClient();
  
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [previewPoster, setPreviewPoster] = useState<{ url: string; title: string } | null>(null);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<Competition | null>(null);
  const [deleteConfirmationPhrase, setDeleteConfirmationPhrase] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function getCompetitions() {
      const { data, error } = await supabase
        .from("competitions")
        .select(`
          id, title, slug, status, registration_start_date, registration_end_date, final_end_date, poster_url, category,
          participants:competition_participants(count)
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching competitions:", error);
      } else {
        const mapped = data?.map((d: any) => ({
          id: d.id,
          title: d.title,
          slug: d.slug,
          status: d.status,
          regStartDate: d.registration_start_date,
          regEndDate: d.registration_end_date,
          finalEndDate: d.final_end_date,
          posterUrl: d.poster_url,
          category: d.category,
          participantCount: d.participants[0]?.count || 0,
        })) || [];
        setCompetitions(mapped);
      }
      setIsLoading(false);
    }
    getCompetitions();
  }, [supabase]);

  const statusConfig: Record<string, any> = {
    published: {
      label: t("comp_detail.status_published") || "Published",
      className: "bg-emerald-500/15 text-emerald-600 border-emerald-200 dark:text-emerald-400 dark:border-emerald-800",
    },
    draft: {
      label: t("comp_detail.status_draft") || "Draft",
      className: "bg-gray-500/15 text-gray-500 border-gray-200 dark:text-gray-400 dark:border-gray-700",
    },
    completed: {
      label: t("comp_detail.status_completed") || "Completed",
      className: "bg-blue-500/15 text-blue-600 border-blue-200 dark:text-blue-400 dark:border-blue-800",
    },
    coming_soon: {
      label: t("comp_detail.status_coming_soon") || "Coming Soon",
    },
  };

  const filtered = competitions.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSearch = () => setSearchQuery(searchInput);
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleDeleteCompetition = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase.from("competitions").delete().eq("id", deleteTarget.id);
      if (error) throw error;
      setCompetitions(competitions.filter(c => c.id !== deleteTarget.id));
      toast.success("Competition deleted successfully");
      setDeleteTarget(null);
      setDeleteConfirmationPhrase("");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to delete competition");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">{t("manage_competitions.title") || "Competitions"}</h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Input
              placeholder={t("manage_competitions.search_placeholder") || "Search by title..."}
              className="pr-10 w-64 bg-background border-border"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              onClick={handleSearch}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
            >
              <Search className="h-3.5 w-3.5" />
            </button>
          </div>
          <Button className="gap-1.5" onClick={() => router.push("/manage-competitions/add")}>
            <Plus className="h-4 w-4" />
            {t("action.add") || "Add"}
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">{t("manage_competitions.table_poster") || "Poster"}</TableHead>
              <TableHead>{t("manage_competitions.table_title") || "Title"}</TableHead>
              <TableHead>{t("table.category") || "Category"}</TableHead>
              <TableHead>{t("manage_competitions.table_status") || "Status"}</TableHead>
              <TableHead>{t("manage_competitions.table_schedule") || "Schedule"}</TableHead>
              <TableHead className="text-center">{t("manage_competitions.table_participants") || "Participants"}</TableHead>
              <TableHead className="w-[60px] text-right">{t("manage_competitions.table_actions") || "Actions"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
               <TableRow>
                 <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                   Loading competitions...
                 </TableCell>
               </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  {t("manage_competitions.no_found") || "No competitions found."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((comp) => {
                const cfg = statusConfig[comp.status];
                return (
                  <TableRow key={comp.id} className="cursor-pointer hover:bg-muted/50" onClick={() => router.push(`/manage-competitions/${comp.id}`)}>
                    {/* Poster */}
                    <TableCell>
                      <div
                        className={`h-10 w-14 rounded overflow-hidden bg-muted flex items-center justify-center border shrink-0 ${comp.posterUrl ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (comp.posterUrl) setPreviewPoster({ url: comp.posterUrl, title: comp.title });
                        }}
                      >
                        {comp.posterUrl ? (
                          <img src={comp.posterUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <ImageIcon className="h-4 w-4 text-muted-foreground/30" />
                        )}
                      </div>
                    </TableCell>

                    {/* Title */}
                    <TableCell>
                      <span className="font-medium truncate block max-w-[250px]" title={comp.title}>
                        {comp.title}
                      </span>
                    </TableCell>

                    {/* Category */}
                    <TableCell>
                      {comp.category ? (() => {
                        const labels = comp.category.split(',').map(c => {
                          const key = c.trim();
                          if (key === "SD") return t("category.sd") || "SD";
                          if (key === "SMP") return t("category.smp") || "SMP";
                          if (key === "SMA") return t("category.sma") || "SMA/SMK";
                          if (key === "College") return t("category.college") || "Mahasiswa";
                          if (key === "Others") return t("category.others") || "Umum";
                          return key;
                        });
                        const fullText = labels.join(", ");
                        return (
                          <span
                            className="text-sm text-muted-foreground truncate block max-w-[150px]"
                            title={fullText}
                          >
                            {fullText}
                          </span>
                        );
                      })() : <span className="text-muted-foreground">—</span>}
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <Badge variant="outline" className={`capitalize border ${cfg.className}`}>
                        {cfg.label}
                      </Badge>
                    </TableCell>

                    {/* Schedule */}
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs whitespace-nowrap">
                        <span>{comp.regStartDate ? format(new Date(comp.regStartDate), "d MMM yyyy") : "—"}</span>
                        <span className="text-muted-foreground">—</span>
                        <span>{(comp.finalEndDate || comp.regEndDate) ? format(new Date(comp.finalEndDate || comp.regEndDate), "d MMM yyyy") : "—"}</span>
                      </div>
                    </TableCell>

                    {/* Participants */}
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1 text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                        <span>{comp.participantCount.toLocaleString("id-ID")}</span>
                      </div>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            className="cursor-pointer text-destructive focus:bg-destructive focus:text-destructive-foreground"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTarget(comp);
                              setDeleteConfirmationPhrase("");
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t("action.delete") || "Delete"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

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

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete Competition</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              This action cannot be undone.
            </p>
            <Label className="text-sm font-medium mb-2 block">
              Please type <span className="font-bold select-none">Delete Competition</span> to confirm.
            </Label>
            <Input
              value={deleteConfirmationPhrase}
              onChange={(e) => setDeleteConfirmationPhrase(e.target.value)}
              placeholder="Type 'Delete Competition'"
              autoComplete="off"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteConfirmationPhrase !== "Delete Competition" || isDeleting}
              onClick={handleDeleteCompetition}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
