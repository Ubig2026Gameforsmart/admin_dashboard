"use client";

import { useTranslation } from "@/lib/i18n";
import { CompetitionRound, RoundStatus } from "@/types/competition";
import {
  Users,
  Trophy,
  CheckCircle2,
  Clock,
  Play,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface BracketViewProps {
  rounds: CompetitionRound[];
}

const statusColors: Record<RoundStatus, string> = {
  pending: "border-gray-300 bg-gray-50 dark:bg-gray-900/30",
  active: "border-amber-400 bg-amber-50/50 dark:bg-amber-900/20",
  completed: "border-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/20",
};

const statusIcon: Record<RoundStatus, React.ReactNode> = {
  pending: <Clock className="h-3 w-3 text-gray-400" />,
  active: <Play className="h-3 w-3 text-amber-500" />,
  completed: <CheckCircle2 className="h-3 w-3 text-emerald-500" />,
};

const GROUP_NODE_HEIGHT = 72;
const GROUP_GAP = 12;
const ROUND_GAP = 100;
const COLUMN_WIDTH = 200;

export function BracketView({ rounds }: BracketViewProps) {
  const { t } = useTranslation();

  if (rounds.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-12 text-center">
        <Trophy className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
        <p className="text-muted-foreground text-sm">
          {t("competition.no_bracket")}
        </p>
      </div>
    );
  }

  // Calculate max groups for SVG height
  const maxGroups = Math.max(...rounds.map((r) => (r.groups?.length || 1)));
  const svgHeight = maxGroups * (GROUP_NODE_HEIGHT + GROUP_GAP) + 60;
  const svgWidth = rounds.length * (COLUMN_WIDTH + ROUND_GAP);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <Trophy className="h-5 w-5 text-yellow-500" />
        {t("competition.bracket_title")}
      </h2>

      {/* Bracket Container — scrollable */}
      <div className="overflow-x-auto pb-4 border rounded-xl bg-card/50 p-6">
        <div className="relative" style={{ width: svgWidth, minHeight: svgHeight }}>
          {/* SVG Layer for connecting lines */}
          <svg
            className="absolute inset-0 pointer-events-none"
            width={svgWidth}
            height={svgHeight}
            style={{ zIndex: 0 }}
          >
            {rounds.map((round, roundIdx) => {
              if (roundIdx >= rounds.length - 1) return null;
              const nextRound = rounds[roundIdx + 1];
              const currentGroups = round.groups || [];
              const nextGroups = nextRound.groups || [];

              if (currentGroups.length === 0 || nextGroups.length === 0) return null;

              const x1 = roundIdx * (COLUMN_WIDTH + ROUND_GAP) + COLUMN_WIDTH;
              const x2 = (roundIdx + 1) * (COLUMN_WIDTH + ROUND_GAP);
              const midX = (x1 + x2) / 2;

              // Connect each current group to corresponding next group
              return currentGroups.map((group, gIdx) => {
                const nextGIdx = Math.min(Math.floor(gIdx / Math.max(1, Math.ceil(currentGroups.length / nextGroups.length))), nextGroups.length - 1);

                const y1 = 40 + gIdx * (GROUP_NODE_HEIGHT + GROUP_GAP) + GROUP_NODE_HEIGHT / 2;
                const y2 = 40 + nextGIdx * (GROUP_NODE_HEIGHT + GROUP_GAP) + GROUP_NODE_HEIGHT / 2;

                return (
                  <path
                    key={`line-${round.id}-${group.id}`}
                    d={`M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`}
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                    className="text-border"
                    strokeDasharray={round.status === "completed" ? "none" : "6 4"}
                  />
                );
              });
            })}
          </svg>

          {/* Nodes Layer */}
          <div className="relative" style={{ zIndex: 1 }}>
            {rounds.map((round, roundIdx) => {
              const groups = round.groups || [];
              const xOffset = roundIdx * (COLUMN_WIDTH + ROUND_GAP);

              return (
                <div
                  key={round.id}
                  className="absolute top-0"
                  style={{ left: xOffset, width: COLUMN_WIDTH }}
                >
                  {/* Round Header */}
                  <div className="text-center mb-3">
                    <div className="flex items-center justify-center gap-1.5">
                      {statusIcon[round.status as RoundStatus]}
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        {t("competition.round")} {round.round_order}
                      </span>
                    </div>
                    <h3 className="font-semibold text-sm">{round.name}</h3>
                  </div>

                  {/* Group Nodes */}
                  {groups.length === 0 ? (
                    <div
                      className="border border-dashed rounded-lg flex items-center justify-center text-xs text-muted-foreground"
                      style={{ height: GROUP_NODE_HEIGHT }}
                    >
                      {t("competition.no_groups")}
                    </div>
                  ) : (
                    groups.map((group, gIdx) => {
                      const members = group.members || [];
                      const sortedMembers = [...members].sort((a, b) => b.score - a.score);
                      const advanced = members.filter((m) => m.is_advanced);

                      return (
                        <div
                          key={group.id}
                          className={`border-2 rounded-lg p-2.5 transition-all hover:shadow-md ${statusColors[round.status as RoundStatus]}`}
                          style={{
                            height: GROUP_NODE_HEIGHT,
                            marginBottom: GROUP_GAP,
                          }}
                        >
                          {/* Group title row */}
                          <div className="flex items-center justify-between mb-1.5">
                            <h4 className="font-semibold text-xs">{group.name}</h4>
                            <Badge variant="outline" className="text-[9px] h-4 px-1.5">
                              {members.length} {t("competition.members")}
                            </Badge>
                          </div>

                          {/* Top players mini list */}
                          <div className="space-y-0">
                            {sortedMembers.slice(0, 2).map((m, idx) => (
                              <div
                                key={m.id}
                                className={`flex items-center justify-between text-[10px] leading-tight ${
                                  m.is_advanced ? "text-emerald-700 dark:text-emerald-400 font-medium" : "text-muted-foreground"
                                }`}
                              >
                                <span className="truncate max-w-[110px]">
                                  {idx + 1}. {m.participant?.name || m.participant_id}
                                </span>
                                <span className="font-mono">{m.score}</span>
                              </div>
                            ))}
                            {members.length > 2 && (
                              <p className="text-[9px] text-muted-foreground">
                                +{members.length - 2} {t("competition.more")}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
