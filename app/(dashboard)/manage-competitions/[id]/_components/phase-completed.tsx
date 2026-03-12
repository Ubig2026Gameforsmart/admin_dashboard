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

  const podiumConfig = [
    { icon: <Crown className="h-8 w-8 text-yellow-500" />, bg: "from-yellow-500/20 to-yellow-600/5 border-yellow-500/30", label: t("competition.winner_1st") || "1st Place", textColor: "text-yellow-600 dark:text-yellow-400" },
    { icon: <Medal className="h-7 w-7 text-gray-400" />, bg: "from-gray-300/20 to-gray-400/5 border-gray-400/30", label: t("competition.winner_2nd") || "2nd Place", textColor: "text-gray-500 dark:text-gray-400" },
    { icon: <Award className="h-7 w-7 text-orange-500" />, bg: "from-orange-500/20 to-orange-600/5 border-orange-500/30", label: t("competition.winner_3rd") || "3rd Place", textColor: "text-orange-600 dark:text-orange-400" },
  ];

  function formatTime(seconds: number): string {
    if (seconds === 0) return "—";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s.toString().padStart(2, "0")}s`;
  }

  const hasMembers = groups.some(g => g.members.length > 0);

  if (!hasMembers) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-12 text-center">
        <Trophy className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
        <p className="text-muted-foreground text-sm">
          {t("competition.no_results") || "No results available yet"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Trophy className="h-5 w-5 text-yellow-500" />
        <h2 className="text-lg font-semibold">{t("competition.phase_completed") || "Champion"}</h2>
      </div>

      <div className="space-y-10">
        {groups.map((group) => {
          if (group.members.length === 0) return null;

          // Rank members by score (desc), then time (asc)
          const ranked = [...group.members].sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return a.timeSeconds - b.timeSeconds;
          });

          const top3 = ranked.slice(0, 3);

          return (
            <div key={group.id} className="space-y-4">
              <div className="flex items-center gap-2 border-b pb-2">
                <Crown className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-md text-foreground">{group.name}</h3>
              </div>
              
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
                        <h3 className={`font-bold text-base ${cfg.textColor} truncate max-w-full`} title={player.playerName}>
                          {player.playerName}
                        </h3>
                        <p className="text-xs text-muted-foreground truncate max-w-full" title={`@${player.playerName.toLowerCase().replace(/\s+/g, '')}`}>
                          @{player.playerName.toLowerCase().replace(/\s+/g, '')}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">{cfg.label}</p>
                        <div className="flex items-center justify-center gap-3 text-sm">
                          <span className="flex items-center gap-1 font-semibold">
                            <Trophy className="h-3.5 w-3.5 text-yellow-500" />
                            {player.score}
                          </span>
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" />
                            {formatTime(player.timeSeconds)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
