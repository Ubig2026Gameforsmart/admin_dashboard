"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n";
import { toast } from "sonner";
import { generateXID } from "@/lib/id-generator";
import { roundService } from "@/lib/services/competition-service";
import { CompetitionRound, RoundStatus, DummyPlayer } from "@/types/competition";
import {
  Plus,
  Trash2,
  Play,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { GroupCard } from "./group-card";

interface RoundManagerProps {
  competitionId: string;
  rounds: CompetitionRound[];
  onRoundsChange: () => void;
  dummyPlayers: DummyPlayer[];
  allAssignedPlayerIds: string[];
  onLocalAssign: (groupId: string, playerIds: string[]) => void;
  onLocalAdvance: (memberIds: string[], fromGroupId: string) => void;
}

export function RoundManager({
  competitionId,
  rounds,
  onRoundsChange,
  dummyPlayers,
  allAssignedPlayerIds,
  onLocalAssign,
  onLocalAdvance,
}: RoundManagerProps) {
  const { t } = useTranslation();
  const [newRoundName, setNewRoundName] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [expandedRound, setExpandedRound] = useState<string | null>(
    rounds.length > 0 ? rounds[0].id : null
  );
  const [deleteTarget, setDeleteTarget] = useState<CompetitionRound | null>(null);

  const statusConfig: Record<RoundStatus, { label: string; icon: React.ReactNode; className: string }> = {
    pending: {
      label: "Pending",
      icon: <Clock className="h-3.5 w-3.5" />,
      className: "bg-gray-500/15 text-gray-500 border-gray-300",
    },
    active: {
      label: "Active",
      icon: <Play className="h-3.5 w-3.5" />,
      className: "bg-amber-500/15 text-amber-600 border-amber-300",
    },
    completed: {
      label: "Completed",
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
      className: "bg-emerald-500/15 text-emerald-600 border-emerald-300",
    },
  };

  const handleAddRound = async () => {
    if (!newRoundName.trim()) {
      toast.error(t("competition.round_name_required"));
      return;
    }

    setIsAdding(true);
    try {
      const newRound = await roundService.createRound(
        generateXID(),
        competitionId,
        newRoundName.trim(),
        rounds.length + 1
      );
      toast.success(`${t("competition.round_created")}: ${newRound.name}`);
      setNewRoundName("");
      onRoundsChange();
    } catch (error: any) {
      toast.error(error.message || "Failed to create round");
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteRound = async () => {
    if (!deleteTarget) return;
    try {
      await roundService.deleteRound(deleteTarget.id);
      toast.success(`${t("competition.round_deleted")}: ${deleteTarget.name}`);
      setDeleteTarget(null);
      onRoundsChange();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete round");
    }
  };

  const handleStatusChange = async (round: CompetitionRound, newStatus: RoundStatus) => {
    try {
      await roundService.updateRoundStatus(round.id, newStatus);
      toast.success(`${round.name} → ${statusConfig[newStatus].label}`);
      onRoundsChange();
    } catch (error: any) {
      toast.error(error.message || "Failed to update status");
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {t("competition.rounds_title")}
        </h2>
      </div>

      {/* Add Round Input */}
      <div className="flex gap-2">
        <Input
          placeholder={t("competition.round_name_placeholder")}
          value={newRoundName}
          onChange={(e) => setNewRoundName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddRound()}
          className="max-w-sm"
        />
        <Button onClick={handleAddRound} disabled={isAdding} className="gap-1.5 shrink-0">
          <Plus className="h-4 w-4" />
          {t("competition.add_round")}
        </Button>
      </div>

      {/* Round List */}
      {rounds.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center">
          <p className="text-muted-foreground text-sm">
            {t("competition.no_rounds")}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rounds.map((round) => {
            const cfg = statusConfig[round.status as RoundStatus] || statusConfig.pending;
            const isExpanded = expandedRound === round.id;
            const memberCount = (round.groups || []).reduce((sum, g) => sum + (g.members?.length || 0), 0);

            return (
              <div
                key={round.id}
                className="rounded-lg border bg-card overflow-hidden transition-shadow hover:shadow-sm"
              >
                {/* Round Header */}
                <div
                  className="flex items-center justify-between p-4 cursor-pointer select-none"
                  onClick={() => setExpandedRound(isExpanded ? null : round.id)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-muted-foreground bg-muted rounded-full h-6 w-6 flex items-center justify-center">
                      {round.round_order}
                    </span>
                    <h3 className="font-semibold text-sm">{round.name}</h3>
                    <Badge variant="outline" className={`gap-1 text-[11px] ${cfg.className}`}>
                      {cfg.icon}
                      {cfg.label}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {(round.groups || []).length} {t("competition.groups")} · {memberCount} {t("competition.members")}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Status toggles */}
                    {round.status === "pending" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1"
                        onClick={(e) => { e.stopPropagation(); handleStatusChange(round, "active"); }}
                      >
                        <Play className="h-3 w-3" />
                        {t("competition.start")}
                      </Button>
                    )}
                    {round.status === "active" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1"
                        onClick={(e) => { e.stopPropagation(); handleStatusChange(round, "completed"); }}
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        {t("competition.complete")}
                      </Button>
                    )}

                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive hover:bg-destructive/10"
                      onClick={(e) => { e.stopPropagation(); setDeleteTarget(round); }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>

                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {/* Expanded Content: Groups */}
                {isExpanded && (
                  <div className="border-t px-4 py-4 bg-muted/5">
                    <GroupCard
                      roundId={round.id}
                      groups={round.groups || []}
                      onGroupsChange={onRoundsChange}
                      dummyPlayers={dummyPlayers}
                      allAssignedPlayerIds={allAssignedPlayerIds}
                      onLocalAssign={onLocalAssign}
                      onLocalAdvance={onLocalAdvance}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("competition.delete_round_title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("competition.delete_round_desc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("action.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRound} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t("action.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
