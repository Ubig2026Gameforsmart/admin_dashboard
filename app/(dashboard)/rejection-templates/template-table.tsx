"use client";

import { useTranslation } from "@/lib/i18n";
import { DataTable } from "@/components/dashboard/data-table";
import { useEffect, useState, useMemo } from "react";
import { getTemplates, createTemplate, updateTemplate, deleteTemplate, toggleTemplateStatus } from "./actions";
import { Button } from "@/components/ui/button";
import { Plus, Edit2, Trash2, Search, MoreVertical } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { SearchInput } from "@/components/shared/search-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function TemplateTable() {
  const { t } = useTranslation();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formType, setFormType] = useState("quiz");
  const { toast } = useToast();

  useEffect(() => {
    fetchTemplates();
  }, []);

  async function fetchTemplates() {
    setLoading(true);
    const templates = await getTemplates();
    setData(templates);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("type", formType);
    let result;
    
    if (editingTemplate) {
      formData.append("id", editingTemplate.id);
      formData.set("is_active", editingTemplate.is_active ? "true" : "false");
      result = await updateTemplate(formData);
    } else {
      result = await createTemplate(formData);
    }

    if (result?.error) {
      toast({
        title: t("msg.error") || "Error",
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast({
        title: t("msg.success") || "Success",
        description: t("rejection_templates.saved") || "Template saved successfully.",
      });
      setIsDialogOpen(false);
      setEditingTemplate(null);
      fetchTemplates();
    }
  }

  async function handleDelete(id: string) {
    if (confirm(t("rejection_templates.confirm_delete") || "Are you sure you want to delete this template?")) {
      const result = await deleteTemplate(id);
      if (result?.error) {
        toast({
          title: t("msg.error") || "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: t("msg.success") || "Success",
          description: t("rejection_templates.deleted") || "Template deleted successfully.",
        });
        fetchTemplates();
      }
    }
  }

  async function handleToggle(id: string, currentStatus: boolean) {
    const result = await toggleTemplateStatus(id, !currentStatus);
    if (result?.error) {
      toast({
        title: t("msg.error") || "Error",
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast({
        title: t("msg.success") || "Success",
        description: "Status updated successfully.",
      });
      fetchTemplates();
    }
  }

  const filteredData = data.filter((item) => 
    item.reason_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.reason_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const ITEMS_PER_PAGE = 15;
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredData.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredData, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const columns = [
    { 
      label: t("rejection_templates.reason_en") || "Reason (English)", 
      key: "reason_en",
      render: (val: unknown) => (
        <span className="block max-w-[220px] truncate" title={val as string}>
          {val as string}
        </span>
      ),
    },
    { 
      label: t("rejection_templates.reason_id") || "Reason (Indonesian)", 
      key: "reason_id",
      render: (val: unknown) => (
        <span className="block max-w-[220px] truncate" title={val as string}>
          {val as string}
        </span>
      ),
    },
    { 
      label: t("rejection_templates.status") || "Status", 
      key: "is_active", 
      render: (val: unknown, item: Record<string, unknown>) => (
        <DropdownMenu>
          <DropdownMenuTrigger className="focus:outline-none">
            <span className={`cursor-pointer px-2 py-1 rounded-full text-xs font-semibold ${val ? 'bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30' : 'bg-red-500/20 text-red-500 hover:bg-red-500/30'}`}>
              {val ? (t("rejection_templates.active") || "Active") : (t("rejection_templates.inactive") || "Inactive")}
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem 
              onClick={() => handleToggle(item.id as string, val as boolean)}
              className="cursor-pointer"
            >
              Set to {val ? (t("rejection_templates.inactive") || "Inactive") : (t("rejection_templates.active") || "Active")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
    { 
      label: t("rejection_templates.type") || "Type", 
      key: "type",
      render: (val: unknown) => {
        const str = val as string;
        if (!str) return "-";
        return str.charAt(0).toUpperCase() + str.slice(1);
      },
    },
    {
      label: t("table.actions") || "Actions",
      key: "id",
      render: (_id: unknown, item: Record<string, unknown>) => (
        <DropdownMenu>
          <DropdownMenuTrigger className="focus:outline-none">
            <div className="cursor-pointer hover:opacity-80 p-1 rounded hover:bg-muted text-muted-foreground">
              <MoreVertical className="h-4 w-4" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem 
              onClick={() => {
                setEditingTemplate(item);
                setFormType((item.type as string) || "quiz");
                setIsDialogOpen(true);
              }}
              className="cursor-pointer"
            >
              <Edit2 className="h-4 w-4 mr-2" />
              {t("action.edit") || "Edit"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => handleDelete(item.id as string)}
              className="cursor-pointer text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t("action.delete") || "Delete"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {t("page.rejection_templates") || "Rejection Templates"}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <SearchInput
            placeholder={t("rejection.search") || "Search templates..."}
            value={searchTerm}
            onSearch={(val) => {
              setSearchTerm(val);
              setCurrentPage(1);
            }}
            className="w-64 bg-background border-border"
          />

          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingTemplate(null);
              setFormType("quiz");
            }
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                {t("rejection_templates.add") || "Add Template"}
              </Button>
            </DialogTrigger>
          <DialogContent showCloseButton={false}>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingTemplate ? (t("rejection_templates.edit") || "Edit Template") : (t("rejection_templates.add") || "Add Template")}
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="reason_en">{t("rejection_templates.reason_en") || "Reason (English)"}</Label>
                  <Input 
                    id="reason_en"
                    name="reason_en" 
                    defaultValue={editingTemplate?.reason_en} 
                    placeholder={t("rejection_templates.enter_reason_en") || "Enter reason in English..."} 
                    required 
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="reason_id">{t("rejection_templates.reason_id") || "Reason (Indonesian)"}</Label>
                  <Input 
                    id="reason_id"
                    name="reason_id" 
                    defaultValue={editingTemplate?.reason_id} 
                    placeholder={t("rejection_templates.enter_reason_id") || "Enter reason in Indonesian..."} 
                    required 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>{t("rejection_templates.type") || "Type"}</Label>
                    <Select
                      value={formType}
                      onValueChange={(value) => setFormType(value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="quiz">Quiz</SelectItem>
                        <SelectItem value="user">User Report</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {editingTemplate && (
                    <div className="grid gap-2">
                      <Label>{t("rejection_templates.status") || "Status"}</Label>
                      <Select
                        value={editingTemplate?.is_active ? "active" : "inactive"}
                        onValueChange={(value) => setEditingTemplate({...editingTemplate, is_active: value === "active"})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">{t("rejection_templates.active") || "Active"}</SelectItem>
                          <SelectItem value="inactive">{t("rejection_templates.inactive") || "Inactive"}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  {t("action.cancel") || "Cancel"}
                </Button>
                <Button type="submit" disabled={loading}>
                  {t("action.save") || "Save"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className={loading ? "opacity-60 pointer-events-none" : ""}>
        <DataTable 
          columns={columns} 
          data={paginatedData as Record<string, unknown>[]} 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
}

