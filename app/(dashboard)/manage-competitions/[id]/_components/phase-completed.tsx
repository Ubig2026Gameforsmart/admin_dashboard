"use client";

import { useTranslation } from "@/lib/i18n";
import { Trophy, Medal, Clock, Crown, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LocalGroup, LocalGroupMember } from "./phase-group-stage";

interface PhaseCompletedProps {
  groups: LocalGroup[];
}

interface RankedPlayer {
  playerId: string;
  playerName: string;
  totalScore: number;
  totalTime: number;
  groupName: string;
}

export function PhaseCompleted({ groups }: PhaseCompletedProps) {
  const { t } = useTranslation();

  // Collect all members across all groups
  const allMembers: (LocalGroupMember & { groupName: string })[] = groups.flatMap((g) =>
    g.members.map((m) => ({ ...m, groupName: g.name }))
  );

  // Rank by score (desc), then by time (asc) as tiebreaker
  const ranked: RankedPlayer[] = allMembers
    .map((m) => ({
      playerId: m.playerId,
      playerName: m.playerName,
      totalScore: m.score,
      totalTime: m.timeSeconds,
      groupName: m.groupName,
    }))
    .sort((a, b) => {
      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
      return a.totalTime - b.totalTime; // faster is better
    });

  const top3 = ranked.slice(0, 3);
  const rest = ranked.slice(3);

  const podiumConfig = [
    { icon: <Crown className="h-8 w-8 text-yellow-500" />, bg: "from-yellow-500/20 to-yellow-600/5 border-yellow-500/30", label: t("competition.winner_1st"), textColor: "text-yellow-600 dark:text-yellow-400" },
    { icon: <Medal className="h-7 w-7 text-gray-400" />, bg: "from-gray-300/20 to-gray-400/5 border-gray-400/30", label: t("competition.winner_2nd"), textColor: "text-gray-500 dark:text-gray-400" },
    { icon: <Award className="h-7 w-7 text-orange-500" />, bg: "from-orange-500/20 to-orange-600/5 border-orange-500/30", label: t("competition.winner_3rd"), textColor: "text-orange-600 dark:text-orange-400" },
  ];

  function formatTime(seconds: number): string {
    if (seconds === 0) return "—";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s.toString().padStart(2, "0")}s`;
  }

  if (allMembers.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-12 text-center">
        <Trophy className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
        <p className="text-muted-foreground text-sm">
          {t("competition.no_results")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Trophy className="h-5 w-5 text-yellow-500" />
        <h2 className="text-lg font-semibold">{t("competition.phase_completed")}</h2>
        <Badge variant="secondary" className="text-xs">
          {ranked.length} {t("competition.participants_total")}
        </Badge>
      </div>

      {/* Podium — Top 3 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {top3.map((player, idx) => {
          const cfg = podiumConfig[idx];
          return (
            <div
              key={player.playerId}
              className={`rounded-xl border-2 bg-gradient-to-b p-6 text-center space-y-3 transition-shadow hover:shadow-lg ${cfg.bg}`}
            >
              {cfg.icon}
              <div className="mx-auto">
                <Avatar className="h-14 w-14 mx-auto mb-2">
                  <AvatarFallback className="text-lg font-bold">
                    {player.playerName.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <h3 className={`font-bold text-base ${cfg.textColor}`}>
                  {player.playerName}
                </h3>
                <p className="text-xs text-muted-foreground">{player.groupName}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">{cfg.label}</p>
                <div className="flex items-center justify-center gap-3 text-sm">
                  <span className="flex items-center gap-1 font-semibold">
                    <Trophy className="h-3.5 w-3.5 text-yellow-500" />
                    {player.totalScore}
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    {formatTime(player.totalTime)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Rest of rankings */}
      {rest.length > 0 && (
        <div className="rounded-md border bg-card">
          <div className="grid grid-cols-[50px_1fr_80px_80px_100px] gap-2 px-4 py-2 text-[11px] font-medium text-muted-foreground border-b bg-muted/30">
            <span className="text-center">#</span>
            <span>{t("comp_detail.table_player")}</span>
            <span className="text-center">{t("comp_detail.table_avg")}</span>
            <span className="text-center">{t("competition.time")}</span>
            <span className="text-center">{t("competition.group_label")}</span>
          </div>
          {rest.map((player, idx) => (
            <div key={player.playerId}
              className="grid grid-cols-[50px_1fr_80px_80px_100px] gap-2 items-center px-4 py-2 text-sm border-b last:border-b-0">
              <span className="text-center text-muted-foreground">{idx + 4}</span>
              <div className="flex items-center gap-2 min-w-0">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-[9px]">{player.playerName.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="font-medium truncate">{player.playerName}</span>
              </div>
              <div className="flex items-center justify-center gap-1">
                <Trophy className="h-3 w-3 text-yellow-500" />
                <span className="font-mono">{player.totalScore}</span>
              </div>
              <div className="flex items-center justify-center gap-1 text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span className="font-mono text-xs">{formatTime(player.totalTime)}</span>
              </div>
              <span className="text-center text-xs text-muted-foreground">{player.groupName}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
