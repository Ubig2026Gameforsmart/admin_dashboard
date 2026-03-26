"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n";
import { toast } from "sonner";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import {
  CalendarDays,
  Users,
  CreditCard,
  Search,
  ChevronRight,
  Edit,
  ExternalLink,
  Banknote,
  Gift,
  Image as ImageIcon,
  Save,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

import { DummyPlayer, MockQuiz, CompetitionPhase } from "@/types/competition";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PhaseRegistration } from "./_components/phase-registration";
import { PhasePayment } from "./_components/phase-payment";
import { PhaseQualification } from "./_components/phase-qualification";
import { PhaseGroupStage, LocalGroup, GameApp } from "./_components/phase-group-stage";
import { PhaseCompleted } from "./_components/phase-completed";

// --- MOCK QUIZZES ---

const MOCK_QUIZZES: MockQuiz[] = [
  { id: "q1", title: "Sains Dasar", questionCount: 20, duration: 30 },
  { id: "q2", title: "Matematika Logika", questionCount: 15, duration: 25 },
  { id: "q3", title: "IPA Terpadu", questionCount: 25, duration: 40 },
  { id: "q4", title: "Pengetahuan Umum", questionCount: 30, duration: 35 },
  { id: "q5", title: "Bahasa Indonesia", questionCount: 20, duration: 20 },
];

