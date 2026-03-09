"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslation } from "@/lib/i18n";
import { LocalGroup, LocalGroupMember } from "./phase-group-stage";
import { Trophy, Users, ArrowUpRight, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
  const COLUMN_WIDTH = 250;
  const NODE_HEIGHT = 100;
  const Y_GAP = 30; // Keep slightly larger vertical gap
  const PADDING_X = 24; // Padding on left and right sides so it's not sticking to the edge

  // Distribute horizontal gap evenly using available width
  const effectiveWidth = Math.max(containerWidth, 930); // fallback min width
  const availableWidthForGaps = effectiveWidth - (2 * PADDING_X) - (3 * COLUMN_WIDTH);
  const X_GAP = Math.max(availableWidthForGaps / 2, 60);

  // Calculate height to comfortably fit the biggest column
  const maxRows = Math.max(semifinals.length, finals.length, champions.length, 1);
  const startY = 60; // Start area below the column header
  const minPaddingBottom = 40; 
  const requiredViewportHeight = maxRows * NODE_HEIGHT + Math.max(maxRows - 1, 0) * Y_GAP + startY + minPaddingBottom;
  
  const svgHeight = Math.max(requiredViewportHeight, 400); // minimum 400 height
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
         Bracket
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
                   className="absolute border-2 rounded-lg p-2.5 transition-all hover:shadow-md border-primary/30 bg-primary/5 flex flex-col justify-start"
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
    </div>
  );
}
