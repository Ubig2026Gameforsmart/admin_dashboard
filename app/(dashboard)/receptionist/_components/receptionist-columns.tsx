import { Image as ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const getReceptionistColumns = (
  t: any,
  setPreviewPoster: (val: { url: string; title: string }) => void
) => {
  const statusConfig: Record<string, { label: string; className: string }> = {
    published: {
      label: t("comp_detail.status_published") || "Published",
      className: "border-emerald-500/50 bg-emerald-500/10 text-emerald-500",
    },
    draft: {
      label: t("comp_detail.status_draft") || "Draft",
      className: "border-yellow-500/50 bg-yellow-500/10 text-yellow-500",
    },
    completed: {
      label: t("comp_detail.status_completed") || "Completed",
      className: "border-blue-500/50 bg-blue-500/10 text-blue-500",
    },
    coming_soon: {
      label: t("comp_detail.status_coming_soon") || "Coming Soon",
      className: "border-purple-500/50 bg-purple-500/10 text-purple-500",
    },
  };

  return [
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
              if (posterUrl) setPreviewPoster({ url: posterUrl, title });
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
        <span
          className="font-medium truncate block max-w-[250px]"
          title={value as string}
        >
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
          <span className="text-muted-foreground">\u2014</span>
        );
      },
    },
    {
      key: "status",
      label: t("manage_competitions.table_status") || "Status",
      render: (value: unknown) => {
        const status = value as string;
        const cfg = statusConfig[status] || {
          label: status,
          className: "border-gray-500/50 bg-gray-500/10 text-gray-500",
        };
        return (
          <Badge variant="outline" className={`capitalize border ${cfg.className}`}>
            {cfg.label}
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
  ];
};
