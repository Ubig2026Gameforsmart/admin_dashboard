"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslation } from "@/lib/i18n";
import { LocalGroup, LocalGroupMember } from "./phase-group-stage";
import { Trophy, Users, ArrowUpRight, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SearchInput } from "@/components/shared/search-input";

interface LocalBracketViewProps {
  groups: LocalGroup[];
}

function formatTime(seconds: number): string {
  if (seconds === 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

export function LocalBracketView({ groups }: LocalBracketViewProps) {
  const { t } = useTranslation();
  const [selectedGroup, setSelectedGroup] = useState<LocalGroup | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
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
  const COLUMN_WIDTH = 260; // Make cards slightly wider
  const NODE_HEIGHT = 110;  // Slightly taller for breathing room
  const Y_GAP = 50;         // Much wider vertical gap so nodes don't feel squashed
  const PADDING_X = 40;     // Wider side padding to avoid edge hugging

  // Distribute horizontal gap evenly using available width, pushing columns to edges
  const effectiveWidth = Math.max(containerWidth, 1000); // fallback min width
  const availableWidthForGaps = effectiveWidth - (2 * PADDING_X) - (3 * COLUMN_WIDTH);
  const X_GAP = Math.max(availableWidthForGaps / 2, 80); // Minimum 80px gap between columns

  // Calculate height to comfortably fit the biggest column
  const maxRows = Math.max(semifinals.length, finals.length, champions.length, 1);
  const startY = 60; // Start area below the column header
  const minPaddingBottom = 60; 
  const requiredViewportHeight = maxRows * NODE_HEIGHT + Math.max(maxRows - 1, 0) * Y_GAP + startY + minPaddingBottom;
  
  const svgHeight = Math.max(requiredViewportHeight, 450); // minimum height
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
    
    // Total height this column will take naturally
    const blockHeight = numItems * NODE_HEIGHT + Math.max(numItems - 1, 0) * Y_GAP;
    
    // Center this block vertically within the available space below header
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
                   width: COLUMN_WIDTH + (colIdx === 2 ? 0 : X_GAP), // Span over the gap so borders look neat
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

           {/* SVG Lines - using absolute coordinates matching the HTML nodes */}
           <svg className="absolute inset-0 pointer-events-none" width={svgWidth} height={svgHeight} style={{ zIndex: 0 }}>
             {renderNodes.map(node => {
                if (node.group.sources && node.group.sources.length > 0) {
                   return node.group.sources.map(sourceId => {
                      const sourceNode = nodeCenters[sourceId];
                      if (!sourceNode) return null;
                      
                      // Draw line from right-edge of source, to left-edge of target
                      const startX = sourceNode.x + COLUMN_WIDTH;
                      const startY = sourceNode.cy;
                      const endX = node.x;
                      const endY = node.cy;
                      
                      // Orthogonal tournament lines
                      const midX = startX + (endX - startX) / 2;

                      return (
                        <path 
                          key={`${sourceId}-${node.group.id}`}
                          d={`M ${startX} ${startY} L ${midX} ${startY} L ${midX} ${endY} L ${endX} ${endY}`}
                          stroke="currentColor" 
                          strokeWidth="2" 
                          fill="none"
                          className="text-primary/30"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      );
                   });
                }
                return null;
             })}
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
            <DialogTitle className="flex items-center gap-2 min-w-0">
              <Trophy className="h-5 w-5 text-yellow-500 shrink-0" />
              <span className="truncate" title={selectedGroup?.name}>{selectedGroup?.name}</span>
              {selectedGroup?.stage && (
                <Badge variant="outline" className="text-[10px] h-5 shrink-0 font-normal">
                  {selectedGroup.stage}
                </Badge>
              )}
            </DialogTitle>
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
                <div className="max-h-[50vh] overflow-y-auto w-full">
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
                            <span className="text-xs text-muted-foreground truncate" title={`@${member.playerName.toLowerCase().replace(/\\s+/g, '')}`}>
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
