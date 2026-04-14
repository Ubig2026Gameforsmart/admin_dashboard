import { useState, useMemo, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { RejectionTemplate } from "@/types/rejection-template";
import {
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  toggleTemplateStatus,
} from "../actions";

export function useTemplatesTable() {
  const [data, setData] = useState<RejectionTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [editingTemplate, setEditingTemplate] = useState<RejectionTemplate | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formType, setFormType] = useState("quiz");
  const { toast } = useToast();

  const fetchTemplates = async () => {
    setLoading(true);
    const templates = await getTemplates();
    setData(templates as RejectionTemplate[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>, t: any) => {
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
  };

  const handleDelete = async (id: string, t: any) => {
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
  };

  const handleToggle = async (id: string, currentStatus: boolean, t: any) => {
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
  };

  const filteredData = data.filter(
    (item) =>
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

  return {
    data: paginatedData,
    loading,
    searchTerm,
    setSearchTerm,
    currentPage,
    totalPages,
    handlePageChange,
    editingTemplate,
    setEditingTemplate,
    isDialogOpen,
    setIsDialogOpen,
    formType,
    setFormType,
    handleSubmit,
    handleDelete,
    handleToggle,
  };
}
