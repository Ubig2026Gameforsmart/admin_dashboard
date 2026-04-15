"use client";

import Link from "next/link";
import { Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface GetQuizApprovalColumnsProps {
  t: (key: string) => string;
  handleApprove: (id: string, title: string) => void;
  handleReject: (id: string, title: string) => void;
}

export function getQuizApprovalColumns({
  t,
  handleApprove,
  handleReject,
}: GetQuizApprovalColumnsProps) {
  return [
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
}
