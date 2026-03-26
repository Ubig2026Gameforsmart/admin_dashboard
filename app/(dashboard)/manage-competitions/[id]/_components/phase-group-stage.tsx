"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n";
import { toast } from "sonner";
import { DummyPlayer, MockQuiz } from "@/types/competition";
import {
  Plus, Trash2, Users, UserPlus, BookOpen, Trophy, Clock,
  ArrowUpRight, ChevronDown as ChevronDownIcon, ChevronUp, Maximize2, Edit, Gamepad2, Save
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { SearchInput } from "@/components/shared/search-input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, ChevronDown } from "lucide-react";
import { LocalBracketView } from "./local-bracket-view";

export interface GameApp {
  name: string;
  count: number;
}

interface PhaseGroupStageProps {
  finalists: DummyPlayer[];
  groups: LocalGroup[];
  quizzes: MockQuiz[];
  games: GameApp[];
  onGroupsChange: (groups: LocalGroup[]) => void;
  onSave?: () => void;
  isSaving?: boolean;
  currentUserId?: string | null;
}

export interface LocalGroup {
  id: string;
  name: string;
  quizIds: string[];
  gameIds: string[];
  members: LocalGroupMember[];
  stage?: string;
  sources?: string[];
}

export interface LocalGroupMember {
  playerId: string;
  playerName: string;
  score: number;
  timeSeconds: number;
  isAdvanced: boolean;
}

function formatTime(seconds: number): string {
  if (seconds === 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

export function PhaseGroupStage({
  finalists,
  groups,
  quizzes,
  games,
  onGroupsChange,
  onSave,
  isSaving,
  currentUserId,
}: PhaseGroupStageProps) {
  const { t } = useTranslation();
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupStage, setNewGroupStage] = useState("Semifinal");
  const [newGroupSources, setNewGroupSources] = useState<string[]>([]);
  const [detailDialog, setDetailDialog] = useState<LocalGroup | null>(null);
  const [detailSearch, setDetailSearch] = useState("");
  const [assignDialog, setAssignDialog] = useState<LocalGroup | null>(null);
  const [quizDialog, setQuizDialog] = useState<LocalGroup | null>(null);
  const [quizSearch, setQuizSearch] = useState("");
  const [gameDialog, setGameDialog] = useState<LocalGroup | null>(null);
  const [gameSearch, setGameSearch] = useState("");
  const [assignSearch, setAssignSearch] = useState("");
  const [assignSelected, setAssignSelected] = useState<string[]>([]);
  const [advanceSelected, setAdvanceSelected] = useState<Record<string, string[]>>({});
  const [playerToUnAdvance, setPlayerToUnAdvance] = useState<{groupId: string, playerId: string, playerName: string} | null>(null);

  // Edit Group state
  const [editGroup, setEditGroup] = useState<LocalGroup | null>(null);
  const [editGroupName, setEditGroupName] = useState("");
  const [editGroupStage, setEditGroupStage] = useState("");
  const [editGroupSources, setEditGroupSources] = useState<string[]>([]);

  // All assigned player IDs across all groups
  const allAssignedIds = groups.flatMap((g) => g.members.map((m) => m.playerId));

  const handleAddGroup = () => {
    if (!newGroupName.trim()) {
      toast.error(t("competition.group_name_required") || "Group name is required");
      return;
    }

    let initialMembers: LocalGroupMember[] = [];
    if (newGroupSources.length > 0) {
      const sourceGrps = groups.filter((g) => newGroupSources.includes(g.id));
      initialMembers = sourceGrps.flatMap(sourceGrp => 
        sourceGrp.members
          .filter((m) => m.isAdvanced)
          .map((m) => ({ ...m, isAdvanced: false, score: 0, timeSeconds: 0 }))
      );
    }

    const newGroup: LocalGroup = {
      id: `grp-${Date.now()}`,
      name: newGroupName.trim(),
      quizIds: [],
      gameIds: [],
      members: initialMembers,
      stage: newGroupStage,
      sources: newGroupSources,
    };
    onGroupsChange([...groups, newGroup]);
    toast.success(`${t("competition.group_created") || "Group created"}: ${newGroupName}`);
    setNewGroupName("");
    setNewGroupSources([]);
  };

  const handleDeleteGroup = (groupId: string) => {
    onGroupsChange(groups.filter((g) => g.id !== groupId));
    toast.success(t("competition.group_deleted"));
  };

  const handleUpdateGroup = () => {
    if (!editGroup) return;
    if (!editGroupName.trim()) {
      toast.error(t("competition.group_name_required") || "Group name is required");
      return;
    }

    onGroupsChange(
      groups.map((g) =>
        g.id === editGroup.id
          ? {
              ...g,
              name: editGroupName.trim(),
              stage: editGroupStage,
              sources: editGroupSources,
            }
          : g
      )
    );
    toast.success(t("competition.group_updated") || "Group updated successfully");
    setEditGroup(null);
  };

  const handleAssignPlayers = () => {
    if (!assignDialog || assignSelected.length === 0) return;
    const newMembers: LocalGroupMember[] = assignSelected.map((pId) => {
      const player = finalists.find((f) => f.id === pId);
      return {
        playerId: pId,
        playerName: player?.name || pId,
        score: Math.min(100, Math.max(0, Math.round((player?.avgScore || 50) + (Math.random() * 20 - 10)))),
        timeSeconds: Math.floor(Math.random() * 300) + 60,
        isAdvanced: false,
      };
    });

    onGroupsChange(
      groups.map((g) =>
        g.id === assignDialog.id
          ? { ...g, members: [...g.members, ...newMembers] }
          : g
      )
    );
    toast.success(`${assignSelected.length} ${t("competition.players_assigned")}`);
    setAssignSelected([]);
    setAssignSearch("");
    setAssignDialog(null);
  };

  const handleAssignQuiz = (groupId: string, quizId: string) => {
    onGroupsChange(
      groups.map((g) => {
        if (g.id !== groupId) return g;
        const has = g.quizIds.includes(quizId);
        const updatedGroup = {
          ...g,
          quizIds: has
            ? g.quizIds.filter((q) => q !== quizId)
            : [...g.quizIds, quizId],
        };
        
        // Sync local dialog state
        if (quizDialog?.id === groupId) {
          setQuizDialog(updatedGroup);
        }
        
        return updatedGroup;
      })
    );
  };

  const handleAssignGame = (groupId: string, gameName: string) => {
    onGroupsChange(
      groups.map((g) => {
        if (g.id !== groupId) return g;
        const has = g.gameIds.includes(gameName);
        const updatedGroup = {
          ...g,
          gameIds: has
            ? g.gameIds.filter((gm) => gm !== gameName)
            : [...g.gameIds, gameName],
        };
        if (gameDialog?.id === groupId) {
          setGameDialog(updatedGroup);
        }
        return updatedGroup;
      })
    );
  };

  const toggleAdvance = (groupId: string, playerId: string) => {
    setAdvanceSelected((prev) => {
      const current = prev[groupId] || [];
      return {
        ...prev,
        [groupId]: current.includes(playerId)
          ? current.filter((id) => id !== playerId)
          : [...current, playerId],
      };
    });
  };

  const handleAdvance = (groupId: string) => {
    const ids = advanceSelected[groupId] || [];
    if (ids.length === 0) return;
    
    const newGroups = groups.map((g) =>
      g.id === groupId
        ? {
            ...g,
            members: g.members.map((m) =>
              ids.includes(m.playerId) ? { ...m, isAdvanced: true } : m
            ),
          }
        : g
    );

    onGroupsChange(newGroups);
    if (detailDialog?.id === groupId) {
      setDetailDialog(newGroups.find(g => g.id === groupId) || null);
    }

    setAdvanceSelected((prev) => ({ ...prev, [groupId]: [] }));
    toast.success(`${ids.length} ${t("competition.advancing")}`);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <Users className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">{t("competition.phase_group_stage") || "Group Stage"}</h2>
          <Badge variant="secondary" className="text-xs">
            {finalists.length} {t("competition.finalist")}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {allAssignedIds.length} {t("competition.assigned")}
          </Badge>
        </div>
      </div>

      {/* Add Group */}
      <div className="flex flex-wrap items-center gap-2 bg-muted/30 p-3 rounded-lg border border-border">
        <Input
          placeholder={t("competition.group_name_placeholder") || "e.g. Group A"}
          value={newGroupName}
          onChange={(e) => setNewGroupName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddGroup()}
          className="w-[200px] h-9"
        />
        
        <Select value={newGroupStage} onValueChange={(val) => { setNewGroupStage(val); if (val === "Semifinal") setNewGroupSources([]); }}>
          <SelectTrigger className="w-[150px] h-9">
            <SelectValue placeholder="Stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Semifinal">Semifinal</SelectItem>
            <SelectItem value="Final">Final</SelectItem>
            <SelectItem value="Champion">Champion</SelectItem>
          </SelectContent>
        </Select>

        {newGroupStage !== "Semifinal" && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-[180px] h-9 justify-between font-normal">
                <span className="truncate">
                  {newGroupSources.length === 0
                    ? "Stage Sources"
                    : `${newGroupSources.length} selected`}
                </span>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[180px]">
              <DropdownMenuLabel>Select Sources</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {groups.map((g) => (
                <DropdownMenuCheckboxItem
                  key={g.id}
                  checked={newGroupSources.includes(g.id)}
                  onSelect={(e) => e.preventDefault()}
                  onCheckedChange={(checked) => {
                    setNewGroupSources(
                      checked
                        ? [...newGroupSources, g.id]
                        : newGroupSources.filter((id) => id !== g.id)
                    );
                  }}
                >
                  <span className="truncate max-w-[130px] inline-block" title={g.name}>{g.name}</span>
                </DropdownMenuCheckboxItem>
              ))}
              {groups.length === 0 && (
                <div className="text-xs text-muted-foreground p-2 text-center">No groups available</div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <div className="flex items-center gap-2 shrink-0 md:ml-auto">
          <Button onClick={handleAddGroup} variant="secondary" className="gap-1.5 h-9 shrink-0">
            <Plus className="h-4 w-4" />
            {t("competition.add_group") || "Add Group"}
          </Button>

          {onSave && (
            <Button onClick={onSave} disabled={isSaving} className="gap-1.5 h-9 px-4 shrink-0 transition-all">
              {isSaving ? (
                <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save
            </Button>
          )}
        </div>
      </div>

      {/* Groups */}
      {groups.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center">
          <p className="text-muted-foreground text-sm">{t("competition.no_groups")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => {
            const groupAdvance = advanceSelected[group.id] || [];
            const advancedCount = group.members.filter((m) => m.isAdvanced).length;

            return (
              <div key={group.id} className="rounded-lg border bg-card overflow-hidden">
                {/* Group Header */}
                <div
                  className="flex items-center justify-between p-4 cursor-pointer select-none hover:bg-muted/30 transition-colors"
                  onClick={() => setDetailDialog(group)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <h3 className="font-semibold text-sm truncate max-w-[150px] md:max-w-[300px]" title={group.name}>{group.name}</h3>
                    {group.stage && (
                      <Badge variant="outline" className="text-[10px] h-5">
                        {group.stage}
                      </Badge>
                    )}
                    <Badge variant="secondary" className="text-[10px] gap-1 h-5">
                      <Users className="h-3 w-3" /> {group.members.length}
                    </Badge>
                    {group.quizIds.length > 0 && (
                      <Badge variant="outline" className="text-[10px] h-5 gap-1">
                        <BookOpen className="h-3 w-3" /> {group.quizIds.length} quiz
                      </Badge>
                    )}
                    {group.gameIds.length > 0 && (
                      <Badge variant="outline" className="text-[10px] h-5 gap-1 text-violet-600 border-violet-300 bg-violet-500/10">
                        <Gamepad2 className="h-3 w-3" /> {group.gameIds.length} game
                      </Badge>
                    )}
                    {advancedCount > 0 && (
                      <Badge variant="outline" className="text-[10px] h-5 gap-0.5 text-emerald-600 border-emerald-300 bg-emerald-500/10">
                        <ArrowUpRight className="h-3 w-3" /> {advancedCount}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {group.stage !== "Champion" && (
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
                        onClick={(e) => { e.stopPropagation(); setQuizDialog(group); }}>
                        <BookOpen className="h-3 w-3" /> {t("competition.assign_quiz")}
                      </Button>
                    )}
                    {group.stage !== "Champion" && (
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
                        onClick={(e) => { e.stopPropagation(); setGameDialog(group); }}>
                        <Gamepad2 className="h-3 w-3" /> {t("competition.assign_game") || "Assign Game"}
                      </Button>
                    )}
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
                      onClick={(e) => { e.stopPropagation(); setAssignDialog(group); }}>
                      <UserPlus className="h-3 w-3" /> {t("competition.assign_finalist")}
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditGroup(group);
                        setEditGroupName(group.name);
                        setEditGroupStage(group.stage || "Semifinal");
                        setEditGroupSources(group.sources || []);
                      }}>
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive"
                      onClick={(e) => { e.stopPropagation(); handleDeleteGroup(group.id); }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={!!detailDialog} onOpenChange={(open) => { if (!open) { setDetailDialog(null); setDetailSearch(""); } }}>
        <DialogContent className="sm:max-w-[600px]">
          {detailDialog && (() => {
            const group = detailDialog;
            const groupAdvance = advanceSelected[group.id] || [];
            return (
              <>
                <DialogHeader className="flex flex-row items-center justify-between pr-6 gap-4">
                <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                  <DialogTitle className="flex items-center gap-2 min-w-0">
                    <Trophy className="h-5 w-5 text-yellow-500 shrink-0" />
                    <span className="truncate" title={group.name}>{group.name}</span>
                    {group.stage && (
                      <Badge variant="outline" className="text-[10px] h-5 shrink-0 font-normal">
                        {group.stage}
                      </Badge>
                    )}
                  </DialogTitle>
                  {(group.quizIds.length > 0 || group.gameIds.length > 0) && (
                    <div className="flex items-center gap-2 pl-7 flex-wrap">
                      {group.quizIds.length > 0 && (
                        <Badge 
                          variant="secondary" 
                          className="text-[10px] cursor-pointer hover:bg-muted-foreground/10 transition-colors"
                          onClick={() => { setDetailDialog(null); setTimeout(() => setQuizDialog(group), 150); }}
                          title={t("competition.assign_quiz") + ` (${group.quizIds.length})`}
                        >
                          <BookOpen className="h-3 w-3 mr-1" />
                          {group.quizIds.length} {group.quizIds.length === 1 ? "Quiz" : "Quizzes"}
                        </Badge>
                      )}
                      {group.gameIds.length > 0 && (
                        <Badge 
                          variant="secondary" 
                          className="text-[10px] cursor-pointer text-violet-600 border-violet-300 bg-violet-500/10 hover:bg-violet-500/20 transition-colors"
                          onClick={() => { setDetailDialog(null); setTimeout(() => setGameDialog(group), 150); }}
                          title={(t("competition.assign_game") || "Assign Game") + ` (${group.gameIds.length})`}
                        >
                          <Gamepad2 className="h-3 w-3 mr-1" />
                          {group.gameIds.length} {group.gameIds.length === 1 ? "Game" : "Games"}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
                  <div className="w-56 shrink-0 mt-0">
                    <SearchInput
                      placeholder={t("comp_detail.search_player") || "Search player..."}
                      value={detailSearch}
                      onSearch={setDetailSearch}
                      className="w-full h-8 text-xs"
                    />
                  </div>
                </DialogHeader>
                <div className="mt-3 flex flex-col gap-3">
                  {group.members.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">{t("competition.no_members")}</p>
                  ) : (() => {
                    const visibleMembers = [...group.members]
                      .filter(m => m.playerName.toLowerCase().includes(detailSearch.toLowerCase()))
                      .sort((a, b) => b.score - a.score);
                    
                    const availableToAdvance = visibleMembers.filter(m => !m.isAdvanced);
                    const allSelected = availableToAdvance.length > 0 && availableToAdvance.every(m => groupAdvance.includes(m.playerId));

                    return (
                    <div className="border rounded-md overflow-hidden">
                      <div className={`grid ${group.stage === "Champion" ? "grid-cols-[32px_1fr_80px_80px_40px]" : "grid-cols-[28px_1fr_80px_80px_40px]"} gap-2 px-4 py-2 items-center text-[11px] font-medium text-muted-foreground border-b bg-muted/30`}>
                        {group.stage === "Champion" ? <span className="text-center">#</span> : (
                          <div className="flex items-center">
                            <Checkbox 
                              checked={availableToAdvance.length > 0 && allSelected}
                              onCheckedChange={() => {
                                if (allSelected) {
                                  const idsToRemove = availableToAdvance.map(m => m.playerId);
                                  setAdvanceSelected(prev => ({
                                    ...prev,
                                    [group.id]: (prev[group.id] || []).filter(id => !idsToRemove.includes(id))
                                  }));
                                } else {
                                  const idsToAdd = availableToAdvance.map(m => m.playerId);
                                  setAdvanceSelected(prev => {
                                    const current = prev[group.id] || [];
                                    const newIds = Array.from(new Set([...current, ...idsToAdd]));
                                    return { ...prev, [group.id]: newIds };
                                  });
                                }
                              }}
                              className="h-4 w-4 bg-background border-muted-foreground/40 mt-0.5"
                            />
                          </div>
                        )}
                        <span>{t("comp_detail.table_player") || "Player"}</span>
                        <span className="text-center">{t("comp_detail.table_avg") || "Score"}</span>
                        <span className="text-center">{t("competition.time") || "Time"}</span>
                        <span />
                      </div>
                      <div className="max-h-[50vh] overflow-y-auto w-full">
                        {visibleMembers
                          .map((member, idx) => (
                            <div key={member.playerId}
                              className={`grid ${group.stage === "Champion" ? "grid-cols-[32px_1fr_80px_80px_40px]" : "grid-cols-[28px_1fr_80px_80px_40px]"} gap-2 items-center px-4 py-2.5 text-sm border-b last:border-b-0 transition-colors ${
                                member.isAdvanced ? "bg-emerald-500/5" : groupAdvance.includes(member.playerId) ? "bg-primary/5" : ""
                              } ${group.stage !== "Champion" ? "cursor-pointer hover:bg-muted/40" : ""}`}
                              onClick={() => {
                                if (group.stage === "Champion") return;
                                if (member.isAdvanced) {
                                  setPlayerToUnAdvance({
                                    groupId: group.id,
                                    playerId: member.playerId,
                                    playerName: member.playerName,
                                  });
                                } else {
                                  toggleAdvance(group.id, member.playerId);
                                }
                              }}>
                              {group.stage === "Champion" ? (
                                <span className={`text-center text-xs font-bold ${
                                  idx === 0 ? "text-yellow-500" :
                                  idx === 1 ? "text-gray-400" :
                                  idx === 2 ? "text-orange-500" :
                                  "text-muted-foreground"
                                }`}>#{idx + 1}</span>
                              ) : (
                                <div onClick={(e) => e.stopPropagation()}>
                                  <Checkbox
                                    checked={groupAdvance.includes(member.playerId) || member.isAdvanced}
                                    onCheckedChange={() => {
                                      if (member.isAdvanced) {
                                        setPlayerToUnAdvance({
                                          groupId: group.id,
                                          playerId: member.playerId,
                                          playerName: member.playerName,
                                        });
                                      } else {
                                        toggleAdvance(group.id, member.playerId);
                                      }
                                    }}
                                    className="h-4 w-4 bg-background border-muted-foreground/40"
                                  />
                                </div>
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
                      {groupAdvance.length > 0 && (
                        <div className="px-4 py-3 border-t bg-muted/20">
                          <Button size="sm" className="gap-1.5 h-8 text-xs w-full font-medium" onClick={() => handleAdvance(group.id)}>
                            <ArrowUpRight className="h-4 w-4" />
                            {t("competition.advance_selected")} ({groupAdvance.length})
                          </Button>
                        </div>
                      )}
                    </div>
                    );
                  })()}
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Assign Players Dialog */}
      <Dialog open={!!assignDialog} onOpenChange={(open) => { if (!open) { setAssignDialog(null); setAssignSelected([]); setAssignSearch(""); } }}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              {t("competition.assign_finalist")} — {assignDialog?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <SearchInput
                placeholder={t("comp_detail.search_finalist") || "Search finalist..."}
                value={assignSearch}
                onSearch={(val) => setAssignSearch(val)}
              />
            </div>
            <Button
              variant="outline"
              className="shrink-0 h-9 px-3 text-xs"
              onClick={() => {
                let availableRaw: DummyPlayer[] = [];
                if (assignDialog?.sources && assignDialog.sources.length > 0) {
                  const sourceGroups = groups.filter(g => assignDialog.sources!.includes(g.id));
                  const advancedPlayerIds = sourceGroups.flatMap(g => g.members.filter(m => m.isAdvanced).map(m => m.playerId));
                  const currentMemberIds = assignDialog.members.map(m => m.playerId);
                  availableRaw = finalists.filter(f => advancedPlayerIds.includes(f.id) && !currentMemberIds.includes(f.id));
                } else {
                  availableRaw = finalists.filter((f) => !allAssignedIds.includes(f.id));
                }

                const availableFiltered = availableRaw.filter(f => f.name.toLowerCase().includes(assignSearch.toLowerCase()));
                const allSelected = availableFiltered.length > 0 && availableFiltered.every((f) => assignSelected.includes(f.id));
                
                if (allSelected) {
                  setAssignSelected([]);
                } else {
                  setAssignSelected(availableFiltered.map((f) => f.id));
                }
              }}
            >
              {(() => {
                let availableRaw: DummyPlayer[] = [];
                if (assignDialog?.sources && assignDialog.sources.length > 0) {
                  const sourceGroups = groups.filter(g => assignDialog.sources!.includes(g.id));
                  const advancedPlayerIds = sourceGroups.flatMap(g => g.members.filter(m => m.isAdvanced).map(m => m.playerId));
                  const currentMemberIds = assignDialog.members.map(m => m.playerId);
                  availableRaw = finalists.filter(f => advancedPlayerIds.includes(f.id) && !currentMemberIds.includes(f.id));
                } else {
                  availableRaw = finalists.filter((f) => !allAssignedIds.includes(f.id));
                }

                const availableFiltered = availableRaw.filter(f => f.name.toLowerCase().includes(assignSearch.toLowerCase()));
                const allSelected = availableFiltered.length > 0 && availableFiltered.every((f) => assignSelected.includes(f.id));
                return allSelected ? t("competition.deselect_all") : t("competition.select_all");
              })()}
            </Button>
          </div>
          <div className="max-h-64 overflow-y-auto space-y-1 border rounded-md p-2">
            {(() => {
              let availableRaw: DummyPlayer[] = [];
              if (assignDialog?.sources && assignDialog.sources.length > 0) {
                const sourceGroups = groups.filter(g => assignDialog.sources!.includes(g.id));
                const advancedPlayerIds = sourceGroups.flatMap(g => g.members.filter(m => m.isAdvanced).map(m => m.playerId));
                const currentMemberIds = assignDialog.members.map(m => m.playerId);
                availableRaw = finalists.filter(f => advancedPlayerIds.includes(f.id) && !currentMemberIds.includes(f.id));
              } else {
                availableRaw = finalists.filter((f) => !allAssignedIds.includes(f.id));
              }

              const availableFiltered = availableRaw.filter(f => f.name.toLowerCase().includes(assignSearch.toLowerCase()));

              if (availableFiltered.length === 0) {
                return <p className="text-sm text-muted-foreground text-center py-4">{t("comp_detail.no_players")}</p>;
              }

              return (
                <>
                  {availableFiltered.map((player) => {
                    const isSel = assignSelected.includes(player.id);
                    return (
                      <div key={player.id} 
                        onClick={() => setAssignSelected((p) => isSel ? p.filter((x) => x !== player.id) : [...p, player.id])}
                        role="button" 
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setAssignSelected((p) => isSel ? p.filter((x) => x !== player.id) : [...p, player.id]);
                          }
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left text-sm transition-colors cursor-pointer ${isSel ? "bg-primary/10 border border-primary/30" : "hover:bg-muted/50"}`}>
                        <input type="checkbox" checked={isSel} readOnly className="h-4 w-4 accent-primary" />
                        <Avatar className="h-7 w-7"><AvatarFallback className="text-[10px]">{player.name.substring(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                        <div className="flex-1 flex flex-col min-w-0 pr-2">
                          <span className="font-medium text-sm truncate" title={player.name}>{player.name}</span>
                          <span className="text-[10px] text-muted-foreground truncate" title={`@${player.name.toLowerCase().replace(/\s+/g, '')}`}>
                            @{player.name.toLowerCase().replace(/\s+/g, '')}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{player.avgScore.toFixed(1)} pts</span>
                      </div>
                    );
                  })}
                </>
              );
            })()}
          </div>
          <DialogFooter>
            <span className="text-xs text-muted-foreground mr-auto">{assignSelected.length} {t("competition.selected")}</span>
            <Button variant="outline" onClick={() => { setAssignDialog(null); setAssignSelected([]); }}>{t("action.cancel")}</Button>
            <Button onClick={handleAssignPlayers} disabled={assignSelected.length === 0} className="gap-1.5">
              <UserPlus className="h-4 w-4" /> {t("competition.assign_action")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Quiz Dialog */}
      <Dialog open={!!quizDialog} onOpenChange={(open) => { if (!open) { setQuizDialog(null); setQuizSearch(""); } }}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 max-w-full overflow-hidden">
              <BookOpen className="h-5 w-5 shrink-0" />
              <span className="truncate">{t("competition.assign_quiz")} — {quizDialog?.name}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="mb-2 w-full min-w-0">
            <SearchInput
              placeholder={t("quiz.search") || "Search quiz..."}
              value={quizSearch}
              onSearch={(val) => setQuizSearch(val)}
            />
          </div>
          <Tabs defaultValue="public" className="w-full min-w-0">
            <TabsList className="grid w-full min-w-0 grid-cols-2 mb-4">
              <TabsTrigger value="public">{t("competition.public_quiz") || "Public Quiz"}</TabsTrigger>
              <TabsTrigger value="my">{t("competition.my_quiz") || "My Quiz"}</TabsTrigger>
            </TabsList>
            <TabsContent value="public" className="space-y-2 mt-0 overflow-y-auto pr-1 max-h-[45vh] w-full min-w-0">
              {(() => {
                const filteredQuizzes = quizzes.filter(q => q.isPublic && q.title.toLowerCase().includes(quizSearch.toLowerCase()));
                if (filteredQuizzes.length === 0) {
                  return (
                    <div className="text-center py-6 border rounded-lg border-dashed">
                      <p className="text-sm text-muted-foreground">{t("competition.no_quizzes_found") || "No quizzes found."}</p>
                    </div>
                  );
                }
                return filteredQuizzes.map((quiz) => {
                  const isAssigned = quizDialog?.quizIds.includes(quiz.id);
                  return (
                    <div key={quiz.id}
                      onClick={() => quizDialog && handleAssignQuiz(quizDialog.id, quiz.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          if (quizDialog) handleAssignQuiz(quizDialog.id, quiz.id);
                        }
                      }}
                      className={`w-full max-w-full overflow-hidden flex items-center justify-between px-4 py-3 rounded-lg border text-sm transition-colors cursor-pointer ${
                        isAssigned ? "bg-primary/10 border-primary/30" : "hover:bg-muted/50"
                      }`}>
                      <div className="flex items-center gap-3 w-full min-w-0">
                        <Checkbox checked={!!isAssigned} disabled className="h-4 w-4 shrink-0 bg-background border-muted-foreground/40" />
                        <div className="text-left flex-1 min-w-0 pr-2">
                          <p className="font-medium truncate" title={quiz.title}>{quiz.title}</p>
                          <p className="text-xs text-muted-foreground">{quiz.questionCount} {t("competition.questions")}</p>
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
            </TabsContent>
            <TabsContent value="my" className="space-y-2 mt-0 overflow-y-auto pr-1 max-h-[45vh] w-full min-w-0">
              {(() => {
                const filteredQuizzes = [...quizzes].reverse().filter(q => q.creatorId === currentUserId && q.title.toLowerCase().includes(quizSearch.toLowerCase()));
                if (filteredQuizzes.length === 0) {
                  return (
                    <div className="text-center py-6 border rounded-lg border-dashed">
                      <p className="text-sm text-muted-foreground">{t("competition.no_quizzes_found") || "No quizzes found."}</p>
                    </div>
                  );
                }
                return filteredQuizzes.map((quiz) => {
                  const isAssigned = quizDialog?.quizIds.includes(quiz.id);
                  return (
                    <div key={quiz.id}
                      onClick={() => quizDialog && handleAssignQuiz(quizDialog.id, quiz.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          if (quizDialog) handleAssignQuiz(quizDialog.id, quiz.id);
                        }
                      }}
                      className={`w-full max-w-full overflow-hidden flex items-center justify-between px-4 py-3 rounded-lg border text-sm transition-colors cursor-pointer ${
                        isAssigned ? "bg-primary/10 border-primary/30" : "hover:bg-muted/50"
                      }`}>
                      <div className="flex items-center gap-3 w-full min-w-0">
                        <Checkbox checked={!!isAssigned} disabled className="h-4 w-4 shrink-0 bg-background border-muted-foreground/40" />
                        <div className="text-left flex-1 min-w-0 pr-2">
                          <p className="font-medium truncate" title={quiz.title}>{quiz.title}</p>
                          <p className="text-xs text-muted-foreground">{quiz.questionCount} {t("competition.questions")}</p>
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
            </TabsContent>
          </Tabs>
          <DialogFooter className="w-full min-w-0">
            <Button variant="outline" onClick={() => setQuizDialog(null)}>{t("action.close")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Game Dialog */}
      <Dialog open={!!gameDialog} onOpenChange={(open) => { if (!open) { setGameDialog(null); setGameSearch(""); } }}>
        <DialogContent className="sm:max-w-[400px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 max-w-full overflow-hidden">
              <Gamepad2 className="h-5 w-5 shrink-0" />
              <span className="truncate">{t("competition.assign_game") || "Assign Game"} — {gameDialog?.name}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="mb-2">
            <SearchInput
              placeholder={t("competition.search_game") || "Search game..."}
              value={gameSearch}
              onSearch={(val) => setGameSearch(val)}
            />
          </div>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {(() => {
              const filteredGames = games.filter(g => g.name.toLowerCase().includes(gameSearch.toLowerCase()));
              if (filteredGames.length === 0) {
                return (
                  <div className="text-center py-6 border rounded-lg border-dashed">
                    <p className="text-sm text-muted-foreground">{t("competition.no_games_found") || "No games found."}</p>
                  </div>
                );
              }
              return filteredGames.map((game) => {
                const isAssigned = gameDialog?.gameIds.includes(game.name);
                return (
                  <div key={game.name}
                    onClick={() => gameDialog && handleAssignGame(gameDialog.id, game.name)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        if (gameDialog) handleAssignGame(gameDialog.id, game.name);
                      }
                    }}
                    className={`w-full max-w-full overflow-hidden flex items-center justify-between px-4 py-3 rounded-lg border text-sm transition-colors cursor-pointer ${
                      isAssigned ? "bg-violet-500/10 border-violet-400/30" : "hover:bg-muted/50"
                    }`}>
                    <div className="flex items-center gap-3 w-full min-w-0">
                      <Checkbox checked={!!isAssigned} disabled className="h-4 w-4 shrink-0 bg-background border-muted-foreground/40" />
                      <div className="text-left flex-1 min-w-0 pr-2">
                        <p className="font-medium capitalize truncate" title={game.name}>{game.name}</p>
                        <p className="text-xs text-muted-foreground">{game.count.toLocaleString("id-ID")} sessions</p>
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGameDialog(null)}>{t("action.close") || "Close"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Un-advance Confirmation Dialog */}
      <AlertDialog open={!!playerToUnAdvance} onOpenChange={(open) => { if (!open) setPlayerToUnAdvance(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("common.are_you_sure") || "Are you sure?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {(t("comp_detail.unadvance_confirm") || `Are you sure you want to revoke {name}'s advanced status?`).replace("{name}", playerToUnAdvance?.playerName || "")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("action.cancel") || "Cancel"}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (playerToUnAdvance) {
                  const newGroups = groups.map((g) =>
                    g.id === playerToUnAdvance.groupId
                      ? { ...g, members: g.members.map((m) => m.playerId === playerToUnAdvance.playerId ? { ...m, isAdvanced: false } : m) }
                      : g
                  );
                  onGroupsChange(newGroups);
                  
                  if (detailDialog?.id === playerToUnAdvance.groupId) {
                    setDetailDialog(newGroups.find(g => g.id === playerToUnAdvance.groupId) || null);
                  }

                  setPlayerToUnAdvance(null);
                  toast.success(t("comp_detail.unadvance_success") || "Advanced status revoked");
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("action.revoke") || "Revoke"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Group Dialog */}
      <Dialog open={!!editGroup} onOpenChange={(open) => { if (!open) setEditGroup(null); }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("competition.edit_group") || "Edit Group"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">{t("competition.group_name") || "Group Name"}</label>
              <Input
                placeholder={t("competition.group_name_placeholder") || "e.g. Group A"}
                value={editGroupName}
                onChange={(e) => setEditGroupName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleUpdateGroup()}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">{t("competition.stage") || "Stage"}</label>
              <Select value={editGroupStage} onValueChange={(val) => { setEditGroupStage(val); if (val === "Semifinal") setEditGroupSources([]); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Semifinal">Semifinal</SelectItem>
                  <SelectItem value="Final">Final</SelectItem>
                  <SelectItem value="Champion">Champion</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {editGroupStage !== "Semifinal" && (
              <div className="grid gap-2">
                <label className="text-sm font-medium">{t("competition.source_groups") || "Source Groups"}</label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-between font-normal">
                      {editGroupSources.length > 0
                        ? `${editGroupSources.length} ${t("competition.selected")}`
                        : t("competition.select_source")}
                      <ChevronDownIcon className="h-4 w-4 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[375px]" align="start">
                    <DropdownMenuLabel>{t("competition.source_groups")}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {groups
                      .filter((g) => g.id !== editGroup?.id)
                      .map((g) => {
                        const isSelected = editGroupSources.includes(g.id);
                        return (
                          <DropdownMenuCheckboxItem
                            key={g.id}
                            checked={isSelected}
                            onCheckedChange={(checked) => {
                              setEditGroupSources((prev) =>
                                checked ? [...prev, g.id] : prev.filter((id) => id !== g.id)
                              );
                            }}
                          >
                            <span className="truncate max-w-[280px] inline-block mb-[-4px]" title={g.name}>
                              {g.name} <span className="text-muted-foreground">({g.stage || "Semifinal"})</span>
                            </span>
                          </DropdownMenuCheckboxItem>
                        );
                      })}
                    {groups.filter((g) => g.id !== editGroup?.id).length === 0 && (
                      <div className="px-2 py-4 text-xs text-muted-foreground text-center">
                        {t("competition.no_groups_yet")}
                      </div>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditGroup(null)}>{t("action.cancel") || "Cancel"}</Button>
            <Button onClick={handleUpdateGroup}>{t("action.save") || "Save changes"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bracket Visualization */}
      {groups.length > 0 && (
        <>
          <div className="border-t pt-4 mt-2" />
          <LocalBracketView groups={groups} />
        </>
      )}
    </div>
  );
}
