"use client";

import { useTranslation } from "@/lib/i18n";
import { DataTable } from "@/components/dashboard/data-table";
import { SearchInput } from "@/components/shared/search-input";
import { useTemplatesTable } from "./_hooks/use-templates-table";
import { getTemplateColumns } from "./_components/template-columns";
import { TemplateDialog } from "./_components/template-dialogs";
import { RejectionTemplate } from "@/types/rejection-template";

export function TemplateTable() {
  const { t } = useTranslation();
  const {
    data,
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
  } = useTemplatesTable();

  const handleEdit = (item: RejectionTemplate) => {
    setEditingTemplate(item);
    setFormType(item.type || "quiz");
    setIsDialogOpen(true);
  };

  const columns = getTemplateColumns(t, handleToggle, handleEdit, handleDelete);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
              handlePageChange(1);
            }}
            className="w-64 bg-background border-border"
          />

          <TemplateDialog
            t={t}
            isOpen={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            editingTemplate={editingTemplate}
            setEditingTemplate={setEditingTemplate}
            formType={formType}
            setFormType={setFormType}
            onSubmit={handleSubmit}
            loading={loading}
          />
        </div>
      </div>

      <div className={loading ? "opacity-60 pointer-events-none" : ""}>
        <DataTable
          columns={columns}
          data={data as any}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
}
