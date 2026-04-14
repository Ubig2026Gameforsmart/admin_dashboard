"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { useTranslation } from "@/lib/i18n";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import {
  ChevronRight,
  CheckCircle2,
  UserCheck,
  Users,
  X,
  QrCode,
  Camera,
  ScanLine,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/shared/search-input";
import { useToast } from "@/components/ui/use-toast";
import { Checkbox } from "@/components/ui/checkbox";

interface Participant {
  id: string; // competition_participants.id
  userId: string; // profiles.id
  fullname: string;
  username: string;
  avatar_url: string | null;
  attended: boolean;
  groupId: string;
  groupName: string;
  groupStage: string;
}

interface GroupInfo {
  id: string;
  name: string;
  stage: string;
}

interface CompetitionInfo {
  id: string;
  title: string;
  status: string;
}

export default function ReceptionistDetailPage() {
  const params = useParams();
  const { t } = useTranslation();
  const supabase = getSupabaseBrowserClient();
  const compId = params.id as string;

  const [competition, setCompetition] = useState<CompetitionInfo | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [groups, setGroups] = useState<GroupInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [participantQuery, setParticipantQuery] = useState("");
  const [attendanceQuery, setAttendanceQuery] = useState("");
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [scanResult, setScanResult] = useState<{ status: 'success' | 'error' | 'info', message: string } | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const scannerRef = useRef<any>(null);
  const lastScanRef = useRef<{ text: string; time: number } | null>(null);
  const { toast } = useToast();

  const handleParticipantSearch = (val: string) => setParticipantQuery(val);
  const handleAttendanceSearch = (val: string) => setAttendanceQuery(val);

  const toggleGroupCollapse = (groupId: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);

      // 1. Fetch competition info
      const { data: compData } = await supabase
        .from("competitions")
        .select("id, title, status")
        .eq("id", compId)
        .single();

      if (compData) {
        setCompetition(compData);
      }

      // 2. Fetch competition groups
      const { data: groupsData } = await supabase
        .from("competition_groups")
        .select("id, name, stage")
        .eq("competition_id", compId)
        .order("created_at", { ascending: true });

      // Only display groups that are exactly in the "Final" stage
      const fetchedGroups: GroupInfo[] = (groupsData || []).filter(
        (g) => g.stage.toLowerCase() === "final"
      );
      setGroups(fetchedGroups);

      if (fetchedGroups.length === 0) {
        setParticipants([]);
        setIsLoading(false);
        return;
      }

      // 3. Fetch group members
      const groupIds = fetchedGroups.map((g) => g.id);
      const { data: membersData } = await supabase
        .from("competition_group_members")
        .select("id, group_id, participant_id")
        .in("group_id", groupIds);

      if (!membersData || membersData.length === 0) {
        setParticipants([]);
        setIsLoading(false);
        return;
      }

      // 4. Fetch participant records for is_present + user_id
      const participantIds = [...new Set(membersData.map((m) => m.participant_id))];
      const { data: participantsData } = await supabase
        .from("competition_participants")
        .select("id, user_id, is_present")
        .in("id", participantIds);

      if (!participantsData || participantsData.length === 0) {
        setParticipants([]);
        setIsLoading(false);
        return;
      }

      // 5. Fetch profiles
      const userIds = [...new Set(participantsData.map((p) => p.user_id))];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, fullname, username, avatar_url")
        .in("id", userIds);

      const profilesMap: Record<string, any> = {};
      if (profilesData) {
        profilesData.forEach((prof) => {
          profilesMap[prof.id] = prof;
        });
      }

      const participantsMap: Record<string, any> = {};
      participantsData.forEach((p) => {
        participantsMap[p.id] = p;
      });

      const groupsMap: Record<string, GroupInfo> = {};
      fetchedGroups.forEach((g) => {
        groupsMap[g.id] = g;
      });

      // 6. Build the full participant list (one entry per group membership)
      const allParticipants: Participant[] = membersData.map((m) => {
        const pRecord = participantsMap[m.participant_id] || {};
        const prof = profilesMap[pRecord.user_id] || {};
        const grp = groupsMap[m.group_id] || { id: m.group_id, name: "Unknown", stage: "" };

        return {
          id: pRecord.id || m.participant_id,
          userId: pRecord.user_id || "",
          fullname: prof.fullname || prof.username || "Unknown",
          username: prof.username || pRecord.user_id || "unknown",
          avatar_url: prof.avatar_url || null,
          attended: pRecord.is_present || false,
          groupId: grp.id,
          groupName: grp.name,
          groupStage: grp.stage,
        };
      });

      setParticipants(allParticipants);
      setIsLoading(false);
    }
    fetchData();

    // Setup Realtime Subscription to sync active views automatically
    const channel = supabase
      .channel(`comp_participants_${compId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "competition_participants",
        },
        (payload) => {
          const updatedRecord = payload.new;
          setParticipants((prev) =>
            prev.map((p) =>
              p.id === updatedRecord.id
                ? { ...p, attended: updatedRecord.is_present }
                : p
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [compId, refreshTrigger]);

  // Use a ref for participants so the QR scanner callback always has latest data
  const participantsRef = useRef(participants);
  useEffect(() => {
    participantsRef.current = participants;
  }, [participants]);

  // QR Scanner lifecycle
  useEffect(() => {
    if (!qrDialogOpen) {
      if (scannerRef.current) {
        try {
          scannerRef.current.stop().catch(() => {});
        } catch (e) { /* ignore */ }
        scannerRef.current = null;
      }
      setScanResult(null);
      return;
    }

    let mounted = true;
    const initScanner = async () => {
      const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import("html5-qrcode");
      if (!mounted) return;
      await new Promise((r) => setTimeout(r, 400));
      const el = document.getElementById("qr-reader");
      if (!el) return;
      const scanner = new Html5Qrcode("qr-reader", {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        experimentalFeatures: { useBarCodeDetectorIfSupported: true },
        verbose: false,
      });
      scannerRef.current = scanner;

      const config = {
        fps: 15,
        disableFlip: false,
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
          // Use 90% of the container since we are making the container itself a focused box
          const minEdgePercentage = 0.9; 
          const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
          const qrboxSize = Math.floor(minEdgeSize * minEdgePercentage);
          return {
            width: qrboxSize,
            height: qrboxSize
          };
        }
      };

      try {
        await scanner.start(
          { facingMode: "environment" },
          config,
          (decodedText: string) => { handleQrResult(decodedText); },
          () => {}
        );
      } catch {
        try {
          await scanner.start(
            { facingMode: "user" },
            config,
            (decodedText: string) => { handleQrResult(decodedText); },
            () => {}
          );
        } catch (err2) {
          console.error("Failed to start QR scanner:", err2);
        }
      }
    };

    initScanner();
    return () => {
      mounted = false;
      if (scannerRef.current) {
        try { scannerRef.current.stop().catch(() => {}); } catch (e) { /* ignore */ }
        scannerRef.current = null;
      }
    };
  }, [qrDialogOpen]);

  const handleQrResult = useCallback(
    (scannedText: string) => {
      const now = Date.now();
      if (lastScanRef.current && lastScanRef.current.text === scannedText && (now - lastScanRef.current.time) < 4000) return;
      lastScanRef.current = { text: scannedText, time: now };

      let extractedData = scannedText.trim();

      // Deteksi jika yang dis-scan itu mengandung struktur link profile (URL backend kita)
      if (extractedData.includes("/profile/")) {
        // Potong/pecah kalimatnya lalu ambil kata paling belakang
        const parts = extractedData.split("/profile/");
        extractedData = parts.pop()?.replace(/\//g, "") || extractedData;
      }

      // Make scanning case-insensitive and ignore leading '@' if people put them in QR codes
      const cleanedScan = extractedData.replace(/^@/, "").toLowerCase();

      const matched = participantsRef.current.find(
        (p) =>
          p.id.toLowerCase() === cleanedScan ||
          p.userId.toLowerCase() === cleanedScan ||
          p.username.toLowerCase() === cleanedScan
      );

      if (matched) {
        if (matched.attended) {
          setScanResult({
            status: "info",
            message: `${t("receptionist.already_attended") || "Already Attended"}: ${matched.fullname}`,
          });
        } else {
          setParticipants((prev) =>
            prev.map((p) =>
              p.id === matched.id ? { ...p, attended: true } : p
            )
          );
          supabase
            .from("competition_participants")
            .update({ is_present: true })
            .eq("id", matched.id)
            .then(({ error }) => {
              if (error) console.error("Error checking in via QR", error);
            });

          setScanResult({
            status: "success",
            message: `${t("receptionist.scan_success") || "Attendance Recorded!"} - ${matched.fullname}`,
          });
        }
      } else {
        const notFoundDesc = t("receptionist.scan_not_found_desc") || "QR code does not match any finalist.";
        setScanResult({
          status: "error",
          message: `${notFoundDesc} (${cleanedScan})`,
        });
      }

      // Hide custom toast after 3 seconds
      setTimeout(() => setScanResult(null), 3000);
    },
    [participants, t]
  );

  const toggleAttendance = async (id: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    setParticipants((prev) =>
      prev.map((p) => (p.id === id ? { ...p, attended: newStatus } : p))
    );
    const { error } = await supabase
      .from("competition_participants")
      .update({ is_present: newStatus })
      .eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      // revert on error
      setParticipants((prev) =>
        prev.map((p) => (p.id === id ? { ...p, attended: currentStatus } : p))
      );
    }
  };

  // Deduplicate participants (same person may appear in multiple groups)
  // For attendance tracking, we only need unique participant IDs
  const uniqueParticipantIds = [...new Set(participants.map((p) => p.id))];
  const uniqueParticipants = uniqueParticipantIds.map((id) =>
    participants.find((p) => p.id === id)!
  );

  const totalParticipants = uniqueParticipants.length;
  const totalAttended = uniqueParticipants.filter((p) => p.attended).length;
  const totalNotAttended = uniqueParticipants.filter((p) => !p.attended).length;

  // Group participants by group
  const groupedParticipants = groups
    .map((g) => {
      const members = participants
        .filter((p) => p.groupId === g.id)
        .filter(
          (p) =>
            p.fullname.toLowerCase().includes(participantQuery.toLowerCase()) ||
            p.username.toLowerCase().includes(participantQuery.toLowerCase())
        )
        .sort((a, b) => a.fullname.localeCompare(b.fullname));
      return { ...g, members, totalMembers: participants.filter((p) => p.groupId === g.id).length };
    })
    .filter((g) => g.members.length > 0 || !participantQuery);

  // Stage color helper
  const getStageColor = (stage: string) => {
    const s = stage.toLowerCase();
    if (s.includes("champion") || s.includes("juara")) return "bg-amber-500/10 text-amber-500 border-amber-500/30";
    if (s.includes("final")) return "bg-blue-500/10 text-blue-500 border-blue-500/30";
    if (s.includes("semi")) return "bg-purple-500/10 text-purple-500 border-purple-500/30";
    return "bg-muted text-muted-foreground";
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted rounded w-64 animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((col) => (
            <div key={col} className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="rounded-xl border border-border bg-card p-6 animate-pulse">
                  <div className="h-6 bg-muted rounded w-40 mb-4" />
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="flex items-center gap-3 py-3">
                      <div className="h-10 w-10 rounded-full bg-muted" />
                      <div className="flex-1">
                        <div className="h-4 bg-muted rounded w-32 mb-1" />
                        <div className="h-3 bg-muted rounded w-24" />
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Participant row renderer
  const ParticipantRow = ({
    p,
    onAction,
  }: {
    p: Participant;
    onAction: (id: string, current: boolean) => void;
  }) => (
    <div
      key={p.id}
      className={`flex items-center gap-3 px-4 py-3 border-b last:border-0 hover:bg-muted/50 transition-colors cursor-pointer group ${
        p.attended ? "bg-emerald-500/5 hover:bg-emerald-500/10" : ""
      }`}
      onClick={() => onAction(p.id, p.attended)}
    >
      <Checkbox 
        checked={p.attended} 
        onCheckedChange={() => onAction(p.id, p.attended)}
        className="data-[state=checked]:bg-emerald-500 data-[state=checked]:text-white data-[state=checked]:border-emerald-500 h-5 w-5 rounded-md"
        onClick={(e) => e.stopPropagation()} // Prevent double firing
      />
      <div className="relative h-9 w-9 rounded-full bg-muted overflow-hidden shrink-0">
        {p.avatar_url ? (
          <img src={p.avatar_url} alt={p.fullname} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs font-medium text-muted-foreground">
            {p.fullname.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${p.attended ? "text-emerald-700 dark:text-emerald-400" : "text-foreground"}`}>
          {p.fullname}
        </p>
        <p className="text-[11px] text-muted-foreground truncate">@{p.username}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/receptionist" className="hover:text-foreground transition-colors cursor-pointer">
          {t("nav.receptionist") || "Receptionist"}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium">
          {t("receptionist.attendance") || "Attendance"}
        </span>
      </nav>

      {/* Title + Stats */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground line-clamp-1" title={competition?.title}>
            {competition?.title || "—"}
          </h1>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setRefreshTrigger((prev) => prev + 1)}
              disabled={isLoading}
              title={t("common.refresh") || "Refresh Data"}
              className="text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
            <Button
              onClick={() => setQrDialogOpen(true)}
              className="gap-2 bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
            >
              <QrCode className="h-4 w-4" />
              {t("receptionist.scan_qr") || "Scan QR"}
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            <strong className="text-foreground">{totalParticipants}</strong> {t("receptionist.total_finalist") || "Total Participants"}
          </span>
          <span className="flex items-center gap-1.5">
            <UserCheck className="h-4 w-4 text-emerald-500" />
            <strong className="text-emerald-500">{totalAttended}</strong> {t("receptionist.attended") || "Attended"}
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="h-4 w-4 text-orange-500" />
            <strong className="text-orange-500">{totalNotAttended}</strong> {t("receptionist.not_attended") || "Not Attended"}
          </span>
        </div>
      </div>

      {/* Single Column Layout grouped by Cards */}
      <div className="space-y-4">
        <div className="flex justify-end">
          <div className="relative w-full md:max-w-md">
            <SearchInput
              placeholder={t("competition.search_finalist") || "Search participant across all groups..."}
              value={participantQuery}
              onSearch={handleParticipantSearch}
              className="h-10 text-sm"
            />
          </div>
        </div>

        {groupedParticipants.length === 0 ? (
          <div className="rounded-xl border border-border bg-card flex flex-col items-center justify-center py-12 text-center">
            <Users className="h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">
              {t("receptionist.no_participants") || "No participants found"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groupedParticipants.map((g) => {
              const isCollapsed = collapsedGroups[g.id];
              const attendedCount = g.members.filter((p) => p.attended).length;
              const isAllAttended = attendedCount === g.totalMembers && g.totalMembers > 0;

              return (
                <div 
                  key={g.id} 
                  className={`rounded-xl border overflow-hidden transition-colors ${
                    isAllAttended 
                      ? "border-emerald-500/30 bg-emerald-500/5" 
                      : "border-border bg-card"
                  }`}
                >
                  {/* Group header */}
                  <div
                    className={`flex items-center justify-between px-4 py-3 border-b cursor-pointer transition-colors ${
                      isAllAttended 
                        ? "border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500/20" 
                        : "border-border bg-muted/20 hover:bg-muted/40"
                    }`}
                    onClick={() => toggleGroupCollapse(g.id)}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <h3 className="text-sm font-semibold text-foreground truncate">{g.name}</h3>
                      <Badge className={`text-[10px] ${getStageColor(g.stage)}`}>
                        {g.stage}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs font-medium ${isAllAttended ? "text-emerald-600" : "text-muted-foreground"}`}>
                        {attendedCount}/{g.totalMembers}
                      </span>
                      {isCollapsed ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {/* Group members */}
                  {!isCollapsed && (
                    <div className="flex flex-col max-h-[350px] overflow-y-auto">
                      {g.members.length === 0 ? (
                        <div className="flex items-center justify-center py-6 text-center">
                          <p className="text-xs text-muted-foreground">
                            {t("receptionist.no_participants") || "No participants in this group."}
                          </p>
                        </div>
                      ) : (
                        g.members.map((p) => (
                          <ParticipantRow key={p.id} p={p} onAction={toggleAttendance} />
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* QR Scanner Full-Screen Overlay */}
      {qrDialogOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-black">
          {/* Header */}
          <div className="flex items-center justify-between p-4 shrink-0">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
                <Camera className="h-5 w-5 text-emerald-400" />
                {t("receptionist.scan_qr") || "Scan QR"}
              </h2>
              <p className="text-sm text-white/50 mt-0.5">
                {t("receptionist.scan_qr_desc") || "Point the camera at a participant's QR code to record attendance."}
              </p>
            </div>
            <button
              onClick={() => setQrDialogOpen(false)}
              className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="h-5 w-5 text-white" />
            </button>
          </div>

          {/* Camera feed centered in a focused box */}
          <div className="flex-1 flex items-center justify-center relative bg-black/95">
            <style>{`
              #qr-shaded-region,
              #qr-reader *[style*="border"] {
                display: none !important;
                border: none !important;
                box-shadow: none !important;
              }
              #qr-reader video {
                z-index: 10 !important;
                border: none !important;
                box-shadow: none !important;
                width: 100% !important;
                height: 100% !important;
                object-fit: cover !important;
              }
            `}</style>
            
            <div className="relative w-[85vw] h-[85vw] max-w-[400px] max-h-[400px] md:max-w-[450px] md:max-h-[450px] overflow-hidden rounded-2xl bg-zinc-900/50">
              <div id="qr-reader" className="absolute inset-0 w-full h-full" />

              {/* Corner brackets */}
              <div className="absolute inset-4 pointer-events-none z-[20]">
                <div className="absolute top-0 left-0" style={{ width: "40px", height: "40px", borderTop: "4px solid #34d399", borderLeft: "4px solid #34d399", borderTopLeftRadius: "12px" }} />
                <div className="absolute top-0 right-0" style={{ width: "40px", height: "40px", borderTop: "4px solid #34d399", borderRight: "4px solid #34d399", borderTopRightRadius: "12px" }} />
                <div className="absolute bottom-0 left-0" style={{ width: "40px", height: "40px", borderBottom: "4px solid #34d399", borderLeft: "4px solid #34d399", borderBottomLeftRadius: "12px" }} />
                <div className="absolute bottom-0 right-0" style={{ width: "40px", height: "40px", borderBottom: "4px solid #34d399", borderRight: "4px solid #34d399", borderBottomRightRadius: "12px" }} />
              </div>
            </div>

            {/* Bottom label */}
            <div className="absolute bottom-6 left-0 right-0 text-center pointer-events-none z-[20]">
              <span className="text-white/80 text-sm font-medium tracking-wide bg-black/60 px-5 py-2 rounded-full">
                {t("receptionist.point_camera") || "Point camera at QR code"}
              </span>
            </div>

          {/* Minimalist In-Scanner Toast */}
          {scanResult && (
            <div className={`absolute bottom-20 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-2 px-4 py-2.5 rounded-full shadow-2xl animate-in slide-in-from-bottom-4 fade-in duration-300 pointer-events-none max-w-[90vw] whitespace-nowrap
              ${scanResult.status === 'success' ? 'bg-emerald-500 text-white' : 
                scanResult.status === 'info' ? 'bg-blue-500 text-white' : 
                'bg-red-500 text-white'}`}
            >
              <div className="shrink-0 bg-white/20 rounded-full p-0.5">
                {scanResult.status === 'success' ? <CheckCircle2 className="h-4 w-4" /> :
                 scanResult.status === 'info' ? <UserCheck className="h-4 w-4" /> :
                 <AlertCircle className="h-4 w-4" />}
              </div>
              <span className="text-sm font-medium tracking-wide truncate">
                {scanResult.message}
              </span>
            </div>
          )}
          </div>
        </div>
      )}
    </div>
  );
}
