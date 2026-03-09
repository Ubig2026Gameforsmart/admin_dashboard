"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n";
import { DummyPlayer } from "@/types/competition";
import { toast } from "sonner";
import {
  Search, Gamepad2, Trophy, ArrowUpRight, CheckCircle2, Users, Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { SearchInput } from "@/components/shared/search-input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

interface PhaseQualificationProps {
  players: DummyPlayer[];
  onToggleFinalist: (playerId: string) => void;
  onBatchFinalist: (playerIds: string[]) => void;
}

export function PhaseQualification({
  players,
  onToggleFinalist,
  onBatchFinalist,
}: PhaseQualificationProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [subTab, setSubTab] = useState<"paid" | "finalist">("paid");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const paidPlayers = players.filter((p) => p.paid);
  const finalistPlayers = players.filter((p) => p.isFinalist);

  const currentList = subTab === "paid" ? paidPlayers : finalistPlayers;

  const filtered = currentList.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => b.avgScore - a.avgScore);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleBatchMove = () => {
    if (selectedIds.length === 0) return;
    onBatchFinalist(selectedIds);
    setSelectedIds([]);
    toast.success(`${selectedIds.length} ${t("competition.moved_to_finalist")}`);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Trophy className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">{t("competition.phase_qualification")}</h2>
          <Badge variant="secondary" className="gap-1 text-xs">
            <ArrowUpRight className="h-3 w-3 text-emerald-500" />
            {finalistPlayers.length} {t("competition.finalist")}
          </Badge>
        </div>
          <SearchInput
            placeholder={t("comp_detail.search_player")}
            value={search}
            onSearch={(val) => setSearch(val)}
            className="w-56 h-9"
          />
      </div>

      {/* Sub-Tabs: Paid | Finalist */}
      <div className="flex items-center gap-0 border rounded-lg overflow-hidden w-fit">
        <button
          onClick={() => { setSubTab("paid"); setSelectedIds([]); }}
          className={`px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${
            subTab === "paid"
              ? "bg-primary text-primary-foreground"
              : "bg-muted/50 text-muted-foreground hover:bg-muted"
          }`}
        >
          {t("comp_detail.paid")} ({paidPlayers.length})
        </button>
        <button
          onClick={() => { setSubTab("finalist"); setSelectedIds([]); }}
          className={`px-4 py-2 text-sm font-medium transition-colors border-l cursor-pointer ${
            subTab === "finalist"
              ? "bg-primary text-primary-foreground"
              : "bg-muted/50 text-muted-foreground hover:bg-muted"
          }`}
        >
          {t("competition.finalist")} ({finalistPlayers.length})
        </button>
      </div>

      {/* Batch Action */}
      {subTab === "paid" && selectedIds.length > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
          <span className="text-sm font-medium">
            {selectedIds.length} {t("competition.selected")}
          </span>
          <Button size="sm" className="gap-1.5 h-7 text-xs" onClick={handleBatchMove}>
            <ArrowUpRight className="h-3.5 w-3.5" />
            {t("competition.move_to_finalist")}
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              {subTab === "paid" && <TableHead className="w-[40px]" />}
              <TableHead className="w-[50px] text-center">#</TableHead>
              <TableHead>{t("comp_detail.table_player")}</TableHead>
              <TableHead className="text-center">{t("comp_detail.table_play")}</TableHead>
              <TableHead className="text-center">{t("comp_detail.table_avg")}</TableHead>
              <TableHead className="text-center">{t("competition.status_col")}</TableHead>
              <TableHead className="text-center w-[80px]">{t("action.action")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={subTab === "paid" ? 7 : 5} className="h-20 text-center text-muted-foreground">
                  {t("comp_detail.no_players")}
                </TableCell>
              </TableRow>
            ) : (
              sorted.map((player, idx) => {
                const isFinalist = player.isFinalist;
                const isSelected = selectedIds.includes(player.id);

                return (
                  <TableRow
                    key={player.id}
                    className={isFinalist && subTab === "paid" ? "bg-emerald-500/5" : ""}
                  >
                    {subTab === "paid" && (
                      <TableCell>
                        <Checkbox
                          checked={isSelected || !!isFinalist}
                          disabled={!!isFinalist}
                          onCheckedChange={() => toggleSelect(player.id)}
                          className="h-4 w-4"
                        />
                      </TableCell>
                    )}
                    <TableCell className="text-center">
                      {idx < 3 ? (
                        <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold ${
                          idx === 0 ? "bg-yellow-500/20 text-yellow-600" :
                          idx === 1 ? "bg-gray-300/20 text-gray-500" :
                          "bg-orange-500/20 text-orange-600"
                        }`}>{idx + 1}</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">{idx + 1}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="text-[10px]">
                            {player.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-sm">{player.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1 text-muted-foreground">
                        <Gamepad2 className="h-3.5 w-3.5" />
                        <span>{player.gamesPlayed}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Trophy className="h-3.5 w-3.5 text-yellow-500" />
                        <span className="font-medium">{player.avgScore.toFixed(1)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {isFinalist ? (
                        <Badge variant="outline" className="text-[11px] bg-emerald-500/10 text-emerald-600 border-emerald-300 gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          {t("competition.finalist")}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[11px] text-muted-foreground">
                          {t("comp_detail.paid")}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {subTab === "paid" && !isFinalist && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs gap-1 text-primary hover:text-primary"
                          onClick={() => {
                            onToggleFinalist(player.id);
                            toast.success(`${player.name} → ${t("competition.finalist")}`);
                          }}
                        >
                          <ArrowUpRight className="h-3 w-3" />
                          {t("competition.move_to_finalist")}
                        </Button>
                      )}
                      {subTab === "finalist" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs gap-1 text-destructive hover:text-destructive"
                          onClick={() => {
                            onToggleFinalist(player.id);
                            toast.success(`${player.name} → ${t("comp_detail.paid")}`);
                          }}
                        >
                          <Undo2 className="h-3 w-3" />
                          {t("competition.remove_from_finalist")}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
