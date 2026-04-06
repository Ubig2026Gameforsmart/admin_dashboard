"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n";
import { toast } from "sonner";
import { DummyPlayer, MockQuiz } from "@/types/competition";
import {
  Plus, Trash2, Users, UserPlus, BookOpen, Trophy, Clock,
  ArrowUpRight, ChevronDown as ChevronDownIcon, ChevronUp, Maximize2, Edit, Gamepad2, Save, ArrowLeft, RefreshCw, Play
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
import { Combobox } from "@/components/ui/combobox";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search, ChevronDown } from "lucide-react";
import { LocalBracketView } from "./local-bracket-view";
import { generateXID } from "@/lib/id-generator";

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
  competitionId?: string;
  isDirty?: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export interface RoundConfig {
  round: number;
  quiz_id: string;
  game_id: string;
}

export interface LocalGroup {
  id: string;
  name: string;
  rounds: RoundConfig[];
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
  competitionId,
  isDirty,
  onRefresh,
  isRefreshing,
}: PhaseGroupStageProps) {
  const { t } = useTranslation();
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupStage, setNewGroupStage] = useState("Semifinal");
  const [newGroupSources, setNewGroupSources] = useState<string[]>([]);
  const [detailDialog, setDetailDialog] = useState<LocalGroup | null>(null);
  const [detailSearch, setDetailSearch] = useState("");
  const [assignDialog, setAssignDialog] = useState<LocalGroup | null>(null);
  const [roundsDialog, setRoundsDialog] = useState<{ group: LocalGroup, rounds: { quizId: string, gameId: string }[] } | null>(null);
  const [assignSearch, setAssignSearch] = useState("");
  const [assignSelected, setAssignSelected] = useState<string[]>([]);
  const [advanceSelected, setAdvanceSelected] = useState<Record<string, string[]>>({});
  const [playerToUnAdvance, setPlayerToUnAdvance] = useState<{groupId: string, playerId: string, playerName: string} | null>(null);

  // Edit Group state
  const [editGroup, setEditGroup] = useState<LocalGroup | null>(null);
  const [editGroupName, setEditGroupName] = useState("");
  const [editGroupStage, setEditGroupStage] = useState("");
  const [editGroupSources, setEditGroupSources] = useState<string[]>([]);

  // Remove confirmation state
  const [removeConfirm, setRemoveConfirm] = useState<{
    type: "member" | "quiz" | "game";
    groupId: string;
    itemId: string;
    label: string;
  } | null>(null);

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
      id: generateXID(),
      name: newGroupName.trim(),
      rounds: [],
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
        score: 0,
        timeSeconds: 0,
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

  const openRoundsDialog = (group: LocalGroup) => {
    const rounds = group.rounds.length > 0
      ? group.rounds.map(r => ({ quizId: r.quiz_id || "", gameId: r.game_id || "" }))
      : [{ quizId: "", gameId: "" }];
    setRoundsDialog({ group, rounds });
  };

  const handleSaveRounds = () => {
    if (!roundsDialog) return;
    
    // Convert dialog rounds to RoundConfig[], trimming empty trailing rounds
    let newRounds: RoundConfig[] = roundsDialog.rounds.map((r, idx) => ({
      round: idx + 1,
      quiz_id: r.quizId,
      game_id: r.gameId,
    }));
    
    while (newRounds.length > 0 && newRounds[newRounds.length - 1].quiz_id === "" && newRounds[newRounds.length - 1].game_id === "") {
      newRounds.pop();
    }

    const newGroups = groups.map((g) =>
      g.id === roundsDialog.group.id ? { ...g, rounds: newRounds } : g
    );
    onGroupsChange(newGroups);
    setRoundsDialog(null);
    toast.success("Rounds configured successfully");
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
          {onRefresh && (
            <Button 
              onClick={onRefresh} 
              variant="outline" 
              size="icon"
              className="h-9 w-9 shrink-0" 
              title={t("action.refresh") || "Refresh Data"}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          )}

          <Button onClick={handleAddGroup} variant="secondary" className="gap-1.5 h-9 shrink-0">
            <Plus className="h-4 w-4" />
            {t("competition.add_group") || "Add Group"}
          </Button>

          {onSave && (
            <div className="flex items-center gap-2 shrink-0">
              {isDirty && !isSaving && (
                <span className="text-xs text-amber-500 dark:text-amber-400 animate-pulse font-medium hidden sm:inline">
                  ● {t("competition.unsaved_changes") || "Unsaved changes"}
                </span>
              )}
              <Button onClick={onSave} disabled={isSaving} className={`gap-1.5 h-9 px-4 shrink-0 transition-all relative ${isDirty && !isSaving ? 'ring-2 ring-amber-500/50 ring-offset-1 ring-offset-background' : ''}`}>
                {isSaving ? (
                  <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {t("action.save") || "Save"}
                {isDirty && !isSaving && (
                  <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />
                )}
              </Button>
            </div>
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
                    {group.rounds.length > 0 && (() => {
                      const rounds = group.rounds.length;
                      return (
                        <Badge variant="outline" className="text-[10px] h-5 gap-1 text-primary border-primary/20 bg-primary/10">
                          <Trophy className="h-3 w-3" /> {rounds} {rounds === 1 ? 'round' : 'rounds'}
                        </Badge>
                      );
                    })()}
                    {advancedCount > 0 && (
                      <Badge variant="outline" className="text-[10px] h-5 gap-0.5 text-emerald-600 border-emerald-300 bg-emerald-500/10">
                        <ArrowUpRight className="h-3 w-3" /> {advancedCount}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {group.stage !== "Champion" && (
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1 font-medium bg-indigo-50/50 hover:bg-indigo-100/50 text-indigo-700 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800"
                        onClick={(e) => { e.stopPropagation(); openRoundsDialog(group); }}>
                        <BookOpen className="h-3 w-3" /> Assign Quiz
                      </Button>
                    )}
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
                      onClick={(e) => { e.stopPropagation(); setAssignDialog(group); }}>
                      <UserPlus className="h-3 w-3" /> {t("competition.assign_finalist")}
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      title={t("action.edit") || "Edit"}
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
                      title={t("action.delete") || "Delete"}
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
                  {group.rounds.length > 0 && (() => {
                    const totalRounds = group.rounds.length;
                    return (
                    <div className="flex items-center gap-2 pl-7 flex-wrap">
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
                        <PopoverContent align="start" className="w-[320px] p-0 shadow-xl border-muted">
                          <div className="p-3 border-b bg-muted/20">
                            <h4 className="font-semibold text-sm flex items-center gap-2 text-primary">
                              <Trophy className="h-4 w-4" /> {t("competition.assigned_rounds") || "Assigned Rounds"}
                            </h4>
                          </div>
                          <div className="max-h-[300px] overflow-y-auto p-2 space-y-2" onWheelCapture={(e) => e.stopPropagation()} onTouchMoveCapture={(e) => e.stopPropagation()}>
                            {group.rounds.map((roundConfig, i) => {
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
                                      <div className="flex items-start gap-2.5 group/quiz-item">
                                        <div className="mt-0.5 w-6 h-6 rounded-md bg-blue-500/10 flex flex-col items-center justify-center shrink-0">
                                          <BookOpen className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div className="flex flex-col min-w-0 flex-1">
                                          <span className="text-sm font-medium leading-tight truncate" title={quiz?.title || qId}>{quiz?.title || qId}</span>
                                          {quiz && <span className="text-[10.5px] text-muted-foreground mt-0.5">{quiz.questionCount} {t("competition.questions") || "questions"}</span>}
                                        </div>
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          className="h-6 w-6 shrink-0 opacity-0 group-hover/quiz-item:opacity-100 transition-opacity text-muted-foreground hover:text-foreground hover:bg-muted"
                                          title={t("competition.remove_quiz") || "Remove quiz"}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setRemoveConfirm({
                                              type: "quiz",
                                              groupId: group.id,
                                              itemId: qId,
                                              label: quiz?.title || qId,
                                            });
                                          }}
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                      </div>
                                    )}

                                    {gId && (
                                      <div className="flex items-center gap-2.5 group/game-item">
                                        <div className="w-6 h-6 rounded-md bg-violet-500/10 flex items-center justify-center shrink-0">
                                          <Gamepad2 className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                                        </div>
                                        <span className="text-sm font-medium leading-none truncate capitalize text-violet-700 dark:text-violet-300 flex-1" title={game?.name || gId}>
                                          {game?.name || gId}
                                        </span>
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          className="h-6 w-6 shrink-0 opacity-0 group-hover/game-item:opacity-100 transition-opacity text-violet-400 hover:text-violet-600 hover:bg-violet-500/10"
                                          title={t("competition.remove_game") || "Remove game"}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setRemoveConfirm({
                                              type: "game",
                                              groupId: group.id,
                                              itemId: gId,
                                              label: game?.name || gId,
                                            });
                                          }}
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
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
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          // TODO: Implement Session Creation Logic
                                        }}
                                      >
                                        <Play className="h-3 w-3 fill-current" /> {t("action.start") || "Start"}
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          <div className="p-2 border-t bg-muted/10">
                            <Button size="sm" variant="ghost" className="w-full text-xs h-8" onClick={() => { setDetailDialog(null); setTimeout(() => openRoundsDialog(group), 150); }}>
                              {t("competition.manage_rounds") || "Manage Rounds"} <ArrowUpRight className="ml-1 h-3 w-3" />
                            </Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                    );
                  })()}
                </div>
                  <div className="flex items-center gap-2 shrink-0 mt-0">
                    <div className="w-56">
                      <SearchInput
                        placeholder={t("comp_detail.search_player") || "Search player..."}
                        value={detailSearch}
                        onSearch={setDetailSearch}
                        className="w-full h-8 text-xs"
                      />
                    </div>
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
                      <div className={`grid ${group.stage === "Champion" ? "grid-cols-[32px_1fr_80px_80px_40px]" : "grid-cols-[28px_1fr_80px_80px_40px_28px]"} gap-2 px-4 py-2 items-center text-[11px] font-medium text-muted-foreground border-b bg-muted/30`}>
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
                        {group.stage !== "Champion" && <span />}
                      </div>
                      <div className="max-h-[50vh] overflow-y-auto w-full">
                        {visibleMembers
                          .map((member, idx) => (
                            <div key={member.playerId}
                              className={`grid ${group.stage === "Champion" ? "grid-cols-[32px_1fr_80px_80px_40px]" : "grid-cols-[28px_1fr_80px_80px_40px_28px]"} gap-2 items-center px-4 py-2.5 text-sm border-b last:border-b-0 transition-colors ${
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
                                  <div className={`flex items-center gap-1.5 min-w-0 ${member.isAdvanced ? "text-emerald-600" : ""}`}>
                                    <span className="font-semibold text-sm truncate" title={member.playerName}>
                                      {member.playerName}
                                    </span>
                                    {group.stage === "Final" && finalists.find(f => f.id === member.playerId)?.isPresent === false && (
                                      <Badge variant="destructive" className="text-[8px] h-4 px-1.5 py-0 uppercase leading-none font-bold shrink-0">{t("receptionist.absent") || "Absent"}</Badge>
                                    )}
                                  </div>
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
                              {group.stage !== "Champion" && (
                                <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-6 w-6 text-muted-foreground hover:text-foreground hover:bg-muted"
                                    title={t("action.remove") || "Remove from group"}
                                    onClick={() => {
                                      setRemoveConfirm({
                                        type: "member",
                                        groupId: group.id,
                                        itemId: member.playerId,
                                        label: member.playerName,
                                      });
                                    }}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
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
                {group.stage === "Final" && (
                  <DialogFooter className="mt-4 border-t pt-3 sm:justify-between items-center w-full flex-row">
                    <p className="text-[11px] text-muted-foreground mr-auto flex-1">
                      Remove participants who have not checked in yet.
                    </p>
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      className="h-8 gap-1.5 shadow-sm text-xs bg-red-500 hover:bg-red-600 text-white shrink-0" 
                      onClick={(e) => {
                        e.stopPropagation();
                        const absentIds = group.members.filter((m) => {
                          const p = finalists.find((f) => f.id === m.playerId);
                          return p?.isPresent === false;
                        }).map(m => m.playerId);
                        if (absentIds.length === 0) {
                          toast.info("All participants have attended or group is empty!");
                          return;
                        }
                        const updatedMembers = group.members.filter(m => !absentIds.includes(m.playerId));
                        const newGroups = groups.map(g => 
                          g.id === group.id ? { ...g, members: updatedMembers } : g
                        );
                        onGroupsChange(newGroups);
                        setDetailDialog({ ...group, members: updatedMembers } as any);
                        toast.success(`Removed ${absentIds.length} absent participant(s).`);
                      }}>
                      <Trash2 className="h-3 w-3" /> {t("competition.cut_absent") || "Cut Absent"}
                    </Button>
                  </DialogFooter>
                )}
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
                const assignableFiltered = availableFiltered; // Option 2: Allow all assignments
                const allSelected = assignableFiltered.length > 0 && assignableFiltered.every((f) => assignSelected.includes(f.id));
                
                if (allSelected) {
                  setAssignSelected([]);
                } else {
                  setAssignSelected(assignableFiltered.map((f) => f.id));
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
                const assignableFiltered = availableFiltered; // Option 2
                const allSelected = assignableFiltered.length > 0 && assignableFiltered.every((f) => assignSelected.includes(f.id));
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
                    const showAbsent = assignDialog?.stage === "Final" && player.isPresent === false;
                    
                    return (
                      <div key={player.id} 
                        onClick={() => {
                          setAssignSelected((p) => isSel ? p.filter((x) => x !== player.id) : [...p, player.id])
                        }}
                        role="button" 
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setAssignSelected((p) => isSel ? p.filter((x) => x !== player.id) : [...p, player.id]);
                          }
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left text-sm transition-colors ${isSel ? "bg-primary/10 border border-primary/30 cursor-pointer" : "hover:bg-muted/50 cursor-pointer"}`}>
                        <input type="checkbox" checked={isSel} readOnly className="h-4 w-4 accent-primary" />
                        <Avatar className="h-7 w-7"><AvatarFallback className="text-[10px]">{player.name.substring(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                        <div className="flex-1 flex flex-col min-w-0 pr-2">
                          <span className="font-medium text-sm truncate flex items-center gap-1" title={player.name}>
                            {player.name}
                            {showAbsent && <Badge variant="destructive" className="text-[8px] h-4 px-1 py-0 ml-1">Absent</Badge>}
                          </span>
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

      {/* Manage Rounds Dialog */}
      <Dialog open={!!roundsDialog} onOpenChange={(open) => { if (!open) setRoundsDialog(null); }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 max-w-full overflow-hidden">
              <BookOpen className="h-5 w-5 shrink-0" />
              <span className="truncate">{t("competition.assign_quiz") || "Assign Quiz & Game"} — {roundsDialog?.group.name}</span>
            </DialogTitle>
            <p className="text-sm text-muted-foreground">{t("competition.configure_rounds_desc") || "Configure quizzes and games for each round"}</p>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1 mt-2" onWheelCapture={(e) => e.stopPropagation()} onTouchMoveCapture={(e) => e.stopPropagation()}>
            {roundsDialog?.rounds.map((round, idx) => (
              <div key={idx} className="flex flex-col gap-3 p-4 border rounded-lg bg-card/50 relative">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-muted-foreground">{t("competition.round") || "Round"} {idx + 1}</span>
                  {roundsDialog.rounds.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive hover:bg-destructive/10"
                      title={t("competition.remove_round") || "Remove round"}
                      onClick={() => {
                        const newRounds = [...roundsDialog.rounds];
                        newRounds.splice(idx, 1);
                        setRoundsDialog({ ...roundsDialog, rounds: newRounds });
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 min-w-0 flex flex-col">
                    <label className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
                      <BookOpen className="h-3.5 w-3.5" /> {t("competition.select_quiz") || "Select Quiz"}
                    </label>
                    <Combobox
                      tabs={[
                        { id: "public", label: "Public Quiz", icon: <BookOpen className="h-3 w-3" /> },
                        { id: "my", label: "My Quiz", icon: <Edit className="h-3 w-3" /> },
                      ]}
                      options={[{ value: "none", label: "None" }, ...quizzes
                        .filter(q => q.isPublic || q.creatorId === currentUserId)
                        .map(q => ({
                          value: q.id, 
                          label: q.title,
                          group: q.creatorId === currentUserId ? "my" : "public",
                        }))
                      ]}
                      value={round.quizId || "none"}
                      onValueChange={(val) => {
                        const newRounds = [...roundsDialog.rounds];
                        newRounds[idx].quizId = val === "none" ? "" : val;
                        setRoundsDialog({ ...roundsDialog, rounds: newRounds });
                      }}
                      placeholder="Select quiz..."
                      searchPlaceholder="Search quiz..."
                      emptyText={t("competition.no_quizzes_found") || "No quizzes found."}
                      className="w-full h-10 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5 min-w-0 flex flex-col">
                    <label className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
                      <Gamepad2 className="h-3.5 w-3.5" /> {t("competition.select_game") || "Select Game"}
                    </label>
                    <Combobox
                      options={[{ value: "none", label: "None" }, ...games.map(g => ({ value: g.name, label: g.name }))]}
                      value={round.gameId || "none"}
                      onValueChange={(val) => {
                        const newRounds = [...roundsDialog.rounds];
                        newRounds[idx].gameId = val === "none" ? "" : val;
                        setRoundsDialog({ ...roundsDialog, rounds: newRounds });
                      }}
                      placeholder="Select game..."
                      searchPlaceholder="Search game..."
                      emptyText={t("competition.no_games_found") || "No games found."}
                      className="w-full h-10 text-sm capitalize"
                    />
                  </div>
                </div>
              </div>
            ))}
            
            <Button
              variant="outline"
              size="sm"
              className="w-full border-dashed gap-2"
              onClick={() => {
                setRoundsDialog({
                  ...roundsDialog!,
                  rounds: [...roundsDialog!.rounds, { quizId: "", gameId: "" }]
                });
              }}
            >
              <Plus className="h-4 w-4" /> {t("competition.add_round") || "Add Round"} ({roundsDialog?.rounds.length! + 1})
            </Button>
          </div>
          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setRoundsDialog(null)}>{t("action.cancel") || "Cancel"}</Button>
            <Button onClick={handleSaveRounds} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
              <Save className="h-4 w-4" /> {t("action.save") || "Save"}
            </Button>
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

      {/* Remove Confirmation Dialog */}
      <AlertDialog
        open={!!removeConfirm}
        onOpenChange={(open) => {
          if (!open) setRemoveConfirm(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will remove <span className="font-semibold text-foreground">{removeConfirm?.label}</span> from this group.
              {removeConfirm?.type === "member" && " You can assign them again later if needed."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!removeConfirm) return;
                const groupId = removeConfirm.groupId;
                const group = groups.find((g) => g.id === groupId);
                if (!group) return;

                let newGroups = [...groups];
                
                if (removeConfirm.type === "member") {
                  const updatedMembers = group.members.filter((m) => m.playerId !== removeConfirm.itemId);
                  newGroups = groups.map((g) =>
                    g.id === groupId ? { ...g, members: updatedMembers } : g
                  );
                  if (detailDialog?.id === groupId) {
                    setDetailDialog({ ...group, members: updatedMembers } as any);
                  }
                  toast.success(`${removeConfirm.label} removed from group.`);
                } else if (removeConfirm.type === "quiz") {
                  const newRounds = group.rounds.map(r =>
                    r.quiz_id === removeConfirm.itemId ? { ...r, quiz_id: "" } : r
                  ).filter(r => r.quiz_id !== "" || r.game_id !== "").map((r, i) => ({ ...r, round: i + 1 }));
                  newGroups = groups.map((g) =>
                    g.id === groupId ? { ...g, rounds: newRounds } : g
                  );
                  if (detailDialog?.id === groupId) {
                    setDetailDialog({ ...group, rounds: newRounds } as any);
                  }
                  toast.success(`Quiz removed from group.`);
                } else if (removeConfirm.type === "game") {
                  const newRounds = group.rounds.map(r =>
                    r.game_id === removeConfirm.itemId ? { ...r, game_id: "" } : r
                  ).filter(r => r.quiz_id !== "" || r.game_id !== "").map((r, i) => ({ ...r, round: i + 1 }));
                  newGroups = groups.map((g) =>
                    g.id === groupId ? { ...g, rounds: newRounds } : g
                  );
                  if (detailDialog?.id === groupId) {
                    setDetailDialog({ ...group, rounds: newRounds } as any);
                  }
                  toast.success(`Game removed from group.`);
                }

                onGroupsChange(newGroups);
                setRemoveConfirm(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
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
          <LocalBracketView 
            groups={groups} 
            quizzes={quizzes} 
            games={games} 
            competitionId={competitionId}
            currentUserId={currentUserId}
            onManageRounds={(g) => { setDetailDialog(null); setTimeout(() => openRoundsDialog(g), 150); }} 
          />
        </>
      )}
    </div>
  );
}