export default function CompetitionDetailPage() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const compId = params.id as string;
  const supabase = getSupabaseBrowserClient();

  const [detail, setDetail] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [players, setPlayers] = useState<DummyPlayer[]>([]);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isSavingGroups, setIsSavingGroups] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [rulesExpanded, setRulesExpanded] = useState(false);

  // Wizard phase state
  const [activePhase, setActivePhase] = useState<CompetitionPhase>("registration");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedPhase = localStorage.getItem(`comp_phase_${compId}`) as CompetitionPhase;
      if (savedPhase) setActivePhase(savedPhase);
    }
  }, [compId]);

  const handlePhaseChange = (val: string) => {
    const phase = val as CompetitionPhase;
    setActivePhase(phase);
    if (typeof window !== "undefined") {
      localStorage.setItem(`comp_phase_${compId}`, phase);
    }
  };

  // Group Stage local state
  const [localGroups, setLocalGroups] = useState<LocalGroup[]>([]);
  const [availableGames, setAvailableGames] = useState<GameApp[]>([]);

  useEffect(() => {
    async function getDetail() {
      const { data, error } = await supabase
        .from("competitions")
        .select("*")
        .eq("id", compId)
        .single();

      if (error) {
        toast.error("Competition not found");
        router.push("/manage-competitions");
        return;
      }

      setDetail(data);

      // Fetch participants
      const { data: participantsData, error: pError } = await supabase
        .from("competition_participants")
        .select("*")
        .eq("competition_id", compId);

      if (!pError && participantsData) {
        const userIds = participantsData.map((p: any) => p.user_id).filter(Boolean);
        let profilesMap: Record<string, any> = {};

        // Fetch User Profiles
        if (userIds.length > 0) {
          const { data: profilesData, error: profError } = await supabase
            .from("profiles")
            .select("id, fullname, username, avatar_url")
            .in("id", userIds);

          if (!profError && profilesData) {
            profilesMap = profilesData.reduce((acc: any, prof: any) => {
              acc[prof.id] = prof;
              return acc;
            }, {});
          }
        }

        // Fetch Game Sessions for Stats
        let userStats: Record<string, { gamesPlayed: number, totalScore: number }> = {};
        if (userIds.length > 0) {
          const { data: sessionsData, error: sessionsError } = await supabase
            .from("game_sessions")
            .select("participants");

          if (!sessionsError && sessionsData) {
            sessionsData.forEach((session: any) => {
              if (Array.isArray(session.participants)) {
                session.participants.forEach((p: any) => {
                  if (p.user_id && userIds.includes(p.user_id)) {
                    if (!userStats[p.user_id]) userStats[p.user_id] = { gamesPlayed: 0, totalScore: 0 };
                    userStats[p.user_id].gamesPlayed += 1;
                    userStats[p.user_id].totalScore += p.score || 0;
                  }
                });
              }
            });
          }
        }

        const mappedPlayers: DummyPlayer[] = participantsData.map((p: any) => {
          const prof = profilesMap[p.user_id] || {};
          const stats = userStats[p.user_id] || { gamesPlayed: 0, totalScore: 0 };
          const avgScore = stats.gamesPlayed > 0 ? Number((stats.totalScore / stats.gamesPlayed).toFixed(1)) : 0;

          return {
            id: p.id,
            name: prof.fullname || prof.username || "Unknown",
            username: prof.username || p.user_id,
            avatar: prof.avatar_url || null,
            gamesPlayed: stats.gamesPlayed,
            avgScore: avgScore,
            paid: p.is_paid || false,
            registeredAt: p.registered_at,
            isFinalist: p.is_finalist || false,
            category: p.category || undefined,
          };
        });

        setPlayers(mappedPlayers);
      } else {
        console.error("Error fetching participants:", pError);
        setPlayers([]);
      }

      setIsLoading(false);
    }
    getDetail();

    // Fetch available games from game_sessions.application
    async function fetchGames() {
      const { data, error } = await supabase
        .rpc('get_distinct_applications')
        .select('*');

      // Fallback: if RPC doesn't exist, query directly
      if (error) {
        const { data: rawData } = await supabase
          .from("game_sessions")
          .select("application");
        if (rawData) {
          const countMap: Record<string, number> = {};
          rawData.forEach((row: any) => {
            const app = row.application;
            countMap[app] = (countMap[app] || 0) + 1;
          });
          setAvailableGames(
            Object.entries(countMap)
              .map(([name, count]) => ({ name, count }))
              .sort((a, b) => a.name.localeCompare(b.name))
          );
        }
      }
    }
    fetchGames();

    async function fetchPlayers() {
      // 1. Ambil pendaftar dari db sesuai competition_id
      const { data: participants, error: pErr } = await supabase
        .from("competition_participants")
        .select("*")
        .eq("competition_id", compId);

      if (pErr || !participants || participants.length === 0) return;

      // 2. Karena tidak ada explicit FK antara user_id dan profiles.id, kita ambil manual
      const userIds = participants.map((p: any) => p.user_id);
      const { data: profiles, error: prErr } = await supabase
        .from("profiles")
        .select("id, fullname, avatar_url, nickname")
        .in("id", userIds);

      // 3. Gabungkan datanya dan mapping ke interface UI (DummyPlayer)
      const formattedPlayers: DummyPlayer[] = participants.map((p: any) => {
        const prof = (profiles || []).find((x: any) => x.id === p.user_id);
        return {
          id: p.id,
          name: prof?.fullname || prof?.nickname || "Unknown Player",
          avatar: prof?.avatar_url || null,
          gamesPlayed: Math.floor(Math.random() * 20), // Masih hardcoded dummy sampai game_sessions hitungan rilis
          avgScore: Math.floor(Math.random() * 50) + 50, // Dummy score
          paid: p.is_paid || false,
          registeredAt: p.registered_at,
          isFinalist: p.is_finalist || false,
        };
      });

      setPlayers(formattedPlayers);

      // 4. Ambil dan susun Group configuration yang sudah di-save ke DB
      const { data: dbGroups } = await supabase
        .from("competition_groups")
        .select(`
          id, name, stage, quiz_ids, game_ids, source_group_ids,
          competition_group_members(participant_id, score, time_seconds, is_advanced)
        `)
        .eq("competition_id", compId);

      if (dbGroups) {
        const loadedGroups: LocalGroup[] = dbGroups.map((g: any) => ({
          id: g.id,
          name: g.name,
          stage: g.stage || "",
          sources: g.source_group_ids || [],
          quizIds: g.quiz_ids || [],
          gameIds: g.game_ids || [],
          members: (g.competition_group_members || []).map((m: any) => {
            const memInfo = formattedPlayers.find(p => p.id === m.participant_id);
            return {
              playerId: m.participant_id,
              playerName: memInfo?.name || m.participant_id,
              score: Number(m.score) || 0,
              timeSeconds: m.time_seconds || 0,
              isAdvanced: m.is_advanced || false,
            };
          })
        }));
        setLocalGroups(loadedGroups);
      }
    }
    fetchPlayers();
  }, [compId, supabase, router]);

  // --- Database Sync for Groups ---
  const handleSaveGroupsToDb = async () => {
    setIsSavingGroups(true);
    try {
      // 1. Dapatkan daftar grup lama untuk dihapus anak-anak isinya (manual cascade)
      const { data: oldGroups } = await supabase.from("competition_groups").select("id").eq("competition_id", compId);
      if (oldGroups && oldGroups.length > 0) {
        const oldIds = oldGroups.map((g: any) => g.id);
        await supabase.from("competition_group_members").delete().in("group_id", oldIds);
        await supabase.from("competition_groups").delete().in("id", oldIds);
      }

      // 2. Tulis Batch Grup Baru
      const insertGroups = localGroups.map(g => ({
        id: g.id,
        competition_id: compId,
        name: g.name,
        stage: g.stage || "",
        quiz_ids: g.quizIds || [],
        game_ids: g.gameIds || [],
        source_group_ids: g.sources || []
      }));

      if (insertGroups.length > 0) {
        const { error: eg } = await supabase.from("competition_groups").insert(insertGroups);
        if (eg) throw eg;

        let insertMembers: any[] = [];
        localGroups.forEach(g => {
          g.members.forEach((m, idx) => {
            insertMembers.push({
              id: `${g.id}-${m.playerId}-${idx}`, // memastikan unik meski salah logika
              group_id: g.id,
              participant_id: m.playerId,
              score: m.score,
              time_seconds: m.timeSeconds,
              is_advanced: m.isAdvanced
            });
          });
        });

        if (insertMembers.length > 0) {
          const { error: em } = await supabase.from("competition_group_members").insert(insertMembers);
          if (em) throw em;
        }
      }
      toast.success(t("competition.groups_saved") || "Group Configuration Saved Successfully!");
    } catch (e: any) {
      toast.error("Failed to save config: " + e.message);
    } finally {
      setIsSavingGroups(false);
    }
  };

  // --- Player Management ---
  const handleToggleFinalist = (playerId: string) => {
    setPlayers((prev: DummyPlayer[]) =>
      prev.map((p: DummyPlayer) =>
        p.id === playerId ? { ...p, isFinalist: !p.isFinalist } : p
      )
    );
  };

  const handleBatchFinalist = (playerIds: string[]) => {
    setPlayers((prev: DummyPlayer[]) =>
      prev.map((p: DummyPlayer) =>
        playerIds.includes(p.id) ? { ...p, isFinalist: true } : p
      )
    );
  };

  // --- Status config ---
  const statusConfig: Record<string, { label: string; className: string }> = {
    published: { label: t("comp_detail.status_published") || "Published", className: "bg-emerald-500/15 text-emerald-600 border-emerald-200 dark:text-emerald-400 dark:border-emerald-800" },
    draft: { label: t("comp_detail.status_draft") || "Draft", className: "bg-gray-500/15 text-gray-500 border-gray-200 dark:text-gray-400 dark:border-gray-700" },
    completed: { label: t("comp_detail.status_completed") || "Completed", className: "bg-blue-500/15 text-blue-600 border-blue-200 dark:text-blue-400 dark:border-blue-800" },
    coming_soon: { label: t("comp_detail.status_coming_soon") || "Coming Soon", className: "bg-orange-500/15 text-orange-600 border-orange-200 dark:text-orange-400 dark:border-orange-800" },
    finished: { label: t("comp_detail.status_finished") || "Finished", className: "bg-purple-500/15 text-purple-600 border-purple-200 dark:text-purple-400 dark:border-purple-800" },
  };

  function formatCurrency(val: string | number | null) {
    if (!val) return "—";
    if (typeof val === "string") {
      if (/[^0-9.,]/.test(val)) return val;
      const num = parseFloat(val.replace(/\./g, "").replace(/,/g, "."));
      if (isNaN(num)) return val;
      return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num);
    }
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(val);
  }

  if (isLoading || !detail) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Breadcrumb Skeleton */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-4 shrink-0" />
          <Skeleton className="h-4 w-40" />
        </div>

        {/* Title & Edit Button Skeleton */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <Skeleton className="h-10 w-3/4 md:w-1/2" />
          <Skeleton className="h-9 w-24" />
        </div>

        {/* Badges / Info Skeleton */}
        <div className="flex flex-wrap gap-4 border-y border-border py-4">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-32" />
        </div>

        {/* Poster & Description Skeleton */}
        <div className="flex flex-col md:flex-row gap-8">
          <Skeleton className="h-[120px] w-[160px] rounded-lg shrink-0" />
          <div className="space-y-5 flex-1 w-full">
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        </div>

        <Separator />

        {/* Tabs Skeleton */}
        <div className="space-y-6 pt-2">
          <div className="flex gap-4 border-b border-border pb-0 w-full overflow-x-hidden">
             <Skeleton className="h-9 w-28 rounded-b-none" />
             <Skeleton className="h-9 w-24 rounded-b-none" />
             <Skeleton className="h-9 w-32 rounded-b-none" />
             <Skeleton className="h-9 w-32 rounded-b-none" />
          </div>
          <Skeleton className="h-[400px] w-full rounded-xl" />
        </div>
      </div>
    );
  }

  const cfg = statusConfig[detail.status] || statusConfig.draft;
  const totalRegistered = players.length;
  const totalPaid = players.filter((p) => p.paid).length;
  const paidPercentage = totalRegistered > 0 ? Math.round((totalPaid / totalRegistered) * 100) : 0;

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
        <div className="space-y-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-bold text-foreground line-clamp-2" title={detail.title}>{detail.title}</h1>
          </div>

          {/* Inline Stats */}
          <div className="flex items-center gap-x-3 gap-y-2 text-sm text-muted-foreground flex-wrap">
            <Badge variant="outline" className={`capitalize border shrink-0 ${cfg.className}`}>
              {cfg.label}
            </Badge>
            <span>•</span>
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
              <span>
                {detail.registration_start_date
                  ? format(new Date(detail.registration_start_date), "d MMM yyyy")
                  : "—"}
                {" — "}
                {(detail.final_end_date || detail.registration_end_date)
                  ? format(new Date(detail.final_end_date || detail.registration_end_date), "d MMM yyyy")
                  : "—"}
              </span>
            </div>
            <span>•</span>
            <div
              className="flex items-center gap-1.5 cursor-help"
              title={`${t("comp_detail.registration_fee") || "Registration Fee"}: ${formatCurrency(detail.registration_fee || 0)}`}
            >
              <Banknote className="h-4 w-4 text-yellow-500" />
              <span>{formatCurrency(detail.registration_fee || 0)}</span>
            </div>
            <span>•</span>
            <div
              className="flex items-center gap-1.5 cursor-help"
              title={`${t("comp_detail.prize_pool") || "Prize Pool"}: ${formatCurrency(detail.prize_pool || 0)}`}
            >
              <Gift className="h-4 w-4 text-rose-500" />
              <strong className="text-foreground">{formatCurrency(detail.prize_pool || 0)}</strong>
            </div>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          <Button size="sm" className="gap-1.5" onClick={() => router.push(`/manage-competitions/${compId}/edit`)}>
            <Edit className="h-4 w-4" />
            {t("comp_detail.edit") || "Edit"}
          </Button>
        </div>
      </div>

      {/* Poster + Description + Rules + Registration Link */}
      <div className="flex flex-col md:flex-row items-start gap-8">
        {/* Poster */}
        <div className="shrink-0">
          <div
            className={`rounded-lg overflow-hidden border bg-muted/30 relative group transition-all duration-200 shadow-sm hover:shadow-md ${detail.poster_url ? "cursor-zoom-in" : ""}`}
            style={{ width: "160px", height: "120px" }}
            onClick={() => detail.poster_url && setIsImageModalOpen(true)}
          >
            {detail.poster_url ? (
              <>
                <img
                  src={detail.poster_url}
                  alt={detail.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <Search className="text-white opacity-0 group-hover:opacity-100 h-6 w-6 transition-opacity" />
                </div>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted border">
                <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 space-y-5 min-w-0">
          <div>
            <h3 className="text-sm font-semibold mb-1.5">{t("comp_detail.description") || "Description"}</h3>
            <div className="flex items-baseline gap-2 max-w-full overflow-hidden">
              <p className={`text-sm text-muted-foreground leading-relaxed ${!descExpanded ? "truncate" : ""}`}>
                {detail.description}
              </p>
              {detail.description && detail.description.length > 100 && (
                <button
                  type="button"
                  onClick={() => setDescExpanded(!descExpanded)}
                  className="text-xs text-primary hover:underline cursor-pointer whitespace-nowrap shrink-0"
                >
                  {descExpanded ? (t("action.show_less") || "Show less") : (t("action.show_all") || "Show more")}
                </button>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-1.5">{t("comp_detail.rules") || "Rules"}</h3>
            <div className="flex items-baseline gap-2 max-w-full overflow-hidden">
              <div className={`text-sm text-muted-foreground ${!rulesExpanded ? "truncate" : ""}`}>
                {rulesExpanded ? (
                  <ul className="space-y-1">
                    {(detail.rules || []).map((rule: string, i: number) => (
                      <li key={i}>{rule}</li>
                    ))}
                  </ul>
                ) : (
                  <span>{detail.rules?.[0] || "—"}</span>
                )}
              </div>
              {detail.rules && detail.rules.length > 1 && (
                <button
                  type="button"
                  onClick={() => setRulesExpanded(!rulesExpanded)}
                  className="text-xs text-primary hover:underline cursor-pointer whitespace-nowrap shrink-0"
                >
                  {rulesExpanded ? (t("action.show_less") || "Show less") : (t("action.show_all") || "Show all")}
                </button>
              )}
            </div>
          </div>

          {detail.registration_link && (
            <div>
              <h3 className="text-sm font-semibold mb-1.5">{t("comp_detail.reg_link") || "Registration Link"}</h3>
              <a
                href={detail.registration_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline cursor-pointer break-all"
              >
                <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
                {detail.registration_link}
              </a>
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* === WIZARD PHASE TABS === */}
      <Tabs value={activePhase} onValueChange={handlePhaseChange} className="w-full relative z-0">
        <TabsList className="mb-4 w-full justify-start h-auto bg-transparent p-0 gap-2 overflow-x-auto rounded-none border-b no-scrollbar">
          <TabsTrigger value="registration" className="relative h-9 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-medium text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none cursor-pointer">
            {t("competition.phase_registration") || "Registration"}
          </TabsTrigger>
          <TabsTrigger value="payment" className="relative h-9 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-medium text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none cursor-pointer">
            {t("competition.phase_payment") || "Payment"}
          </TabsTrigger>
          <TabsTrigger value="qualification" className="relative h-9 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-medium text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none cursor-pointer">
            {t("competition.phase_qualification") || "Qualification"}
          </TabsTrigger>
          <TabsTrigger value="group_stage" className="relative h-9 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-medium text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none cursor-pointer">
            {t("competition.phase_group_stage") || "Group Stage"}
          </TabsTrigger>
          <TabsTrigger value="completed" className="relative h-9 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-medium text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none cursor-pointer">
            {t("competition.phase_completed") || "Completed"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="registration" className="mt-0 outline-none">
          <PhaseRegistration players={players} />
        </TabsContent>

        <TabsContent value="payment" className="mt-0 outline-none">
          <PhasePayment players={players} />
        </TabsContent>

        <TabsContent value="qualification" className="mt-0 outline-none">
          <PhaseQualification
            players={players}
            onToggleFinalist={handleToggleFinalist}
            onBatchFinalist={handleBatchFinalist}
          />
        </TabsContent>

        <TabsContent value="group_stage" className="mt-0 outline-none">
          <PhaseGroupStage
            finalists={players.filter((p) => p.isFinalist)}
            groups={localGroups}
            quizzes={MOCK_QUIZZES}
            games={availableGames}
            onGroupsChange={setLocalGroups}
            onSave={handleSaveGroupsToDb}
            isSaving={isSavingGroups}
          />
        </TabsContent>

        <TabsContent value="completed" className="mt-0 outline-none">
          <PhaseCompleted groups={localGroups} />
        </TabsContent>
      </Tabs>

      {/* Image Preview Modal */}
      <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
        <DialogContent className="max-w-lg p-2">
          <DialogTitle className="sr-only">Poster Preview</DialogTitle>
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium px-2 pt-2">{detail.title}</p>
            <img
              src={detail.poster_url}
              alt={detail.title}
              className="w-full rounded-md object-contain max-h-[70vh]"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
