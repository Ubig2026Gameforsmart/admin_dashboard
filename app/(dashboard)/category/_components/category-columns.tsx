"use client";

import { Edit2, Archive, ArchiveRestore } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Category } from "@/types/category";

interface GetCategoryColumnsProps {
  t: (key: string) => string;
  handleOpenDialog: (cat: Category) => void;
  handleToggleStatus: (cat: Category) => void;
  categories: Category[];
}

export function getCategoryColumns({
  t,
  handleOpenDialog,
  handleToggleStatus,
  categories,
}: GetCategoryColumnsProps) {
  return [
    {
      key: "name",
      label: t("table.name") || "Name",
      render: (value: unknown) => (
        <span className="font-medium">{value as string}</span>
      ),
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
              onClick={(e) => {
                e.stopPropagation();
                handleOpenDialog(cat);
              }}
              title={t("action.edit") || "Edit"}
            >
              <Edit2 className="h-4 w-4 text-blue-500" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                handleToggleStatus(cat);
              }}
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
}
