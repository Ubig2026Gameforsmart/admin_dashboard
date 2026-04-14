import Link from "next/link";
import { Dices, Activity, Users, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { type GameApplication } from "@/types/game";

const ACCENT_COLORS = [
  "border-l-cyan-500",
  "border-l-violet-500",
  "border-l-amber-500",
  "border-l-emerald-500",
  "border-l-rose-500",
  "border-l-blue-500",
  "border-l-orange-500",
  "border-l-pink-500",
];

export function GameCard({
  app,
  index,
  formatAppName,
}: {
  app: GameApplication;
  index: number;
  formatAppName: (name: string) => string;
}) {
  const accent = ACCENT_COLORS[index % ACCENT_COLORS.length];
  const completionRate =
    app.total_sessions > 0
      ? Math.round((app.finished_sessions / app.total_sessions) * 100)
      : 0;

  return (
    <Link href={`/games/${encodeURIComponent(app.name)}`}>
      <Card
        className={`border-l-4 ${accent} border-t border-r border-b group overflow-hidden transition-all duration-200 hover:shadow-md hover:shadow-primary/5 cursor-pointer h-full`}
      >
        <CardContent className="pt-4 pb-4 space-y-3">
          {/* App Name */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Dices className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              <h3 className="font-semibold text-[15px] group-hover:text-primary transition-colors">
                {formatAppName(app.name)}
              </h3>
            </div>
            {app.active_sessions > 0 && (
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Activity className="h-3 w-3" />
                <span className="text-[11px]">Sessions</span>
              </div>
              <p className="text-lg font-bold tabular-nums leading-tight">
                {app.total_sessions.toLocaleString()}
              </p>
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Users className="h-3 w-3" />
                <span className="text-[11px]">Players</span>
              </div>
              <p className="text-lg font-bold tabular-nums leading-tight">
                {app.total_players.toLocaleString()}
              </p>
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Dices className="h-3 w-3" />
                <span className="text-[11px]">Done</span>
              </div>
              <p className="text-lg font-bold tabular-nums leading-tight">
                {completionRate}
                <span className="text-xs font-normal text-muted-foreground">
                  %
                </span>
              </p>
            </div>
          </div>

          {/* Last Active */}
          {app.last_session && (
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-1.5 border-t border-border/50">
              <Clock className="h-3 w-3" />
              <span>
                Last active{" "}
                {formatDistanceToNow(new Date(app.last_session), {
                  addSuffix: true,
                })}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
