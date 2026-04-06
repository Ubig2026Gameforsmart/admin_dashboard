"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslation } from "@/lib/i18n";
import { LocalGroup, LocalGroupMember, GameApp } from "./phase-group-stage";
import { Trophy, Users, ArrowUpRight, Clock, BookOpen, Gamepad2, Play, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { startRoundSession } from "../actions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SearchInput } from "@/components/shared/search-input";
import { MockQuiz } from "@/types/competition";

interface LocalBracketViewProps {
  groups: LocalGroup[];
  quizzes?: MockQuiz[];
  games?: GameApp[];
  competitionId?: string;
  currentUserId?: string | null;
  onManageRounds?: (group: LocalGroup) => void;
}

function formatTime(seconds: number): string {
  if (seconds === 0) return "\u2014";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

export function LocalBracketView({ groups, quizzes = [], games = [], competitionId, currentUserId, onManageRounds }: LocalBracketViewProps) {
  const { t } = useTranslation();
  const [selectedGroup, setSelectedGroup] = useState<LocalGroup | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isStartingSession, setIsStartingSession] = useState<{ groupId: string; roundIndex: number } | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        setContainerWidth(entries[0].contentRect.width);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const handleStartSessionClick = async (group: LocalGroup, roundIndex: number, quizId: string | null, gameId: string | null) => {
    if (!competitionId || !currentUserId) {
      toast.error(t("comp_detail.error_missing_data") || "Missing competition or host data.");
      return;
    }

    setIsStartingSession({ groupId: group.id, roundIndex });
    toast.loading(t("comp_detail.creating_session") || "Creating game session...", { id: "start-session" });

    try {
      const res = await startRoundSession({
        competitionId,
        groupId: group.id,
        groupName: group.name,
        roundIndex,
        quizId,
        gameId,
        participants: group.members.map(m => ({ id: m.playerId, user_id: m.playerId, name: m.playerName })),
        hostId: currentUserId
      });

      if (res.success && res.redirectUrl) {
        toast.success(t("comp_detail.session_created") || "Session created successfully!", { id: "start-session" });
        window.open(res.redirectUrl, "_blank"); // Open host settings in new tab
      } else {
        throw new Error(res.error || "Unknown error creating session");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to start session", { id: "start-session" });
    } finally {
      setIsStartingSession(null);
    }
  };

  if (groups.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-10 text-center">
        <Trophy className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
        <p className="text-muted-foreground text-sm">
          {t("competition.no_bracket")}
        </p>
      </div>
    );
  }

  // Define columns based on their stage
  const semifinals = groups.filter(g => g.stage === "Semifinal" || !g.stage || g.stage === "Group Stage");
  const finals = groups.filter(g => g.stage === "Final");
  const champions = groups.filter(g => g.stage === "Champion");

  const columns = [
    { title: "Semifinal", data: semifinals },
    { title: "Final", data: finals },
    { title: "Champion", data: champions }
  ];

  // Dynamic layout calculation
  const COLUMN_WIDTH = 260;
  const NODE_HEIGHT = 110;
  const Y_GAP = 50;
  const PADDING_X = 40;

  // Distribute horizontal gap evenly using available width
  const effectiveWidth = Math.max(containerWidth, 1000);
  const availableWidthForGaps = effectiveWidth - (2 * PADDING_X) - (3 * COLUMN_WIDTH);
  const X_GAP = Math.max(availableWidthForGaps / 2, 80);

  // Calculate height to comfortably fit the biggest column
  const maxRows = Math.max(semifinals.length, finals.length, champions.length, 1);
  const startY = 60;
  const minPaddingBottom = 60;
  const requiredViewportHeight = maxRows * NODE_HEIGHT + Math.max(maxRows - 1, 0) * Y_GAP + startY + minPaddingBottom;
  
  const svgHeight = Math.max(requiredViewportHeight, 450);
  const svgWidth = Math.max((2 * PADDING_X) + (3 * COLUMN_WIDTH) + (2 * X_GAP), effectiveWidth);

  const nodeCenters: Record<string, { x: number, y: number, cx: number, cy: number }> = {};
  
  const renderNodes: Array<{ 
    group: LocalGroup, 
    col: number, 
    row: number, 
    cx: number, 
    cy: number, 
    x: number, 
    y: number 
  }> = [];

  columns.forEach((colData, colIdx) => {
    const xOffset = PADDING_X + colIdx * (COLUMN_WIDTH + X_GAP);
    const numItems = colData.data.length;
    
    const blockHeight = numItems * NODE_HEIGHT + Math.max(numItems - 1, 0) * Y_GAP;
    const availableHeight = svgHeight - startY;
    const blockStartY = startY + (availableHeight - blockHeight) / 2;
    
    colData.data.forEach((group, rowIdx) => {
      const y = blockStartY + rowIdx * (NODE_HEIGHT + Y_GAP);
      const x = xOffset;
      const centerY = y + NODE_HEIGHT / 2;
      
      const node = {
         group, col: colIdx, row: rowIdx,
         x, y, 
         cx: xOffset + COLUMN_WIDTH / 2, 
         cy: centerY 
      };

      renderNodes.push(node);
      nodeCenters[group.id] = node;
    });
  });

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold flex items-center gap-2">
         <Trophy className="h-4 w-4 text-yellow-500" />
         {t("competition.phase_group_stage") || "Group Stage"}
      </h3>

      <div 
        ref={containerRef}
        className="overflow-x-auto pb-4 rounded-xl bg-card border shadow-sm w-full"
      >
         {/* Container specifically with exactly the width calculated so it can scroll */}
         <div className="relative mx-auto" style={{ width: svgWidth, minHeight: svgHeight }}>
           
           {/* Column Outlines and Headers */}
           {columns.map((col, colIdx) => (
             <div 
                key={colIdx} 
                className="absolute top-0 bottom-0 border-r last:border-r-0 border-dashed border-border/40"
                style={{ 
                   left: PADDING_X + colIdx * (COLUMN_WIDTH + X_GAP), 
                   width: COLUMN_WIDTH + (colIdx === 2 ? 0 : X_GAP),
                   height: svgHeight
                }}
             >
                {/* Visual grouping header area */}
                <div 
                  className="absolute top-0 flex items-center justify-center bg-muted/30 border-b border-border/50 text-xs font-bold uppercase tracking-widest text-muted-foreground/80 shadow-sm"
                  style={{ width: COLUMN_WIDTH, height: 40, borderBottomRightRadius: 8, borderBottomLeftRadius: 8, left: 0 }}
                >
                   {col.title}
                </div>
             </div>
           ))}

           {/* SVG Lines - merged bracket connectors */}
           <svg className="absolute inset-0 pointer-events-none" width={svgWidth} height={svgHeight} style={{ zIndex: 0 }}>
             {(() => {
               // Group all sources by their target node to draw proper merged bracket lines
               const targetMap = new Map<string, { target: typeof renderNodes[0]; sourceNodes: (typeof renderNodes[0])[] }>();
               
               renderNodes.forEach(node => {
                 if (node.group.sources && node.group.sources.length > 0) {
                   const validSources = node.group.sources
                     .map(sid => nodeCenters[sid])
                     .filter(Boolean) as (typeof renderNodes[0])[];
                   if (validSources.length > 0) {
                     targetMap.set(node.group.id, { target: node, sourceNodes: validSources });
                   }
                 }
               });

               return Array.from(targetMap.entries()).map(([targetId, { target, sourceNodes }]) => {
                 const endX = target.x;
                 const endY = target.cy;
                 const startXBase = sourceNodes[0].x + COLUMN_WIDTH;
                 const midX = startXBase + (endX - startXBase) / 2;

                 if (sourceNodes.length === 1) {
                   // Single source: simple orthogonal line
                   const sx = sourceNodes[0].x + COLUMN_WIDTH;
                   const sy = sourceNodes[0].cy;
                   return (
                     <path 
                       key={`line-${targetId}`}
                       d={`M ${sx} ${sy} L ${midX} ${sy} L ${midX} ${endY} L ${endX} ${endY}`}
                       stroke="currentColor" strokeWidth="2" fill="none"
                       className="text-primary/30"
                       strokeLinecap="round" strokeLinejoin="round"
                     />
                   );
                 } else {
                   // Multiple sources: merge into single bracket connector
                   const sourceYs = sourceNodes.map(s => s.cy).sort((a, b) => a - b);
                   const topY = sourceYs[0];
                   const bottomY = sourceYs[sourceYs.length - 1];
                   const mergeY = (topY + bottomY) / 2;

                   const parts: string[] = [];
                   // 1. Horizontal stub from each source to midX
                   sourceNodes.forEach(s => {
                     parts.push(`M ${s.x + COLUMN_WIDTH} ${s.cy} L ${midX} ${s.cy}`);
                   });
                   // 2. Vertical merge bar connecting only from top source to bottom source
                   parts.push(`M ${midX} ${topY} L ${midX} ${bottomY}`);
                   // 3. Horizontal connector from merge center to target
                   parts.push(`M ${midX} ${mergeY} L ${endX} ${endY}`);

                   return (
                     <path 
                       key={`line-${targetId}`}
                       d={parts.join(' ')}
                       stroke="currentColor" strokeWidth="2" fill="none"
                       className="text-primary/30"
                       strokeLinecap="round" strokeLinejoin="round"
                     />
                   );
                 }
               });
             })()}
           </svg>

           {/* HTML Nodes - rendered securely above SVG lines */}
           {renderNodes.map(node => {
              const group = node.group;
              const advancedCount = group.members.filter((m) => m.isAdvanced).length;
              const sortedMembers = [...group.members].sort((a,b) => b.score - a.score);

              return (
                 <div
                   key={group.id}
                   onClick={() => setSelectedGroup(group)}
                   role="button"
                   tabIndex={0}
                   onKeyDown={(e) => {
                     if (e.key === 'Enter' || e.key === ' ') {
                       e.preventDefault();
                       setSelectedGroup(group);
                     }
                   }}
                   className="absolute border-2 rounded-lg p-2.5 transition-all hover:shadow-md hover:border-primary/60 cursor-pointer border-primary/30 bg-primary/5 flex flex-col justify-start"
                   style={{
                      left: node.x,
                      top: node.y,
                      width: COLUMN_WIDTH,
                      height: NODE_HEIGHT,
                      zIndex: 10
                   }}
                 >
                   <div className="flex items-center justify-between mb-1">
                       <h4 className="font-semibold text-xs truncate pr-2" title={group.name}>{group.name}</h4>
                       <div className="flex items-center gap-1 shrink-0">
                         <Badge variant="secondary" className="text-[9px] h-4 px-1.5 gap-0.5">
                           <Users className="h-2.5 w-2.5" />
                           {group.members.length}
                         </Badge>
                         {advancedCount > 0 && (
                           <Badge variant="outline" className="text-[9px] h-4 px-1.5 gap-0.5 text-emerald-600 border-emerald-300 bg-emerald-500/10">
                             <ArrowUpRight className="h-2.5 w-2.5" />
                             {advancedCount}
                           </Badge>
                         )}
                       </div>
                   </div>

                   {/* Top players mini list */}
                   <div className="space-y-0 text-left">
                     {sortedMembers.slice(0, 3).map((m, idx) => (
                       <div
                         key={m.playerId}
                         className={`flex items-center justify-between text-[10px] leading-tight ${
                           m.isAdvanced
                             ? "text-emerald-700 dark:text-emerald-400 font-medium"
                             : "text-muted-foreground"
                         }`}
                       >
                         <span className="truncate max-w-[120px]">
                           {idx + 1}. {m.playerName}
                         </span>
                         <div className="flex items-center gap-2 shrink-0">
                           <span className="font-mono">{m.score}</span>
                           <span className="text-[9px] flex items-center gap-0.5">
                             <Clock className="h-2.5 w-2.5" />
                             {formatTime(m.timeSeconds)}
                           </span>
                         </div>
                       </div>
                     ))}
                     {group.members.length > 3 && (
                       <p className="text-[9px] text-muted-foreground mt-0.5">
                         +{group.members.length - 3} {t("competition.more")}
                       </p>
                     )}
                     {group.members.length === 0 && (
                       <p className="text-[9px] text-muted-foreground italic mt-0.5">
                         {t("competition.no_members")}
                       </p>
                     )}
                   </div>
                 </div>
              );
           })}
         </div>
      </div>

      <Dialog open={!!selectedGroup} onOpenChange={(open) => { if (!open) { setSelectedGroup(null); setSearchQuery(""); } }}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader className="flex flex-row items-center justify-between pr-6 gap-4">
            <div className="flex flex-col gap-1.5 min-w-0 flex-1">
              <DialogTitle className="flex items-center gap-2 min-w-0">
                <Trophy className="h-5 w-5 text-yellow-500 shrink-0" />
                <span className="truncate" title={selectedGroup?.name}>{selectedGroup?.name}</span>
                {selectedGroup?.stage && (
                  <Badge variant="outline" className="text-[10px] h-5 shrink-0 font-normal">
                    {selectedGroup.stage}
                  </Badge>
                )}
              </DialogTitle>
              {selectedGroup && selectedGroup.rounds.length > 0 && (() => {
                const totalRounds = selectedGroup.rounds.length;
                return (
                  <div className="flex items-center gap-2 pl-7 flex-wrap mt-2">
                    <Popover>
                      <PopoverTrigger onClick={(e) => e.stopPropagation()}>
                        <Badge 
                          variant="secondary" 
                          className="text-[10px] cursor-pointer bg-primary/10 hover:bg-primary/20 text-primary border-primary/20 transition-colors px-2 py-0.5 gap-1.5"
                        >
                          <Trophy className="h-3 w-3" />
                          {totalRounds} {totalRounds === 1 ? (t("competition.round") || "Round") : (t("competition.rounds") || "Rounds")}
                        </Badge>
                      </PopoverTrigger>
                      <PopoverContent align="start" className="w-[340px] p-0 shadow-xl border-muted">
                        <div className="p-3 border-b bg-muted/20">
                          <h4 className="font-semibold text-sm flex items-center gap-2 text-primary">
                            <Trophy className="h-4 w-4" /> {t("competition.assigned_rounds") || "Assigned Rounds"}
                          </h4>
                        </div>
                        <div className="max-h-[300px] overflow-y-auto p-2 space-y-2" onWheelCapture={(e) => e.stopPropagation()} onTouchMoveCapture={(e) => e.stopPropagation()}>
                          {selectedGroup.rounds.map((roundConfig, i) => {
                            const qId = roundConfig.quiz_id || "";
                            const gId = roundConfig.game_id || "";
                            const quiz = qId ? quizzes.find(q => q.id === qId) : null;
                            const game = gId ? games.find(g => g.name === gId) : null;
                            return (
                              <div key={i} className="flex flex-col border rounded-lg bg-card shadow-sm overflow-hidden group/round relative">
                                <div className="px-3 py-2 bg-muted/40 border-b flex justify-between items-center">
                                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                    {t("competition.round") || "Round"} {roundConfig.round || i + 1}
                                  </span>
                                </div>
                                
                                <div className="p-3 flex flex-col gap-2.5">
                                  {qId && (
                                    <div className="flex items-start gap-2.5">
                                      <div className="mt-0.5 w-6 h-6 rounded-md bg-blue-500/10 flex flex-col items-center justify-center shrink-0">
                                        <BookOpen className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                      </div>
                                      <div className="flex flex-col min-w-0 flex-1">
                                        <span className="text-sm font-medium leading-tight truncate" title={quiz?.title || qId}>{quiz?.title || qId}</span>
                                        {quiz && <span className="text-[10.5px] text-muted-foreground mt-0.5">{quiz.questionCount} {t("competition.questions") || "questions"}</span>}
                                      </div>
                                    </div>
                                  )}

                                  {gId && (
                                    <div className="flex items-center gap-2.5">
                                      <div className="w-6 h-6 rounded-md bg-violet-500/10 flex items-center justify-center shrink-0">
                                        <Gamepad2 className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                                      </div>
                                      <span className="text-sm font-medium leading-none truncate capitalize text-violet-700 dark:text-violet-300 flex-1" title={game?.name || gId}>
                                        {game?.name || gId}
                                      </span>
                                    </div>
                                  )}
                                  
                                  {!qId && !gId && (
                                    <div className="text-xs text-muted-foreground italic text-center py-2">{t("competition.empty_round") || "Empty round"}</div>
                                  )}
                                </div>

                                {(qId || gId) && (
                                  <div className="px-2 py-1.5 bg-emerald-500/5 border-t border-emerald-500/10">
                                    <Button 
                                      size="sm" 
                                      className="w-full h-8 text-[11px] font-medium gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-none"
                                      disabled={isStartingSession?.groupId === selectedGroup.id && isStartingSession?.roundIndex === i}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleStartSessionClick(selectedGroup, i, qId, gId);
                                      }}
                                    >
                                      {isStartingSession?.groupId === selectedGroup.id && isStartingSession?.roundIndex === i ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                      ) : (
                                        <Play className="h-3 w-3 fill-current" />
                                      )}
                                      {t("action.start") || "Start"}
                                    </Button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        {onManageRounds && (
                          <div className="p-2 border-t bg-muted/10">
                            <Button size="sm" variant="ghost" className="w-full text-xs h-8" onClick={() => { setSelectedGroup(null); setTimeout(() => onManageRounds(selectedGroup), 150); }}>
                              {t("competition.manage_rounds") || "Manage Rounds"} <ArrowUpRight className="ml-1 h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </PopoverContent>
                    </Popover>
                  </div>
                );
              })()}
            </div>
            <div className="w-56 shrink-0 mt-0">
              <SearchInput
                placeholder={t("comp_detail.search_player") || "Search player..."}
                value={searchQuery}
                onSearch={setSearchQuery}
                className="w-full h-8 text-xs"
              />
            </div>
          </DialogHeader>
          <div className="mt-3 flex flex-col gap-3">
            {selectedGroup?.members.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">{t("competition.no_members")}</p>
            ) : (
              <div className="border rounded-md overflow-hidden">
                <div className={`grid ${selectedGroup?.stage === "Champion" ? "grid-cols-[32px_1fr_80px_80px_40px]" : "grid-cols-[1fr_80px_80px_40px]"} gap-2 px-4 py-2 text-[11px] font-medium text-muted-foreground border-b bg-muted/30`}>
                  {selectedGroup?.stage === "Champion" && <span className="text-center">#</span>}
                  <span>{t("comp_detail.table_player") || "Player"}</span>
                  <span className="text-center">{t("comp_detail.table_avg") || "Score"}</span>
                  <span className="text-center">{t("competition.time") || "Time"}</span>
                  <span />
                </div>
                <div className="max-h-[50vh] overflow-y-auto w-full" onWheelCapture={(e) => e.stopPropagation()} onTouchMoveCapture={(e) => e.stopPropagation()}>
                  {[...(selectedGroup?.members || [])]
                    .filter(m => m.playerName.toLowerCase().includes(searchQuery.toLowerCase()))
                    .sort((a, b) => b.score - a.score)
                    .map((member, idx) => (
                      <div key={member.playerId}
                        className={`grid ${selectedGroup?.stage === "Champion" ? "grid-cols-[32px_1fr_80px_80px_40px]" : "grid-cols-[1fr_80px_80px_40px]"} gap-2 items-center px-4 py-2.5 text-sm border-b last:border-b-0 ${
                          member.isAdvanced ? "bg-emerald-500/5" : ""
                        }`}>
                        {selectedGroup?.stage === "Champion" && (
                          <span className={`text-center text-xs font-bold ${
                            idx === 0 ? "text-yellow-500" :
                            idx === 1 ? "text-gray-400" :
                            idx === 2 ? "text-orange-500" :
                            "text-muted-foreground"
                          }`}>#{idx + 1}</span>
                        )}
                        <div className="flex items-center gap-3 min-w-0 pr-1">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-[11px] font-medium">{member.playerName.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col min-w-0">
                            <span className={`font-semibold text-sm truncate ${member.isAdvanced ? "text-emerald-600" : ""}`} title={member.playerName}>
                              {member.playerName}
                            </span>
                            <span className="text-xs text-muted-foreground truncate" title={`@${member.playerName.toLowerCase().replace(/\s+/g, '')}`}>
                              @{member.playerName.toLowerCase().replace(/\s+/g, '')}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-center gap-1">
                          <span className="font-mono font-medium">{member.score}</span>
                        </div>
                        <div className="flex items-center justify-center gap-1 text-muted-foreground">
                          <span className="font-mono">{formatTime(member.timeSeconds)}</span>
                        </div>
                        <div className="flex justify-center">
                          {member.isAdvanced && (
                            <span title={t("competition.advanced") || "Advanced"}>
                              <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
