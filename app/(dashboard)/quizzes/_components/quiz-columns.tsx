"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export const visibilityColors: Record<string, string> = {
  Public: "bg-[var(--success)]/20 text-[var(--success)] border-[var(--success)]/30",
  Private: "bg-[var(--warning)]/20 text-[var(--warning)] border-[var(--warning)]/30",
};

export const statusColors: Record<string, string> = {
  Active: "bg-blue-500/20 text-blue-500 border-blue-500/30",
  Block: "bg-red-500/20 text-red-500 border-red-500/30",
};

export function capitalizeFirst(str: string) {
  if (!str || str === "-") return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

interface GetQuizColumnsProps {
  t: (key: string) => string;
  openConfirmDialog: (
    id: string,
    currentValue: string,
    newValue: string,
    quizTitle: string
  ) => void;
  openBlockDialog: (id: string, quizTitle: string) => void;
  openUnblockDialog: (id: string, quizTitle: string) => void;
}

export function getQuizColumns({
  t,
  openConfirmDialog,
  openBlockDialog,
  openUnblockDialog,
}: GetQuizColumnsProps) {
  return [
    {
      key: "title",
      label: t("table.title"),
      render: (value: unknown) => (
        <span className="block max-w-[200px] truncate" title={value as string}>
          {value as string}
        </span>
      ),
    },
    {
      key: "creator",
      label: t("table.creator"),
      render: (value: unknown, row: Record<string, unknown>) => {
        const creator = value as {
          id: string;
          username: string;
          fullname: string;
          avatar_url: string;
        } | null;
        if (!creator) return <span className="text-muted-foreground">-</span>;
        return (
          <div className="flex items-center gap-2">
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
          </div>
        );
      },
    },
    {
      key: "category",
      label: t("table.category"),
      render: (value: unknown) => {
        const catValue = value as string;
        const category =
          t(`category.${catValue?.toLowerCase()?.replace(" ", "_")}`) ||
          capitalizeFirst(catValue);
        return (
          <span className="block max-w-[120px] truncate" title={category}>
            {category}
          </span>
        );
      },
    },
    { key: "questions", label: t("table.questions") },
    {
      key: "language",
      label: t("table.language"),
      render: (value: unknown) => capitalizeFirst(value as string),
    },
    {
      key: "difficulty", // Visibility
      label: t("table.visibility"),
      render: (value: unknown, row: Record<string, unknown>) => {
        const visibility = value as string;
        const id = row.id as string;
        const quizTitle = row.title as string;
        return (
          <div
            className="cursor-pointer hover:opacity-80 flex items-center"
            onClick={(e) => {
              e.stopPropagation();
              const targetVisibility =
                visibility === "Public" ? "Private" : "Public";
              openConfirmDialog(id, visibility, targetVisibility, quizTitle);
            }}
          >
            <Badge
              variant="outline"
              className={
                visibilityColors[visibility] ??
                "bg-secondary text-secondary-foreground"
              }
            >
              {visibility === "Public"
                ? t("status.public")
                : t("status.private")}
            </Badge>
          </div>
        );
      },
    },
    { key: "createdAt", label: t("table.created") },
    {
      key: "status",
      label: t("table.status"),
      render: (value: unknown, row: Record<string, unknown>) => {
        const status = value as string;
        const id = row.id as string;
        const quizTitle = row.title as string;
        return (
          <div
            className="cursor-pointer hover:opacity-80 flex items-center"
            onClick={(e) => {
              e.stopPropagation();
              if (status === "Active") {
                openBlockDialog(id, quizTitle);
              } else if (status === "Block") {
                openUnblockDialog(id, quizTitle);
              }
            }}
          >
            <Badge
              variant="outline"
              className={
                statusColors[status] ?? "bg-secondary text-secondary-foreground"
              }
            >
              {status === "Active" ? t("status.active") : t("status.blocked")}
            </Badge>
          </div>
        );
      },
    },
  ];
}
