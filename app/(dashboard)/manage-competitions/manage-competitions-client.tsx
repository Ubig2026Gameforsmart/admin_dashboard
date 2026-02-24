"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { useTranslation } from "@/lib/i18n";
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
  startDate: string;
  endDate: string;
  posterUrl: string | null;
  participantCount: number;
}

const DUMMY: Competition[] = [
  {
    id: "comp_1",
    title: "Cerdas Cermat Online - Sains",
    slug: "cerdas-cermat-online-sains",
    status: "published",
    startDate: "2026-03-10T08:00:00Z",
    endDate: "2026-03-12T17:00:00Z",
    posterUrl: "/images/poster1.jpg",
    participantCount: 1542,
  },
  {
    id: "comp_2",
    title: "Cerdas Cermat Online - Matematika",
    slug: "cerdas-cermat-online-matematika",
    status: "published",
    startDate: "2026-04-15T09:00:00Z",
    endDate: "2026-04-17T15:00:00Z",
    posterUrl: "/images/poster1.jpg",
    participantCount: 870,
  },
  {
    id: "comp_3",
    title: "Cerdas Cermat Online - Bahasa Inggris",
    slug: "cerdas-cermat-online-bahasa-inggris",
    status: "published",
    startDate: "2026-05-20T10:00:00Z",
    endDate: "2026-05-22T18:00:00Z",
    posterUrl: "/images/poster1.jpg",
    participantCount: 634,
  },
  {
    id: "comp_4",
    title: "Cerdas Cermat Online - IPS",
    slug: "cerdas-cermat-online-ips",
    status: "published",
    startDate: "2026-06-01T09:00:00Z",
    endDate: "2026-06-03T17:00:00Z",
    posterUrl: "/images/poster1.jpg",
    participantCount: 421,
  },
];

export function ManageCompetitionsClient() {
  const router = useRouter();
  const { t } = useTranslation();
  
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [previewPoster, setPreviewPoster] = useState<{ url: string; title: string } | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form state (dummy, belum tersimpan ke DB)
  const [formPosterPreview, setFormPosterPreview] = useState<string | null>(null);

  const statusConfig = {
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
  };

  const filtered = DUMMY.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSearch = () => setSearchQuery(searchInput);
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearch();
  };

  const handlePosterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormPosterPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleCloseAdd = () => {
    setIsAddOpen(false);
    setFormPosterPreview(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">{t("manage_competitions.title") || "Manage Competitions"}</h1>
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
          <Button className="gap-1.5" onClick={() => setIsAddOpen(true)}>
            <Plus className="h-4 w-4" />
            {t("manage_competitions.add_button") || "Add Competition"}
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
              <TableHead>{t("manage_competitions.table_status") || "Status"}</TableHead>
              <TableHead>{t("manage_competitions.table_schedule") || "Schedule"}</TableHead>
              <TableHead className="text-center">{t("manage_competitions.table_participants") || "Participants"}</TableHead>
              <TableHead className="w-[60px] text-right">{t("manage_competitions.table_actions") || "Actions"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
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

                    {/* Title + Slug */}
                    <TableCell>
                      <div className="flex flex-col min-w-0">
                        <span className="font-medium truncate max-w-[250px]" title={comp.title}>
                          {comp.title}
                        </span>
                        <span className="text-xs text-muted-foreground font-mono">/{comp.slug}</span>
                      </div>
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
                        <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{format(new Date(comp.startDate), "dd MMM yyyy")}</span>
                        <span className="text-muted-foreground">—</span>
                        <span>{format(new Date(comp.endDate), "dd MMM yyyy")}</span>
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
                            onClick={(e) => e.stopPropagation()}
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

      {/* Add Competition Dialog */}
      <Dialog open={isAddOpen} onOpenChange={handleCloseAdd}>
        <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("manage_competitions.add_dialog_title") || "Add Competition"}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            {/* Title */}
            <div className="grid gap-2">
              <Label htmlFor="comp-title">{t("manage_competitions.form_title") || "Title"}</Label>
              <Input id="comp-title" placeholder="e.g. Cerdas Cermat Online - Sains" />
            </div>

            {/* Description */}
            <div className="grid gap-2">
              <Label htmlFor="comp-desc">{t("manage_competitions.form_desc") || "Description"}</Label>
              <Textarea
                id="comp-desc"
                placeholder="Write competition details, prizes..."
                rows={4}
              />
            </div>

            {/* Rules */}
            <div className="grid gap-2">
              <Label htmlFor="comp-rules">{t("manage_competitions.form_rules") || "Rules"}</Label>
              <Textarea
                id="comp-rules"
                placeholder="1. Each participant may only register once&#10;2. ...&#10;3. ..."
                rows={4}
              />
            </div>

            {/* Poster Upload */}
            <div className="grid gap-2">
              <Label>{t("manage_competitions.form_poster") || "Poster"}</Label>
              {formPosterPreview ? (
                <div className="relative rounded-md overflow-hidden border bg-muted">
                  <img
                    src={formPosterPreview}
                    alt="Poster preview"
                    className="w-full max-h-48 object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => setFormPosterPreview(null)}
                    className="absolute top-2 right-2 h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="poster-upload"
                  className="flex flex-col items-center justify-center h-32 rounded-md border-2 border-dashed border-muted-foreground/25 bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <Upload className="h-6 w-6 text-muted-foreground/50 mb-2" />
                  <span className="text-sm text-muted-foreground">{t("manage_competitions.form_upload_poster") || "Click to upload poster"}</span>
                  <span className="text-[11px] text-muted-foreground/60 mt-0.5">JPG, PNG up to 5MB</span>
                  <input
                    id="poster-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePosterChange}
                  />
                </label>
              )}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="comp-start">{t("manage_competitions.form_start_date") || "Start Date"}</Label>
                <Input id="comp-start" type="date" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="comp-end">{t("manage_competitions.form_end_date") || "End Date"}</Label>
                <Input id="comp-end" type="date" />
              </div>
            </div>

            {/* Status & Registration Fee & Total Prize */}
            <div className="grid grid-cols-3 gap-3">
              <div className="grid gap-2">
                <Label>{t("manage_competitions.form_status") || "Status"}</Label>
                <Select defaultValue="draft">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">{t("comp_detail.status_draft") || "Draft"}</SelectItem>
                    <SelectItem value="published">{t("comp_detail.status_published") || "Published"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>{t("manage_competitions.form_reg_fee") || "Registration Fee"}</Label>
                <Select defaultValue="25000">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25000">Rp 25.000</SelectItem>
                    <SelectItem value="50000">Rp 50.000</SelectItem>
                    <SelectItem value="100000">Rp 100.000</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>{t("manage_competitions.form_prize") || "Total Prize"}</Label>
                <Select defaultValue="5000000">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5000000">Rp 5.000.000</SelectItem>
                    <SelectItem value="10000000">Rp 10.000.000</SelectItem>
                    <SelectItem value="20000000">Rp 20.000.000</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Registration Link */}
            <div className="grid gap-2">
              <Label htmlFor="comp-link">{t("manage_competitions.form_reg_link") || "Registration Link"} <span className="text-muted-foreground font-normal">{t("manage_competitions.form_reg_link_opt") || "(optional)"}</span></Label>
              <Input id="comp-link" placeholder="https://..." />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseAdd}>{t("action.cancel") || "Cancel"}</Button>
            <Button onClick={handleCloseAdd}>{t("manage_competitions.form_save") || "Save Competition"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
