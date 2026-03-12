"use client";

import { useTranslation } from "@/lib/i18n";
import { DummyPlayer } from "@/types/competition";
import { CreditCard, Gamepad2, Trophy, Search, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { SearchInput } from "@/components/shared/search-input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

interface PhasePaymentProps {
  players: DummyPlayer[];
}

export function PhasePayment({ players }: PhasePaymentProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");

  const paidPlayers = players.filter((p) => p.paid);
  const unpaidPlayers = players.filter((p) => !p.paid);

  const filtered = players.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    if (a.paid === b.paid) return b.avgScore - a.avgScore;
    return a.paid ? -1 : 1;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CreditCard className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">{t("competition.phase_payment")}</h2>
          <Badge variant="secondary" className="gap-1 text-xs">
            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
            {paidPlayers.length}/{players.length} {t("comp_detail.paid")}
          </Badge>
        </div>
          <SearchInput
            placeholder={t("comp_detail.search_player")}
            value={search}
            onSearch={(val) => setSearch(val)}
            className="w-56 h-9"
          />
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px] text-center">#</TableHead>
              <TableHead>{t("comp_detail.table_player")}</TableHead>
              <TableHead className="text-center">{t("comp_detail.table_play")}</TableHead>
              <TableHead className="text-center">{t("comp_detail.table_avg")}</TableHead>
              <TableHead className="text-center">{t("competition.payment_status")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-20 text-center text-muted-foreground">
                  {t("comp_detail.no_players")}
                </TableCell>
              </TableRow>
            ) : (
              sorted.map((player, idx) => (
                <TableRow key={player.id} className={!player.paid ? "opacity-60" : ""}>
                  <TableCell className="text-center text-sm text-muted-foreground">{idx + 1}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="text-[10px]">
                          {player.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col min-w-0">
                        <span className="font-medium text-sm truncate" title={player.name}>{player.name}</span>
                        <span className="text-[10px] text-muted-foreground truncate" title={`@${player.name.toLowerCase().replace(/\s+/g, '')}`}>
                          @{player.name.toLowerCase().replace(/\s+/g, '')}
                        </span>
                      </div>
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
                    {player.paid ? (
                      <Badge variant="outline" className="text-[11px] bg-emerald-500/10 text-emerald-600 border-emerald-300">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        {t("competition.paid_label")}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[11px] bg-red-500/10 text-red-500 border-red-300">
                        {t("competition.unpaid_label")}
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
