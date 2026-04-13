"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n";
import { toast } from "sonner";
import { generateXID } from "@/lib/id-generator";
import { groupService, memberService } from "@/lib/services/competition-service";
import { CompetitionGroup, GroupMember, DummyPlayer } from "@/types/competition";
import {
  Plus,
  Trash2,
  BookOpen,
  Users,
  UserPlus,
  ArrowUpRight,
  Clock,
  Trophy,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AssignParticipantsDialog } from "./assign-participants-dialog";

interface GroupCardProps {
  roundId: string;
  groups: CompetitionGroup[];
  onGroupsChange: () => void;
  dummyPlayers: DummyPlayer[];
  allAssignedPlayerIds: string[];
  onLocalAssign: (groupId: string, playerIds: string[]) => void;
  onLocalAdvance: (memberIds: string[], fromGroupId: string) => void;
}

function formatTime(seconds: number): string {
  if (seconds === 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

export function GroupCard({
  roundId,
  groups,
  onGroupsChange,
  dummyPlayers,
  allAssignedPlayerIds,
  onLocalAssign,
  onLocalAdvance,
}: GroupCardProps) {
  const { t } = useTranslation();
  const [newGroupName, setNewGroupName] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(
    groups.length > 0 ? groups[0].id : null
  );
  const [assignDialogGroup, setAssignDialogGroup] = useState<CompetitionGroup | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<Record<string, string[]>>({});

  const handleAddGroup = async () => {
    if (!newGroupName.trim()) {
      toast.error(t("competition.group_name_required"));
      return;
    }

    setIsAdding(true);
    try {
      await groupService.createGroup(generateXID(), roundId, newGroupName.trim());
      toast.success(`${t("competition.group_created")}: ${newGroupName}`);
      setNewGroupName("");
      onGroupsChange();
    } catch (error: any) {
      toast.error(error.message || "Failed to create group");
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteGroup = async (group: CompetitionGroup) => {
    try {
      await groupService.deleteGroup(group.id);
      toast.success(`${t("competition.group_deleted")}: ${group.name}`);
      onGroupsChange();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete group");
    }
  };

  const toggleMember = (groupId: string, memberId: string) => {
    setSelectedMembers((prev) => {
      const current = prev[groupId] || [];
      const updated = current.includes(memberId)
        ? current.filter((id) => id !== memberId)
        : [...current, memberId];
      return { ...prev, [groupId]: updated };
    });
  };

  const handleAdvance = (groupId: string) => {
    const ids = selectedMembers[groupId] || [];
    if (ids.length === 0) {
      toast.error("Select at least one member to advance");
      return;
    }
    onLocalAdvance(ids, groupId);
    setSelectedMembers((prev) => ({ ...prev, [groupId]: [] }));
    toast.success(`${ids.length} ${t("competition.advancing")}`);
  };

  return (
    <div className="space-y-3">
      {/* Add Group */}
      <div className="flex gap-2">
        <Input
          placeholder={t("competition.group_name_placeholder")}
          value={newGroupName}
          onChange={(e) => setNewGroupName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddGroup()}
          className="max-w-xs h-8 text-sm"
        />
        <Button
          size="sm"
          variant="outline"
          onClick={handleAddGroup}
          disabled={isAdding}
          className="gap-1 h-8 text-xs"
        >
          <Plus className="h-3 w-3" />
          {t("competition.add_group")}
        </Button>
      </div>

      {/* Group Grid */}
      {groups.length === 0 ? (
        <p className="text-xs text-muted-foreground py-2">
          {t("competition.no_groups")}
        </p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {groups.map((group) => {
            const members = group.members || [];
            const advancedCount = members.filter((m) => m.is_advanced).length;
            const isExpanded = expandedGroup === group.id;
            const groupSelected = selectedMembers[group.id] || [];

            return (
              <div
                key={group.id}
                className="rounded-lg border bg-background overflow-hidden transition-shadow hover:shadow-sm"
              >
                {/* Group Header */}
                <div className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-sm">{group.name}</h4>
                    <Badge variant="secondary" className="text-[10px] gap-1 h-5">
                      <Users className="h-3 w-3" />
                      {members.length}
                    </Badge>
                    {advancedCount > 0 && (
                      <Badge variant="outline" className="text-[10px] h-5 gap-0.5 text-emerald-600 border-emerald-300 bg-emerald-500/10">
                        <ArrowUpRight className="h-3 w-3" />
                        {advancedCount} {t("competition.advanced")}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-1"
                      onClick={() => setAssignDialogGroup(group)}
                    >
                      <UserPlus className="h-3 w-3" />
                      {t("competition.assign_participants")}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteGroup(group)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                    <button
                      onClick={() => setExpandedGroup(isExpanded ? null : group.id)}
                      className="p-1 cursor-pointer"
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </button>
                  </div>
                </div>

                {/* Members Table (Expanded) */}
                {isExpanded && (
                  <div className="border-t">
                    {members.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-6">
                        {t("competition.no_groups")}
                      </p>
                    ) : (
                      <>
                        {/* Table Header */}
                        <div className="grid grid-cols-[24px_1fr_90px_70px_70px_28px] gap-2 px-3 py-2 text-[11px] font-medium text-muted-foreground border-b bg-muted/30">
                          <span />
                          <span>{t("comp_detail.table_player")}</span>
                          <span>{t("table.category") || "Category"}</span>
                          <span className="text-center">{t("comp_detail.table_avg")}</span>
                          <span className="text-center">{t("competition.time") || "Time"}</span>
                          <span />
                        </div>

                        {/* Member Rows */}
                        <div className="max-h-52 overflow-y-auto">
                          {[...members]
                            .sort((a, b) => b.score - a.score)
                            .map((member, idx) => {
                              const categoryText = dummyPlayers.find((p) => p.id === member.participant_id)?.category;
                              
                              return (
                              <div
                                key={member.id}
                                className={`grid grid-cols-[24px_1fr_90px_70px_70px_28px] gap-2 items-center px-3 py-1.5 text-xs border-b last:border-b-0 transition-colors ${
                                  member.is_advanced
                                    ? "bg-emerald-500/5"
                                    : groupSelected.includes(member.id)
                                    ? "bg-primary/5"
                                    : "hover:bg-muted/30"
                                }`}
                              >
                                {/* Checkbox */}
                                <Checkbox
                                  checked={groupSelected.includes(member.id) || member.is_advanced}
                                  disabled={member.is_advanced}
                                  onCheckedChange={() => toggleMember(group.id, member.id)}
                                  className="h-4 w-4"
                                />

                                {/* Player Name */}
                                <div className="flex items-center gap-2 min-w-0">
                                  <Avatar className="h-6 w-6">
                                    <AvatarFallback className="text-[9px]">
                                      {(member.participant?.name || member.participant_id).substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex flex-col min-w-0">
                                    <p className={`font-medium truncate leading-tight ${member.is_advanced ? "text-emerald-700 dark:text-emerald-400" : ""}`}>
                                      {member.participant?.name || member.participant_id}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground truncate leading-tight">
                                      @{(member.participant?.name || member.participant_id).toLowerCase().replace(/\s+/g, '')}
                                    </p>
                                  </div>
                                  {idx < 3 && (
                                    <span className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold shrink-0 ${
                                      idx === 0 ? "bg-yellow-500/20 text-yellow-600" :
                                      idx === 1 ? "bg-gray-300/20 text-gray-500" :
                                      "bg-orange-500/20 text-orange-600"
                                    }`}>
                                      {idx + 1}
                                    </span>
                                  )}
                                </div>

                                {/* Category */}
                                <div className="flex items-center">
                                  {categoryText ? (
                                    <Badge variant="outline" className="text-[10px] px-2 h-5 text-muted-foreground truncate border-muted-foreground/20 font-medium bg-muted/20">
                                      {categoryText}
                                    </Badge>
                                  ) : (
                                    <span className="text-muted-foreground/50 text-xs">-</span>
                                  )}
                                </div>

                                {/* Score */}
                                <div className="flex items-center justify-center gap-1">
                                  <Trophy className="h-3 w-3 text-yellow-500" />
                                  <span className="font-mono font-medium">{member.score}</span>
                                </div>

                                {/* Time */}
                                <div className="flex items-center justify-center gap-1 text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  <span className="font-mono">{formatTime(member.time_seconds)}</span>
                                </div>

                                {/* Advanced indicator */}
                                <div className="flex justify-center">
                                  {member.is_advanced && (
                                    <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Advance Button */}
                        {groupSelected.length > 0 && (
                          <div className="px-3 py-2 border-t bg-muted/20">
                            <Button
                              size="sm"
                              className="gap-1.5 h-7 text-xs w-full"
                              onClick={() => handleAdvance(group.id)}
                            >
                              <ArrowUpRight className="h-3.5 w-3.5" />
                              {t("competition.advance_selected")} ({groupSelected.length})
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

      {/* Assign Participants Dialog */}
      {assignDialogGroup && (
        <AssignParticipantsDialog
          isOpen={!!assignDialogGroup}
          onClose={() => setAssignDialogGroup(null)}
          players={dummyPlayers}
          alreadyAssigned={allAssignedPlayerIds}
          groupName={assignDialogGroup.name}
          onAssign={(playerIds) => onLocalAssign(assignDialogGroup.id, playerIds)}
        />
      )}
    </div>
  );
}
