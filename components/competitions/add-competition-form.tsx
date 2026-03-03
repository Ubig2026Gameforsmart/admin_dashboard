"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n";
import { toast } from "sonner";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { generateXID } from "@/lib/id-generator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Upload, X, ChevronRight, CalendarDays, Tag } from "lucide-react";
import Link from "next/link";

export function AddCompetitionForm({ initialData, compId }: { initialData?: any; compId?: string }) {
  const { t } = useTranslation();
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  const [formTitle, setFormTitle] = useState(initialData?.title || "");
  const [formDesc, setFormDesc] = useState(initialData?.description || "");
  const [formRules, setFormRules] = useState(initialData?.rules ? initialData.rules.join("\n") : "");
  const [regStart, setRegStart] = useState(initialData?.registration_start_date ? new Date(initialData.registration_start_date).toISOString().split('T')[0] : "");
  const [regEnd, setRegEnd] = useState(initialData?.registration_end_date ? new Date(initialData.registration_end_date).toISOString().split('T')[0] : "");
  const [qualStart, setQualStart] = useState(initialData?.qualification_start_date ? new Date(initialData.qualification_start_date).toISOString().split('T')[0] : "");
  const [qualEnd, setQualEnd] = useState(initialData?.qualification_end_date ? new Date(initialData.qualification_end_date).toISOString().split('T')[0] : "");
  const [finalStart, setFinalStart] = useState(initialData?.final_start_date ? new Date(initialData.final_start_date).toISOString().split('T')[0] : "");
  const [finalEnd, setFinalEnd] = useState(initialData?.final_end_date ? new Date(initialData.final_end_date).toISOString().split('T')[0] : "");
  const [formStatus, setFormStatus] = useState(initialData?.status || "draft");
  const [formCategories, setFormCategories] = useState<string[]>(
    initialData?.category ? initialData.category.split(",").map((s: string) => s.trim()) : []
  );
  const toggleCategory = (cat: string) => {
    setFormCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };
  const CATEGORIES = [
    { id: "SD", tKey: "category.sd", fallback: "SD" },
    { id: "SMP", tKey: "category.smp", fallback: "SMP" },
    { id: "SMA", tKey: "category.sma", fallback: "SMA/SMK" },
    { id: "College", tKey: "category.college", fallback: "Mahasiswa" },
    { id: "Others", tKey: "category.others", fallback: "Umum" },
  ];
  const [formFee, setFormFee] = useState(initialData?.registration_fee?.toString() || "25000");
  const [formPrize, setFormPrize] = useState(initialData?.prize_pool?.toString() || "5000000");
  const [formLink, setFormLink] = useState(initialData?.registration_link || "");
  const [formPosterFile, setFormPosterFile] = useState<File | null>(null);
  const [formPosterPreview, setFormPosterPreview] = useState<string | null>(initialData?.poster_url || null);
  const [isSaving, setIsSaving] = useState(false);

  // Dialog states
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);

  const handlePosterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size exceeds 5MB limit");
        return;
      }
      setFormPosterFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormPosterPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!formTitle || !regStart || !regEnd) {
      toast.error("Please fill required fields: title, registration dates");
      return;
    }

    setIsSaving(true);
    try {
      let uploadedPosterUrl = initialData?.poster_url || null;

      if (formPosterFile) {
        const fileExt = formPosterFile.name.split(".").pop();
        const filePath = `posters/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("competitions")
          .upload(filePath, formPosterFile, { upsert: true });

        if (uploadError && !uploadError.message.includes("Bucket not found")) {
           throw uploadError;
        }

        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage
            .from("competitions")
            .getPublicUrl(filePath);
          uploadedPosterUrl = publicUrlData.publicUrl;
        }
      }

      const rulesArray = formRules.split("\n").filter((r: string) => r.trim() !== "");

      if (compId) {
        const slug = formTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + compId.substring(0, 4);
        const updateData = {
          title: formTitle,
          slug: slug,
          description: formDesc,
          rules: rulesArray,
          registration_start_date: new Date(regStart).toISOString(),
          registration_end_date: new Date(regEnd).toISOString(),
          qualification_start_date: qualStart ? new Date(qualStart).toISOString() : null,
          qualification_end_date: qualEnd ? new Date(qualEnd).toISOString() : null,
          final_start_date: finalStart ? new Date(finalStart).toISOString() : null,
          final_end_date: finalEnd ? new Date(finalEnd).toISOString() : null,
          poster_url: uploadedPosterUrl,
          status: formStatus,
          category: formCategories.length > 0 ? formCategories.join(", ") : null,
          registration_fee: Number(formFee),
          prize_pool: Number(formPrize),
          registration_link: formLink || null,
        };
        const { error } = await supabase.from("competitions").update(updateData).eq("id", compId);
        if (error) throw error;
        toast.success(t("comp_detail.edit") + " Success!");
        router.push(`/manage-competitions/${compId}`);
      } else {
        const newId = generateXID();
        const slug = formTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + newId.substring(0, 4);
        const { error } = await supabase.from("competitions").insert({
          id: newId,
          title: formTitle,
          slug: slug,
          description: formDesc,
          rules: rulesArray,
          registration_start_date: new Date(regStart).toISOString(),
          registration_end_date: new Date(regEnd).toISOString(),
          qualification_start_date: qualStart ? new Date(qualStart).toISOString() : null,
          qualification_end_date: qualEnd ? new Date(qualEnd).toISOString() : null,
          final_start_date: finalStart ? new Date(finalStart).toISOString() : null,
          final_end_date: finalEnd ? new Date(finalEnd).toISOString() : null,
          poster_url: uploadedPosterUrl,
          status: formStatus,
          category: formCategories.length > 0 ? formCategories.join(", ") : null,
          registration_fee: Number(formFee),
          prize_pool: Number(formPrize),
          registration_link: formLink || null,
        });
        if (error) throw error;
        toast.success(t("manage_competitions.form_save") + " Success!");
        router.push("/manage-competitions");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to save competition");
    } finally {
      setIsSaving(false);
    }
  };

  // Helper: format date for display
  const fmtDate = (d: string) => {
    if (!d) return "—";
    const date = new Date(d);
    return date.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  };

  const hasSchedule = regStart || regEnd || qualStart || qualEnd || finalStart || finalEnd;
  const selectedCatLabels = CATEGORIES.filter(c => formCategories.includes(c.id)).map(c => t(c.tKey) || c.fallback);

  return (
    <div className="space-y-6">
      {/* Breadcrumb Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
            {compId ? (
              <Link href={`/manage-competitions/${compId}`} className="hover:text-foreground transition-colors cursor-pointer">
                {t("comp_detail.breadcrumb") || "Competition Detail"}
              </Link>
            ) : (
              <Link href="/manage-competitions" className="hover:text-foreground transition-colors cursor-pointer">
                {t("manage_competitions.title") || "Competitions"}
              </Link>
            )}
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-foreground font-medium">{compId ? t("comp_detail.edit") || "Edit" : t("action.add") || "Add"}</span>
          </nav>
          <h1 className="text-2xl font-bold tracking-tight">{compId ? t("comp_detail.edit") || "Edit Competition" : t("manage_competitions.add_title") || "Add Competition"}</h1>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="cursor-pointer">{compId ? t("action.save") || "Save" : t("action.add") || "Add"}</Button>
      </div>

      {/* Form Card */}
      <div className="rounded-xl border bg-card p-6 space-y-5">
        {/* Title */}
        <div className="grid gap-2">
          <Label htmlFor="comp-title">{t("manage_competitions.form_title") || "Title"}</Label>
          <Input id="comp-title" placeholder="e.g. Cerdas Cermat Online - Sains" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} />
        </div>

        {/* Description */}
        <div className="grid gap-2">
          <Label htmlFor="comp-desc">{t("manage_competitions.form_description") || "Description"}</Label>
          <Textarea
            id="comp-desc"
            placeholder={t("manage_competitions.form_desc_placeholder") || "Write competition details, prizes..."}
            value={formDesc}
            onChange={(e) => setFormDesc(e.target.value)}
          />
        </div>

        {/* Rules */}
        <div className="grid gap-2">
          <Label htmlFor="comp-rules">{t("manage_competitions.form_rules") || "Rules"}</Label>
          <Textarea
            id="comp-rules"
            placeholder={t("manage_competitions.form_rules_placeholder") || "1. Each participant may only register once 2. ... 3. ..."}
            value={formRules}
            onChange={(e) => setFormRules(e.target.value)}
          />
        </div>

        {/* Poster + Schedule & Category triggers */}
        <div className="grid grid-cols-1 lg:grid-cols-[384px_1fr] gap-x-8 gap-y-6">
          {/* Poster Upload */}
          <div className="grid gap-2">
            <Label>{t("manage_competitions.form_poster") || "Poster"}</Label>
            {formPosterPreview ? (
              <div className="relative rounded-md overflow-hidden border bg-muted w-fit h-fit">
                <img
                  src={formPosterPreview}
                  alt="Poster preview"
                  className="w-full max-w-sm max-h-[220px] object-contain"
                />
                <button
                  type="button"
                  onClick={() => { setFormPosterPreview(null); setFormPosterFile(null); }}
                  className="absolute top-2 right-2 h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <label
                htmlFor="poster-upload"
                className="flex flex-col items-center justify-center h-full min-h-[140px] w-full max-w-sm rounded-md border-2 border-dashed border-muted-foreground/25 bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
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

          {/* Schedule & Category — compact triggers */}
          <div className="flex flex-col justify-start gap-4">
            {/* Schedule Trigger */}
            <div className="grid gap-2">
              <Label>{t("manage_competitions.form_schedule") || "Schedule"}</Label>
              <button
                type="button"
                onClick={() => setScheduleOpen(true)}
                className="flex items-start gap-3 w-full rounded-lg border border-border/60 bg-muted/30 hover:bg-muted/50 transition-colors p-3 text-left cursor-pointer"
              >
                <CalendarDays className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
                {hasSchedule ? (
                  <div className="flex flex-col sm:flex-row flex-wrap items-start gap-x-8 gap-y-4 text-sm w-full">
                    <div className="flex flex-col items-start gap-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t("manage_competitions.phase_registration") || "Registration"}</span>
                      <span>{fmtDate(regStart)} — {fmtDate(regEnd)}</span>
                    </div>
                    {(qualStart || qualEnd) && (
                      <div className="flex flex-col items-start gap-1">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t("manage_competitions.phase_qualification") || "Qualification"}</span>
                        <span>{fmtDate(qualStart)} — {fmtDate(qualEnd)}</span>
                      </div>
                    )}
                    {(finalStart || finalEnd) && (
                      <div className="flex flex-col items-start gap-1">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t("manage_competitions.phase_final") || "Final"}</span>
                        <span>{fmtDate(finalStart)} — {fmtDate(finalEnd)}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">{t("manage_competitions.set_schedule") || "Click to set schedule..."}</span>
                )}
              </button>
            </div>

            {/* Category Trigger */}
            <div className="grid gap-2">
              <Label>{t("table.category") || "Category"}</Label>
              <button
                type="button"
                onClick={() => setCategoryOpen(true)}
                className="flex items-center gap-3 w-full rounded-lg border border-border/60 bg-muted/30 hover:bg-muted/50 transition-colors p-3 text-left cursor-pointer"
              >
                <Tag className="h-5 w-5 text-purple-500 shrink-0" />
                {selectedCatLabels.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedCatLabels.map((label, i) => (
                      <Badge key={i} variant="default" className="text-[11px] px-2 py-0.5 font-normal">{label}</Badge>
                    ))}
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">{t("manage_competitions.set_category") || "Click to set category..."}</span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Status, Fee & Prize — full width */}
        <div className="flex flex-wrap xl:flex-nowrap gap-4 w-full">
          <div className="grid gap-2 w-[140px] shrink-0">
            <Label>{t("manage_competitions.form_status") || "Status"}</Label>
            <Select value={formStatus} onValueChange={setFormStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">{t("comp_detail.status_draft") || "Draft"}</SelectItem>
                <SelectItem value="coming_soon">{t("comp_detail.status_coming_soon") || "Coming Soon"}</SelectItem>
                <SelectItem value="published">{t("comp_detail.status_published") || "Published"}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2 w-[120px] shrink-0">
            <Label>{t("manage_competitions.form_reg_fee") || "Registration Fee"}</Label>
            <Select value={formFee} onValueChange={setFormFee}>
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
          <div className="grid gap-2 w-[120px] shrink-0">
            <Label>{t("manage_competitions.form_prize") || "Total Prize"}</Label>
            <Select value={formPrize} onValueChange={setFormPrize}>
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
          <Input id="comp-link" placeholder="https://..." value={formLink} onChange={(e) => setFormLink(e.target.value)} />
        </div>
      </div>

      {/* Schedule Dialog */}
      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-blue-500" />
              {t("manage_competitions.form_schedule") || "Schedule"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-2">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("manage_competitions.phase_registration") || "Registration"}
              </Label>
              <div className="flex items-center gap-2">
                <Input type="date" value={regStart} onChange={(e) => setRegStart(e.target.value)} className="flex-1" />
                <span className="text-xs text-muted-foreground shrink-0">—</span>
                <Input type="date" value={regEnd} onChange={(e) => setRegEnd(e.target.value)} className="flex-1" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("manage_competitions.phase_qualification") || "Qualification"}
              </Label>
              <div className="flex items-center gap-2">
                <Input type="date" value={qualStart} onChange={(e) => setQualStart(e.target.value)} className="flex-1" />
                <span className="text-xs text-muted-foreground shrink-0">—</span>
                <Input type="date" value={qualEnd} onChange={(e) => setQualEnd(e.target.value)} className="flex-1" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("manage_competitions.phase_final") || "Final"}
              </Label>
              <div className="flex items-center gap-2">
                <Input type="date" value={finalStart} onChange={(e) => setFinalStart(e.target.value)} className="flex-1" />
                <span className="text-xs text-muted-foreground shrink-0">—</span>
                <Input type="date" value={finalEnd} onChange={(e) => setFinalEnd(e.target.value)} className="flex-1" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setScheduleOpen(false)} className="cursor-pointer">{t("action.done") || "Done"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={categoryOpen} onOpenChange={setCategoryOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-purple-500" />
              {t("table.category") || "Category"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-wrap gap-2 py-3">
            {CATEGORIES.map((cat) => (
              <Badge
                key={cat.id}
                variant={formCategories.includes(cat.id) ? "default" : "outline"}
                className="cursor-pointer font-normal border-dashed select-none text-sm px-3 py-1.5"
                onClick={() => toggleCategory(cat.id)}
              >
                {t(cat.tKey) || cat.fallback}
              </Badge>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={() => setCategoryOpen(false)} className="cursor-pointer">{t("action.done") || "Done"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
