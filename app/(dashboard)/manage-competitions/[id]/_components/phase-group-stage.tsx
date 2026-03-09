"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n";
import { toast } from "sonner";
import { DummyPlayer, MockQuiz } from "@/types/competition";
import {
  Plus, Trash2, Users, UserPlus, BookOpen, Trophy, Clock,
  ArrowUpRight, ChevronDown as ChevronDownIcon, ChevronUp,
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
import { Search, ChevronDown } from "lucide-react";
import { LocalBracketView } from "./local-bracket-view";

interface PhaseGroupStageProps {
  finalists: DummyPlayer[];
  groups: LocalGroup[];
  quizzes: MockQuiz[];
  onGroupsChange: (groups: LocalGroup[]) => void;
}

export interface LocalGroup {
  id: string;
  name: string;
  quizIds: string[];
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
  onGroupsChange,
}: PhaseGroupStageProps) {
  const { t } = useTranslation();
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupStage, setNewGroupStage] = useState("Semifinal");
  const [newGroupSources, setNewGroupSources] = useState<string[]>([]);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(
    groups.length > 0 ? groups[0].id : null
  );
  const [assignDialog, setAssignDialog] = useState<LocalGroup | null>(null);
  const [quizDialog, setQuizDialog] = useState<LocalGroup | null>(null);
  const [assignSearch, setAssignSearch] = useState("");
  const [assignSelected, setAssignSelected] = useState<string[]>([]);
  const [advanceSelected, setAdvanceSelected] = useState<Record<string, string[]>>({});

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
      members: initialMembers,
      stage: newGroupStage,
      sources: newGroupSources,
    };
    onGroupsChange([...groups, newGroup]);
    toast.success(`${t("competition.group_created") || "Group created"}: ${newGroupName}`);
    setNewGroupName("");
  };

  const handleDeleteGroup = (groupId: string) => {
    onGroupsChange(groups.filter((g) => g.id !== groupId));
    toast.success(t("competition.group_deleted"));
  };

  const handleAssignPlayers = () => {
    if (!assignDialog || assignSelected.length === 0) return;
    const newMembers: LocalGroupMember[] = assignSelected.map((pId) => {
      const player = finalists.find((f) => f.id === pId);
      return {
        playerId: pId,
        playerName: player?.name || pId,
        score: Math.round((player?.avgScore || 50) + (Math.random() * 20 - 10)),
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
        return {
          ...g,
          quizIds: has
            ? g.quizIds.filter((q) => q !== quizId)
            : [...g.quizIds, quizId],
        };
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
    onGroupsChange(
      groups.map((g) =>
        g.id === groupId
          ? {
              ...g,
              members: g.members.map((m) =>
                ids.includes(m.playerId) ? { ...m, isAdvanced: true } : m
              ),
            }
          : g
      )
    );
    setAdvanceSelected((prev) => ({ ...prev, [groupId]: [] }));
    toast.success(`${ids.length} ${t("competition.advancing")}`);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Users className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">{t("competition.phase_group_stage")}</h2>
        <Badge variant="secondary" className="text-xs">
          {finalists.length} {t("competition.finalist")}
        </Badge>
        <Badge variant="outline" className="text-xs">
          {allAssignedIds.length} {t("competition.assigned")}
        </Badge>
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
        
        <Select value={newGroupStage} onValueChange={setNewGroupStage}>
          <SelectTrigger className="w-[150px] h-9">
            <SelectValue placeholder="Stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Semifinal">Semifinal</SelectItem>
            <SelectItem value="Final">Final</SelectItem>
            <SelectItem value="Champion">Champion</SelectItem>
          </SelectContent>
        </Select>

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
                  {g.name}
                </DropdownMenuCheckboxItem>
              ))}
              {groups.length === 0 && (
                <div className="text-xs text-muted-foreground p-2 text-center">No groups available</div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

        <Button onClick={handleAddGroup} className="gap-1.5 h-9 shrink-0 md:ml-auto">
          <Plus className="h-4 w-4" />
          {t("competition.add_group")}
        </Button>
      </div>

      {/* Groups */}
      {groups.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center">
          <p className="text-muted-foreground text-sm">{t("competition.no_groups")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => {
            const isExpanded = expandedGroup === group.id;
            const groupAdvance = advanceSelected[group.id] || [];
            const advancedCount = group.members.filter((m) => m.isAdvanced).length;

            return (
              <div key={group.id} className="rounded-lg border bg-card overflow-hidden">
                {/* Group Header */}
                <div
                  className="flex items-center justify-between p-4 cursor-pointer select-none"
                  onClick={() => setExpandedGroup(isExpanded ? null : group.id)}
                >
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-sm">{group.name}</h3>
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
                    {advancedCount > 0 && (
                      <Badge variant="outline" className="text-[10px] h-5 gap-0.5 text-emerald-600 border-emerald-300 bg-emerald-500/10">
                        <ArrowUpRight className="h-3 w-3" /> {advancedCount}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
                      onClick={(e) => { e.stopPropagation(); setQuizDialog(group); }}>
                      <BookOpen className="h-3 w-3" /> {t("competition.assign_quiz")}
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
                      onClick={(e) => { e.stopPropagation(); setAssignDialog(group); }}>
                      <UserPlus className="h-3 w-3" /> {t("competition.assign_participants")}
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive"
                      onClick={(e) => { e.stopPropagation(); handleDeleteGroup(group.id); }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDownIcon className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </div>

                {/* Expanded Members */}
                {isExpanded && (
                  <div className="border-t">
                    {group.members.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-6">{t("competition.no_members")}</p>
                    ) : (
                      <>
                        <div className="grid grid-cols-[28px_1fr_70px_70px_28px] gap-2 px-4 py-2 text-[11px] font-medium text-muted-foreground border-b bg-muted/30">
                          <span />
                          <span>{t("comp_detail.table_player")}</span>
                          <span className="text-center">{t("comp_detail.table_avg")}</span>
                          <span className="text-center">{t("competition.time")}</span>
                          <span />
                        </div>
                        <div className="max-h-52 overflow-y-auto">
                          {[...group.members]
                            .sort((a, b) => b.score - a.score)
                            .map((member, idx) => (
                              <div key={member.playerId}
                                className={`grid grid-cols-[28px_1fr_70px_70px_28px] gap-2 items-center px-4 py-1.5 text-xs border-b last:border-b-0 ${
                                  member.isAdvanced ? "bg-emerald-500/5" : groupAdvance.includes(member.playerId) ? "bg-primary/5" : ""
                                }`}>
                                <Checkbox
                                  checked={groupAdvance.includes(member.playerId) || member.isAdvanced}
                                  disabled={member.isAdvanced}
                                  onCheckedChange={() => toggleAdvance(group.id, member.playerId)}
                                  className="h-4 w-4"
                                />
                                <div className="flex items-center gap-2 min-w-0">
                                  <Avatar className="h-6 w-6">
                                    <AvatarFallback className="text-[9px]">{member.playerName.substring(0, 2).toUpperCase()}</AvatarFallback>
                                  </Avatar>
                                  <span className={`font-medium truncate ${member.isAdvanced ? "text-emerald-600" : ""}`}>
                                    {member.playerName}
                                  </span>
                                  {idx < 3 && (
                                    <span className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold shrink-0 ${
                                      idx === 0 ? "bg-yellow-500/20 text-yellow-600" :
                                      idx === 1 ? "bg-gray-300/20 text-gray-500" :
                                      "bg-orange-500/20 text-orange-600"
                                    }`}>{idx + 1}</span>
                                  )}
                                </div>
                                <div className="flex items-center justify-center gap-1">
                                  <Trophy className="h-3 w-3 text-yellow-500" />
                                  <span className="font-mono font-medium">{member.score}</span>
                                </div>
                                <div className="flex items-center justify-center gap-1 text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  <span className="font-mono">{formatTime(member.timeSeconds)}</span>
                                </div>
                                <div className="flex justify-center">
                                  {member.isAdvanced && <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />}
                                </div>
                              </div>
                            ))}
                        </div>
                        {groupAdvance.length > 0 && (
                          <div className="px-4 py-2 border-t bg-muted/20">
                            <Button size="sm" className="gap-1.5 h-7 text-xs w-full" onClick={() => handleAdvance(group.id)}>
                              <ArrowUpRight className="h-3.5 w-3.5" />
                              {t("competition.advance_selected")} ({groupAdvance.length})
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Assign Players Dialog */}
      <Dialog open={!!assignDialog} onOpenChange={(open) => { if (!open) { setAssignDialog(null); setAssignSelected([]); setAssignSearch(""); } }}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              {t("competition.assign_participants")} — {assignDialog?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="relative">
            <SearchInput
              placeholder={t("comp_detail.search_player")}
              value={assignSearch}
              onSearch={(val) => setAssignSearch(val)}
            />
          </div>
          <div className="max-h-64 overflow-y-auto space-y-1 border rounded-md p-2">
            {finalists
              .filter((f) => !allAssignedIds.includes(f.id) && f.name.toLowerCase().includes(assignSearch.toLowerCase()))
              .map((player) => {
                const isSel = assignSelected.includes(player.id);
                return (
                  <button key={player.id} onClick={() => setAssignSelected((p) => isSel ? p.filter((x) => x !== player.id) : [...p, player.id])}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left text-sm transition-colors cursor-pointer ${isSel ? "bg-primary/10 border border-primary/30" : "hover:bg-muted/50"}`}>
                    <input type="checkbox" checked={isSel} readOnly className="h-4 w-4 accent-primary" />
                    <Avatar className="h-7 w-7"><AvatarFallback className="text-[10px]">{player.name.substring(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                    <span className="flex-1 truncate font-medium">{player.name}</span>
                    <span className="text-xs text-muted-foreground">{player.avgScore.toFixed(1)} pts</span>
                  </button>
                );
              })}
            {finalists.filter((f) => !allAssignedIds.includes(f.id)).length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">{t("comp_detail.no_players")}</p>
            )}
          </div>
          <DialogFooter>
            <span className="text-xs text-muted-foreground mr-auto">{assignSelected.length} {t("competition.selected")}</span>
            <Button variant="outline" onClick={() => { setAssignDialog(null); setAssignSelected([]); }}>{t("action.cancel")}</Button>
            <Button onClick={handleAssignPlayers} disabled={assignSelected.length === 0} className="gap-1.5">
              <UserPlus className="h-4 w-4" /> {t("competition.assign_participants")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Quiz Dialog */}
      <Dialog open={!!quizDialog} onOpenChange={(open) => { if (!open) setQuizDialog(null); }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              {t("competition.assign_quiz")} — {quizDialog?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {quizzes.map((quiz) => {
              const isAssigned = quizDialog?.quizIds.includes(quiz.id);
              return (
                <button key={quiz.id}
                  onClick={() => quizDialog && handleAssignQuiz(quizDialog.id, quiz.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border text-sm transition-colors cursor-pointer ${
                    isAssigned ? "bg-primary/10 border-primary/30" : "hover:bg-muted/50"
                  }`}>
                  <div className="flex items-center gap-3">
                    <Checkbox checked={!!isAssigned} disabled className="h-4 w-4" />
                    <div className="text-left">
                      <p className="font-medium">{quiz.title}</p>
                      <p className="text-xs text-muted-foreground">{quiz.questionCount} {t("competition.questions")} · {quiz.duration} {t("competition.minutes")}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuizDialog(null)}>{t("action.close")}</Button>
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
