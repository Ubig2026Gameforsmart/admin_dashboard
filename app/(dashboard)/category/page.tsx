"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "@/lib/i18n";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { Search, Plus, Edit2, Archive, ArchiveRestore } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SearchInput } from "@/components/shared/search-input";
import { DataTable } from "@/components/dashboard/data-table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface Category {
  id: string;
  name: string;
  status: string;
  created_at: string;
  competitions_count?: number;
}

export default function CategoryPage() {
  const { t } = useTranslation();
  const supabase = getSupabaseBrowserClient();
  const { toast } = useToast();

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    status: "active",
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    setIsLoading(true);
    try {
      // Fetch categories
      const { data: catData, error: catError } = await supabase
        .from("competition_categories")
        .select("*")
        .order("created_at", { ascending: false });

      if (catError) throw catError;

      // Fetch competitions to count usages
      const { data: compData, error: compError } = await supabase
        .from("competitions")
        .select("category");

      if (compError) throw compError;

      const comps = compData || [];
      const formattedCategories = (catData || []).map((cat) => {
        // Count how many competitions use this category name (case-insensitive & split by comma)
        let count = 0;
        comps.forEach((c) => {
          if (c.category) {
            const usedCats = c.category.split(",").map((s: string) => s.trim().toLowerCase());
            if (usedCats.includes(cat.name.toLowerCase())) {
              count++;
            }
          }
        });

        return {
          ...cat,
          competitions_count: count,
        };
      });

      setCategories(formattedCategories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast({
        title: t("msg.error") || "Error",
        description: "Failed to load categories.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const ITEMS_PER_PAGE = 15;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const catColumns = [
    {
      key: "name",
      label: t("table.name") || "Name",
      render: (value: unknown) => <span className="font-medium">{value as string}</span>,
    },
    {
      key: "status",
      label: t("table.status") || "Status",
      render: (value: unknown) => {
        const status = value as string;
        return (
          <Badge
            variant="outline"
            className={`capitalize border ${
              status === "active"
                ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-500"
                : "border-gray-500/50 bg-gray-500/10 text-gray-500"
            }`}
          >
            {status === "active" ? t("status.active") || "Active" : "Inactive"}
          </Badge>
        );
      },
    },
    {
      key: "competitions_count",
      label: "Competitions Count",
      render: (value: unknown) => (
        <Badge variant="secondary">
          {value as number} {t("nav.competition") || "Competition"}
        </Badge>
      ),
    },
    {
      key: "actions",
      label: t("table.actions") || "Actions",
      align: "right" as const,
      render: (value: unknown, row: Record<string, unknown>) => {
        const cat = categories.find((c) => c.id === row.id);
        if (!cat) return null;
        return (
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => { e.stopPropagation(); handleOpenDialog(cat); }}
              title={t("action.edit") || "Edit"}
            >
              <Edit2 className="h-4 w-4 text-blue-500" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => { e.stopPropagation(); handleToggleStatus(cat); }}
              title={cat.status === "active" ? "Deactivate" : "Activate"}
            >
              {cat.status === "active" ? (
                <Archive className="h-4 w-4 text-yellow-500" />
              ) : (
                <ArchiveRestore className="h-4 w-4 text-emerald-500" />
              )}
            </Button>
          </div>
        );
      },
    },
  ];

  const tableData = paginated.map((cat) => ({
    id: cat.id,
    name: cat.name,
    status: cat.status,
    competitions_count: cat.competitions_count ?? 0,
    actions: null,
  }));

  const handleOpenDialog = (cat?: Category) => {
    if (cat) {
      setEditingCategory(cat);
      setFormData({
        name: cat.name,
        status: cat.status,
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: "",
        status: "active",
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) return;
    
    setIsSaving(true);
    try {
      if (editingCategory) {
        const { error } = await supabase
          .from("competition_categories")
          .update({
            name: formData.name.trim(),
            status: formData.status,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingCategory.id);

        if (error) throw error;
        toast({
          title: t("msg.success") || "Success",
          description: "Category updated successfully.",
        });
      } else {
        const { error } = await supabase
          .from("competition_categories")
          .insert([
            {
              name: formData.name.trim(),
              status: formData.status,
            },
          ]);

        if (error) throw error;
        toast({
          title: t("msg.success") || "Success",
          description: "Category created successfully.",
        });
      }

      setIsDialogOpen(false);
      fetchCategories();
    } catch (error) {
      console.error("Error saving category:", error);
      toast({
        title: t("msg.error") || "Error",
        description: "Failed to save category.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (cat: Category) => {
    try {
      const newStatus = cat.status === "active" ? "inactive" : "active";
      const { error } = await supabase
        .from("competition_categories")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", cat.id);

      if (error) throw error;
      
      toast({
        title: t("msg.success") || "Success",
        description: `Category ${newStatus === "active" ? "activated" : "deactivated"} successfully.`,
      });
      fetchCategories();
    } catch (error) {
      console.error("Error toggling status:", error);
      toast({
        title: t("msg.error") || "Error",
        description: "Failed to update category status.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">
          {t("nav.competition_category") || "Category"}
        </h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <SearchInput
              placeholder={t("manage_competitions.search_placeholder") || "Search categories..."}
              className="w-64 bg-background border-border text-sm h-9"
              value={searchQuery}
              onSearch={(val) => setSearchQuery(val)}
            />
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            {t("action.add") || "Add"}
          </Button>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="rounded-xl border border-border bg-card overflow-hidden p-12 text-center text-muted-foreground">
          {t("msg.loading") || "Loading..."}
        </div>
      ) : (
        <DataTable
          columns={catColumns}
          data={tableData as Record<string, unknown>[]}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={goToPage}
        />
      )}

      {/* Dialog Form */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingCategory
                ? t("action.edit") + " " + (t("nav.competition_category") || "Category")
                : t("action.add") + " " + (t("nav.competition_category") || "Category")}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="name" className="text-sm font-medium">
                {t("table.name") || "Name"} <span className="text-red-500">*</span>
              </label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. E-Sports"
              />
            </div>
            {editingCategory && (
              <div className="grid gap-2">
                <label className="text-sm font-medium">{t("table.status") || "Status"}</label>
                <Select
                  value={formData.status}
                  onValueChange={(val) => setFormData({ ...formData, status: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">{t("status.active") || "Active"}</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSaving}>
              {t("action.cancel") || "Cancel"}
            </Button>
            <Button onClick={handleSave} disabled={!formData.name.trim() || isSaving}>
              {isSaving ? (t("msg.loading") || "Saving...") : (t("action.save") || "Save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
