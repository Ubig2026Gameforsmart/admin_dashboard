"use client";

import { useTranslation } from "@/lib/i18n";
import { DummyPlayer } from "@/types/competition";
import { Users, Gamepad2, Trophy, Search } from "lucide-react";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { id as idLocale, enUS } from "date-fns/locale";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SearchInput } from "@/components/shared/search-input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

interface PhaseRegistrationProps {
  players: DummyPlayer[];
}

export function PhaseRegistration({ players }: PhaseRegistrationProps) {
  const { t, locale } = useTranslation();
  const [search, setSearch] = useState("");

  const filtered = players.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => b.avgScore - a.avgScore);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">{t("competition.phase_registration")}</h2>
          <span className="text-sm text-muted-foreground">({players.length})</span>
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
              <TableHead className="text-right">{t("comp_detail.table_registered")}</TableHead>
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
              sorted.map((player, idx) => {
                const registeredDate = new Date(player.registeredAt);
                const dateLocale = locale === "id" ? idLocale : enUS;

                const timeAgo = formatDistanceToNow(registeredDate, {
                  addSuffix: true,
                  locale: dateLocale,
                })
                  .replace(/^about /i, "")
                  .replace(/^sekitar /i, "");

                const fullDate = registeredDate.toLocaleString(
                  locale === "id" ? "id-ID" : "en-US",
                  { dateStyle: "full", timeStyle: "short" }
                );

                return (
                  <TableRow key={player.id}>
                    <TableCell className="text-center">
                      {idx < 3 ? (
                        <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold ${
                          idx === 0 ? "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400" :
                          idx === 1 ? "bg-gray-300/20 text-gray-500" :
                          "bg-orange-500/20 text-orange-600 dark:text-orange-400"
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
                    <TableCell className="text-right">
                      <span
                        title={fullDate}
                        className="text-xs text-muted-foreground cursor-help decoration-dashed decoration-muted-foreground/50 underline-offset-4 hover:underline"
                      >
                        {timeAgo}
                      </span>
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
