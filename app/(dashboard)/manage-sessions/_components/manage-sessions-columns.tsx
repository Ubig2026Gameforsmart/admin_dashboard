import { format, formatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale";
import { Users, Timer, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export const getManageSessionsColumns = (
  isPageSelected: boolean,
  selected: Set<string>,
  toggleSelectPage: () => void,
  toggleSelect: (id: string) => void
) => [
  {
    key: "quiz_title",
    label: "Quiz",
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
    key: "host",
    label: "Host",
    render: (_: unknown, row: Record<string, unknown>) => (
      <div className="flex items-center gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={row.avatar_url as string} />
          <AvatarFallback className="text-[10px]">
            {(row.host_name as string).substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <span className="truncate max-w-[150px] text-sm font-medium">
          {row.host_name as string}
        </span>
      </div>
    ),
  },
  {
    key: "status",
    label: "Status",
    render: () => (
      <Badge
        variant="outline"
        className="bg-yellow-500/15 text-yellow-600 border-yellow-200 hover:bg-yellow-500/25 dark:text-yellow-400 dark:border-yellow-800 capitalize"
      >
        Waiting
      </Badge>
    ),
  },
  {
    key: "application",
    label: "Application",
    render: (value: unknown) => (
      <div className="flex items-center gap-1.5">
        <Globe className="h-4 w-4 text-muted-foreground" />
        <span className="capitalize text-sm">
          {(value as string).replace(/\.com$/i, "")}
        </span>
      </div>
    ),
  },
  {
    key: "waiting_duration_minutes",
    label: "Duration",
    render: (value: unknown) => (
      <div className="flex items-center gap-1.5 text-sm">
        <Timer className="h-4 w-4 text-muted-foreground" />
        <span>{formatDuration(value as number)}</span>
      </div>
    ),
  },
  {
    key: "participant_count",
    label: "Players",
    render: (value: unknown) => (
      <div className="flex items-center gap-1.5 text-sm">
        <Users className="h-4 w-4 text-muted-foreground" />
        <span>{value as number}</span>
      </div>
    ),
  },
  {
    key: "created_at",
    label: "Created",
    render: (value: unknown) => {
      const date = new Date(value as string);
      const fullDate = format(date, "EEEE, d MMMM yyyy 'at' HH:mm", {
        locale: enUS,
      });

      return (
        <span
          className="text-sm font-medium whitespace-nowrap cursor-help decoration-dashed decoration-muted-foreground/50 underline-offset-4 hover:underline"
          title={fullDate}
          suppressHydrationWarning
        >
          {formatDistanceToNow(date, { addSuffix: true })}
        </span>
      );
    },
  },
  {
    key: "select",
    label: (
      <div className="flex justify-center pr-4">
        <Checkbox
          checked={isPageSelected}
          onCheckedChange={toggleSelectPage}
          aria-label="Select all on page"
          className="h-4 w-4 border-muted-foreground/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary translate-y-[2px]"
        />
      </div>
    ) as unknown as string,
    render: (_: unknown, row: Record<string, unknown>) => (
      <div className="flex justify-center pr-4">
        <Checkbox
          checked={selected.has(row.id as string)}
          onCheckedChange={() => toggleSelect(row.id as string)}
          onClick={(e) => e.stopPropagation()}
          aria-label="Select row"
          className="h-4 w-4 border-muted-foreground/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
        />
      </div>
    ),
  },
];
