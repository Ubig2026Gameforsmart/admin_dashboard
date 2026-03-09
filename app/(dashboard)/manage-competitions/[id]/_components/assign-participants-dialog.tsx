"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n";
import { DummyPlayer } from "@/types/competition";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, UserPlus } from "lucide-react";

interface AssignParticipantsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  players: DummyPlayer[];
  alreadyAssigned: string[];
  onAssign: (playerIds: string[]) => void;
  groupName: string;
}

export function AssignParticipantsDialog({
  isOpen,
  onClose,
  players,
  alreadyAssigned,
  onAssign,
  groupName,
}: AssignParticipantsDialogProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  const available = players.filter(
    (p) => !alreadyAssigned.includes(p.id) && p.name.toLowerCase().includes(search.toLowerCase())
  );

  const togglePlayer = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleAssign = () => {
    onAssign(selected);
    setSelected([]);
    setSearch("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { onClose(); setSelected([]); setSearch(""); } }}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            {t("competition.assign_participants")} — {groupName}
          </DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("comp_detail.search_player")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Player List */}
        <div className="max-h-64 overflow-y-auto space-y-1 border rounded-md p-2">
          {available.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {t("comp_detail.no_players")}
            </p>
          ) : (
            available.map((player) => {
              const isSelected = selected.includes(player.id);
              return (
                <button
                  key={player.id}
                  onClick={() => togglePlayer(player.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left text-sm transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-primary/10 border border-primary/30"
                      : "hover:bg-muted/50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    readOnly
                    className="h-4 w-4 rounded border-border accent-primary"
                  />
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="text-[10px]">
                      {player.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{player.name}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {player.avgScore.toFixed(1)} pts
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <DialogFooter>
          <p className="text-xs text-muted-foreground mr-auto">
            {selected.length} {t("competition.selected") || "selected"}
          </p>
          <Button variant="outline" onClick={onClose}>
            {t("action.cancel")}
          </Button>
          <Button onClick={handleAssign} disabled={selected.length === 0} className="gap-1.5">
            <UserPlus className="h-4 w-4" />
            {t("competition.assign_participants")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
