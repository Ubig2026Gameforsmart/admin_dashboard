import { CompetitionListItem } from "@/types/competition";
import { format } from "date-fns";
import { Users, MoreHorizontal, Image as ImageIcon, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const statusConfig: Record<string, any> = {
  published: {
    labelKey: "comp_detail.status_published",
    fallback: "Published",
    className:
      "bg-emerald-500/15 text-emerald-600 border-emerald-200 dark:text-emerald-400 dark:border-emerald-800",
  },
  draft: {
    labelKey: "comp_detail.status_draft",
    fallback: "Draft",
    className:
      "bg-gray-500/15 text-gray-500 border-gray-200 dark:text-gray-400 dark:border-gray-700",
  },
  completed: {
    labelKey: "comp_detail.status_completed",
    fallback: "Completed",
    className:
      "bg-blue-500/15 text-blue-600 border-blue-200 dark:text-blue-400 dark:border-blue-800",
  },
  coming_soon: {
    labelKey: "comp_detail.status_coming_soon",
    fallback: "Coming Soon",
    className:
      "bg-orange-500/15 text-orange-600 border-orange-200 dark:text-orange-400 dark:border-orange-800",
  },
  finished: {
    labelKey: "comp_detail.status_finished",
    fallback: "Finished",
    className:
      "bg-purple-500/15 text-purple-600 border-purple-200 dark:text-purple-400 dark:border-purple-800",
  },
};

export const getCompetitionColumns = (
  t: any,
  onPreviewPoster: (url: string, title: string) => void,
  onDeleteInitiate: (item: CompetitionListItem) => void
) => [
  {
    key: "poster",
    label: t("manage_competitions.table_poster") || "Poster",
    render: (value: unknown, row: Record<string, unknown>) => {
      const posterUrl = row.poster_url as string | null;
      const title = row.title as string;
      return (
        <div
          className={`h-10 w-14 rounded overflow-hidden bg-muted flex items-center justify-center border shrink-0 ${
            posterUrl ? "cursor-pointer hover:opacity-80 transition-opacity" : ""
          }`}
          onClick={(e) => {
            e.stopPropagation();
            if (posterUrl) onPreviewPoster(posterUrl, title);
          }}
        >
          {posterUrl ? (
            <img src={posterUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImageIcon className="h-4 w-4 text-muted-foreground/30" />
          )}
        </div>
      );
    },
  },
  {
    key: "title",
    label: t("manage_competitions.table_title") || "Title",
    render: (value: unknown) => (
      <span className="font-medium truncate block max-w-[250px]" title={value as string}>
        {value as string}
      </span>
    ),
  },
  {
    key: "categoryDisplay",
    label: t("table.category") || "Category",
    render: (value: unknown) => {
      const cat = value as string;
      return cat ? (
        <span
          className="text-sm text-muted-foreground truncate block max-w-[150px]"
          title={cat}
        >
          {cat}
        </span>
      ) : (
        <span className="text-muted-foreground">&mdash;</span>
      );
    },
  },
  {
    key: "status",
    label: t("manage_competitions.table_status") || "Status",
    render: (value: unknown) => {
      const status = value as string;
      const cfg = statusConfig[status] || {
        labelKey: "",
        fallback: status,
        className: "bg-gray-500/15 text-gray-500 border-gray-200",
      };
      return (
        <Badge variant="outline" className={`capitalize border ${cfg.className}`}>
          {t(cfg.labelKey) || cfg.fallback}
        </Badge>
      );
    },
  },
  {
    key: "schedule",
    label: t("manage_competitions.table_schedule") || "Schedule",
    render: (value: unknown) => (
      <span className="text-xs whitespace-nowrap">{value as string}</span>
    ),
  },
  {
    key: "participantCount",
    label: t("manage_competitions.table_participants") || "Participants",
    render: (value: unknown) => (
      <div className="flex items-center gap-1 text-muted-foreground">
        <Users className="h-3.5 w-3.5" />
        <span>{(value as number || 0).toLocaleString("id-ID")}</span>
      </div>
    ),
  },
  {
    key: "actions",
    label: t("manage_competitions.table_actions") || "Actions",
    render: (value: unknown, row: Record<string, unknown>) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            className="cursor-pointer text-destructive focus:bg-destructive focus:text-destructive-foreground"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteInitiate(row as unknown as CompetitionListItem);
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {t("action.delete") || "Delete"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];
