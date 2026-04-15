import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { id as idLocale, enUS } from "date-fns/locale";
import { Clock, Users, FileQuestion, Globe } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { type GameSession } from "@/types/game-session";

export const getGameSessionColumns = (
  t: any,
  locale: string,
  setSelectedParticipants: (participants: GameSession["participants"]) => void
) => {
  const formatDuration = (minutes: number | undefined) => {
    if (!minutes) return "-";
    if (minutes < 1) return "< 1";
    return String(minutes);
  };

  return [
    {
      key: "quiz_title",
      label: t("game_sessions.quiz"),
      render: (value: unknown, row: Record<string, unknown>) => (
        <div className="flex flex-col min-w-0">
          <span
            className="font-medium truncate max-w-[200px]"
            title={value as string}
          >
            {value as string}
          </span>
          <span className="text-xs text-muted-foreground">
            PIN: {row.game_pin as string}
          </span>
        </div>
      ),
    },
    {
      key: "category",
      label: t("table.category"),
      render: (value: unknown) => {
        const catKey = (value as string)?.toLowerCase();
        const label = catKey
          ? t(`category.${catKey}`) ||
            catKey.charAt(0).toUpperCase() + catKey.slice(1)
          : "-";
        return (
          <Badge
            variant="secondary"
            className="font-normal capitalize whitespace-nowrap"
          >
            {label}
          </Badge>
        );
      },
    },
    {
      key: "status",
      label: t("game_sessions.status"),
      render: (value: unknown) => {
        const status = (value as string) || "unknown";
        let className = "capitalize border ";

        switch (status) {
          case "playing":
            className +=
              "bg-blue-500/15 text-blue-600 border-blue-200 hover:bg-blue-500/25 dark:text-blue-400 dark:border-blue-800";
            break;
          case "waiting":
            className +=
              "bg-yellow-500/15 text-yellow-600 border-yellow-200 hover:bg-yellow-500/25 dark:text-yellow-400 dark:border-yellow-800";
            break;
          case "finished":
            className +=
              "bg-green-500/15 text-green-600 border-green-200 hover:bg-green-500/25 dark:text-green-400 dark:border-green-800";
            break;
          case "active":
            className +=
              "bg-purple-500/15 text-purple-600 border-purple-200 hover:bg-purple-500/25 dark:text-purple-400 dark:border-purple-800";
            break;
          default:
            className +=
              "bg-gray-500/15 text-gray-600 border-gray-200 hover:bg-gray-500/25 dark:text-gray-400 dark:border-gray-800";
        }

        const translatedStatus = t(`game_sessions.status_${status}`);
        const label = translatedStatus.includes("game_sessions.status_")
          ? status.charAt(0).toUpperCase() + status.slice(1)
          : translatedStatus;

        return (
          <Badge variant="outline" className={className}>
            {label}
          </Badge>
        );
      },
    },
    {
      key: "host",
      label: t("game_sessions.host"),
      render: (value: unknown) => {
        const host = value as GameSession["host"];
        if (!host) return <span className="text-muted-foreground">-</span>;
        return (
          <Link
            href={`/users/${host.id}`}
            className="text-sm font-medium hover:text-primary transition-colors truncate block max-w-[150px]"
            title={`${host.fullname} @${host.username}`}
            onClick={(e) => e.stopPropagation()}
          >
            {host.fullname || host.username}
          </Link>
        );
      },
    },
    {
      key: "application",
      label: t("game_sessions.application"),
      render: (value: unknown) => {
        const appName = (value as string) || "-";
        const displayName = appName.replace(/\.com$/i, "");
        return (
          <div className="flex items-center gap-1.5">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <span className="capitalize">{displayName}</span>
          </div>
        );
      },
    },
    {
      key: "participant_count",
      label: t("game_sessions.players"),
      render: (value: unknown, row: Record<string, unknown>) => {
        const count = value as number;
        const participants = row.participants as GameSession["participants"];

        return (
          <div
            className={`flex items-center gap-1.5 ${
              count > 0
                ? "cursor-pointer hover:text-primary transition-colors"
                : ""
            }`}
            onClick={(e) => {
              e.stopPropagation();
              if (count > 0 && participants) {
                setSelectedParticipants(participants);
              }
            }}
          >
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>{count}</span>
          </div>
        );
      },
    },
    {
      key: "total_questions",
      label: t("game_sessions.questions"),
      render: (value: unknown) => (
        <div className="flex items-center gap-1.5">
          <FileQuestion className="h-4 w-4 text-muted-foreground" />
          <span>{value as number}</span>
        </div>
      ),
    },
    {
      key: "duration_minutes",
      label: t("game_sessions.duration"),
      render: (value: unknown) => (
        <div className="flex items-center gap-1.5">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span>{formatDuration(value as number | undefined)}</span>
        </div>
      ),
    },
    {
      key: "created_at",
      label: t("game_sessions.date"),
      render: (value: unknown) => {
        const dateStr = value as string;
        if (!dateStr) return "-";
        const date = new Date(dateStr);
        const dateLocale = locale === "id" ? idLocale : enUS;

        try {
          const timeAgo = formatDistanceToNow(date, {
            addSuffix: true,
            locale: dateLocale,
          })
            .replace(/^about /i, "")
            .replace(/^sekitar /i, "");

          const dateFormatStr =
            locale === "id"
              ? "EEEE d MMMM yyyy 'jam' HH.mm"
              : "EEEE, d MMM yyyy 'at' HH:mm";

          const fullDate = format(date, dateFormatStr, { locale: dateLocale });

          return (
            <span
              title={fullDate}
              className="cursor-help decoration-dashed decoration-muted-foreground/50 underline-offset-4 hover:underline"
            >
              {timeAgo}
            </span>
          );
        } catch (e) {
          return <span>{dateStr}</span>;
        }
      },
    },
  ];
};
