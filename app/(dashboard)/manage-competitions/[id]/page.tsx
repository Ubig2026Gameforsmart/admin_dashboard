"use client";

import { useState } from "react";
import { format } from "date-fns";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n";
import {
  CalendarDays,
  Users,
  CreditCard,
  Trophy,
  Gamepad2,
  Search,
  ChevronRight,
  Edit,
  ExternalLink,
  Banknote,
  Gift,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

// --- DUMMY DATA ---
interface Player {
  id: string;
  name: string;
  avatar: string | null;
  gamesPlayed: number;
  avgScore: number;
  paid: boolean;
  registeredAt: string;
}

const DUMMY_DETAIL = {
  title: "Cerdas Cermat Online - Sains",
  description: "Kompetisi cerdas cermat online bidang sains untuk siswa SD se-Indonesia. Kompetisi ini bertujuan untuk meningkatkan minat belajar sains dan mengasah kemampuan berpikir kritis para peserta melalui pertanyaan-pertanyaan yang menantang dan edukatif.",
  rules: [
    "Setiap peserta hanya boleh mendaftar satu kali",
    "Peserta wajib membayar biaya pendaftaran sebelum kompetisi dimulai",
    "Kompetisi terdiri dari 3 babak: Penyisihan, Semifinal, dan Final",
    "Setiap babak memiliki batas waktu 30 menit",
    "Peserta yang ketahuan menggunakan alat bantu akan didiskualifikasi",
    "Keputusan juri bersifat final dan tidak dapat diganggu gugat",
  ],
  status: "published" as const,
  startDate: "2026-03-10T08:00:00Z",
  endDate: "2026-03-12T17:00:00Z",
  posterUrl: "/images/poster1.jpg",
  registrationFee: 50000,
  prizePool: 5000000,
  registrationLink: "https://forms.google.com/example-registration",
};

const DUMMY_PLAYERS: Player[] = [
  { id: "p1", name: "Muhammad Khoirul H.", avatar: null, gamesPlayed: 12, avgScore: 85.3, paid: true, registeredAt: "2026-01-15T10:30:00Z" },
  { id: "p2", name: "Aluna Kynan", avatar: null, gamesPlayed: 8, avgScore: 92.1, paid: true, registeredAt: "2026-01-16T08:15:00Z" },
  { id: "p3", name: "Apin Ridwan", avatar: null, gamesPlayed: 15, avgScore: 78.6, paid: false, registeredAt: "2026-01-18T14:00:00Z" },
  { id: "p4", name: "Kizuko Mellbringer", avatar: null, gamesPlayed: 5, avgScore: 91.0, paid: true, registeredAt: "2026-01-20T09:45:00Z" },
  { id: "p5", name: "Zubaidillah", avatar: null, gamesPlayed: 20, avgScore: 67.4, paid: true, registeredAt: "2026-01-22T11:20:00Z" },
  { id: "p6", name: "Lint More", avatar: null, gamesPlayed: 3, avgScore: 55.2, paid: false, registeredAt: "2026-01-25T16:30:00Z" },
  { id: "p7", name: "Siti Nurhaliza", avatar: null, gamesPlayed: 10, avgScore: 88.9, paid: true, registeredAt: "2026-02-01T07:50:00Z" },
  { id: "p8", name: "Budi Santoso", avatar: null, gamesPlayed: 7, avgScore: 73.5, paid: false, registeredAt: "2026-02-03T13:10:00Z" },
];

export default function CompetitionDetailPage() {
  const { t } = useTranslation();
  
  const statusConfig = {
    published: { label: t("comp_detail.status_published") || "Published", className: "bg-emerald-500/15 text-emerald-600 border-emerald-200 dark:text-emerald-400 dark:border-emerald-800" },
    draft: { label: t("comp_detail.status_draft") || "Draft", className: "bg-gray-500/15 text-gray-500 border-gray-200 dark:text-gray-400 dark:border-gray-700" },
    completed: { label: t("comp_detail.status_completed") || "Completed", className: "bg-blue-500/15 text-blue-600 border-blue-200 dark:text-blue-400 dark:border-blue-800" },
  };

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);
  }

  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"registered" | "paid">("registered");

  const handleSearch = () => setSearchQuery(searchInput);
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearch();
  };

  const detail = DUMMY_DETAIL;
  const cfg = statusConfig[detail.status];

  const totalRegistered = DUMMY_PLAYERS.length;
  const totalPaid = DUMMY_PLAYERS.filter((p) => p.paid).length;
  const paidPercentage = totalRegistered > 0 ? Math.round((totalPaid / totalRegistered) * 100) : 0;

  // Sort players by avg score descending for ranking
  const rankedPlayers = [...DUMMY_PLAYERS].sort((a, b) => b.avgScore - a.avgScore);

  // Filter players based on tab and search
  const filteredPlayers = rankedPlayers.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === "registered" || (activeTab === "paid" && p.paid);
    return matchesSearch && matchesTab;
  });

  const getRank = (playerId: string) => rankedPlayers.findIndex((p) => p.id === playerId) + 1;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/manage-competitions" className="hover:text-foreground transition-colors cursor-pointer">
          {t("manage_competitions.title") || "Manage Competitions"}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium">{t("comp_detail.breadcrumb") || "Competition Detail"}</span>
      </nav>

      {/* Title + Actions */}
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-foreground">{detail.title}</h1>
            <Badge variant="outline" className={`capitalize border ${cfg.className}`}>
              {cfg.label}
            </Badge>
          </div>

          {/* Inline Stats */}
          <div className="flex items-center gap-x-3 gap-y-2 text-sm text-muted-foreground flex-wrap">
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              <span><strong className="text-foreground">{totalRegistered.toLocaleString("id-ID")}</strong> {t("comp_detail.registered") || "Registered"}</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1.5">
              <CreditCard className="h-4 w-4 text-emerald-500" />
              <span><strong className="text-foreground">{totalPaid.toLocaleString("id-ID")}</strong> {t("comp_detail.paid") || "Paid"}</span>
              <div className="flex items-center gap-1.5 ml-1">
                <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${paidPercentage}%` }}
                  />
                </div>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">{paidPercentage}%</span>
              </div>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4 text-blue-500" />
              <span>{format(new Date(detail.startDate), "dd MMM yyyy")} — {format(new Date(detail.endDate), "dd MMM yyyy")}</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1.5">
              <Banknote className="h-4 w-4 text-yellow-500" />
              <span>{formatCurrency(detail.registrationFee)}</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1.5">
              <Gift className="h-4 w-4 text-rose-500" />
              <span>{t("comp_detail.prize_pool") || "Total Prize"}: <strong className="text-foreground">{formatCurrency(detail.prizePool)}</strong></span>
            </div>
          </div>
        </div>

        <div className="shrink-0">
          <Button size="sm" className="gap-1.5">
            <Edit className="h-4 w-4" />
            {t("comp_detail.edit") || "Edit"}
          </Button>
        </div>
      </div>

      {/* Poster + Description + Rules + Registration Link */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Poster */}
        <div className="lg:col-span-1">
          <div className="rounded-lg overflow-hidden border bg-muted">
            <img
              src={detail.posterUrl}
              alt={detail.title}
              className="w-full object-cover"
            />
          </div>
        </div>

        {/* Info */}
        <div className="lg:col-span-2 space-y-5">
          <div>
            <h3 className="text-sm font-semibold mb-1.5">{t("comp_detail.description") || "Description"}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{detail.description}</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-1.5">{t("comp_detail.rules") || "Rules"}</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              {detail.rules.map((rule, i) => (
                <li key={i}>{rule}</li>
              ))}
            </ol>
          </div>

          {detail.registrationLink && (
            <div>
              <h3 className="text-sm font-semibold mb-1.5">{t("comp_detail.reg_link") || "Registration Link"}</h3>
              <a
                href={detail.registrationLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline cursor-pointer"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                {detail.registrationLink}
              </a>
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* Players Section */}
      <div className="space-y-4">
        {/* Tabs + Search */}
        <div className="flex items-center justify-between">
          <div className="flex items-center border rounded-lg overflow-hidden">
            <button
              onClick={() => setActiveTab("registered")}
              className={`px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${
                activeTab === "registered"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              {t("comp_detail.tab_daftar") || "Registered"} ({totalRegistered})
            </button>
            <button
              onClick={() => setActiveTab("paid")}
              className={`px-4 py-2 text-sm font-medium transition-colors border-l cursor-pointer ${
                activeTab === "paid"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              {t("comp_detail.tab_paid") || "Paid"} ({totalPaid})
            </button>
          </div>

          <div className="relative">
            <Input
              placeholder={t("comp_detail.search_player") || "Search player..."}
              className="pr-10 w-64 h-9 bg-background border-border"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              onClick={handleSearch}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
            >
              <Search className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Players Table */}
        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px] text-center">#</TableHead>
                <TableHead>{t("comp_detail.table_player") || "Player"}</TableHead>
                <TableHead className="text-center">{t("comp_detail.table_games") || "Games Played"}</TableHead>
                <TableHead className="text-center">{t("comp_detail.table_avg") || "Avg Score"}</TableHead>
                <TableHead className="text-right">{t("comp_detail.table_registered") || "Registered"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPlayers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-20 text-center text-muted-foreground">
                    {t("comp_detail.no_players") || "No players found."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredPlayers.map((player) => {
                  const rank = getRank(player.id);
                  return (
                    <TableRow key={player.id}>
                      {/* Rank */}
                      <TableCell className="text-center">
                        {rank <= 3 ? (
                          <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold ${
                            rank === 1 ? "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400" :
                            rank === 2 ? "bg-gray-300/20 text-gray-500" :
                            "bg-orange-500/20 text-orange-600 dark:text-orange-400"
                          }`}>
                            {rank}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">{rank}</span>
                        )}
                      </TableCell>

                      {/* Player */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarImage src={player.avatar || undefined} />
                            <AvatarFallback className="text-[10px]">
                              {player.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-sm">{player.name}</span>
                        </div>
                      </TableCell>

                      {/* Games Played */}
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1 text-muted-foreground">
                          <Gamepad2 className="h-3.5 w-3.5" />
                          <span>{player.gamesPlayed}</span>
                        </div>
                      </TableCell>

                      {/* Avg Score */}
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Trophy className="h-3.5 w-3.5 text-yellow-500" />
                          <span className="font-medium">{player.avgScore.toFixed(1)}</span>
                        </div>
                      </TableCell>

                      {/* Registration Date */}
                      <TableCell className="text-right text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(player.registeredAt), "dd MMM yyyy")}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
