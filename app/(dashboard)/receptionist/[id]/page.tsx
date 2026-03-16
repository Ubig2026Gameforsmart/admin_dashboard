"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { useTranslation } from "@/lib/i18n";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import {
  ChevronRight,
  Search,
  CheckCircle2,
  UserCheck,
  Users,
  X,
  QrCode,
  Camera,
  ScanLine,
} from "lucide-react";
import Link from "next/link";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/shared/search-input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";

interface Participant {
  id: string;
  fullname: string;
  username: string;
  avatar_url: string | null;
  attended: boolean;
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
  const [isLoading, setIsLoading] = useState(true);
  const [participantQuery, setParticipantQuery] = useState("");
  const [attendanceQuery, setAttendanceQuery] = useState("");
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const scannerRef = useRef<any>(null);
  const { toast } = useToast();

  const handleParticipantSearch = (val: string) => setParticipantQuery(val);
  const handleAttendanceSearch = (val: string) => setAttendanceQuery(val);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);

      // Fetch competition info
      const { data: compData } = await supabase
        .from("competitions")
        .select("id, title, status")
        .eq("id", compId)
        .single();

      if (compData) {
        setCompetition(compData);
      }

      // Fetch finalist users - for now using dummy data from profiles
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, fullname, username, avatar_url")
        .limit(20);

      if (profilesData) {
        // All start as not attended
        const dummyParticipants: Participant[] = profilesData.map((p) => ({
          id: p.id,
          fullname: p.fullname || p.username || "Unknown",
          username: p.username || "unknown",
          avatar_url: p.avatar_url,
          attended: false,
        }));
        setParticipants(dummyParticipants);
      }

      setIsLoading(false);
    }
    fetchData();
  }, [compId]);

  // QR Scanner lifecycle
  useEffect(() => {
    if (!qrDialogOpen) {
      // Cleanup scanner when dialog closes
      if (scannerRef.current) {
        try {
          scannerRef.current.stop().catch(() => {});
        } catch (e) {
          // ignore
        }
        scannerRef.current = null;
      }
      setScanResult(null);
      return;
    }

    // Dynamically import html5-qrcode (browser-only API)
    let mounted = true;
    const initScanner = async () => {
      const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import("html5-qrcode");

      if (!mounted) return;

      // Small delay to ensure DOM element is ready
      await new Promise((r) => setTimeout(r, 400));

      const el = document.getElementById("qr-reader");
      if (!el) return;

      const scanner = new Html5Qrcode("qr-reader", {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true,
        },
        verbose: false,
      });
      scannerRef.current = scanner;

      try {
        await scanner.start(
          { facingMode: "environment" },
          { fps: 15, disableFlip: false },
          (decodedText: string) => {
            setScanResult(decodedText);
            handleQrResult(decodedText);
          },
          () => {
            // scan error, ignore (continuous scanning)
          }
        );
      } catch (err) {
        console.error("Failed to start QR scanner:", err);
        // Fallback: try user-facing camera
        try {
          await scanner.start(
            { facingMode: "user" },
            { fps: 15, disableFlip: false },
            (decodedText: string) => {
              setScanResult(decodedText);
              handleQrResult(decodedText);
            },
            () => {}
          );
        } catch (err2) {
          console.error("Failed to start QR scanner (fallback):", err2);
        }
      }
    };

    initScanner();

    return () => {
      mounted = false;
      if (scannerRef.current) {
        try {
          scannerRef.current.stop().catch(() => {});
        } catch (e) {
          // ignore
        }
        scannerRef.current = null;
      }
    };
  }, [qrDialogOpen]);

  const handleQrResult = useCallback(
    (scannedText: string) => {
      // Try to match scanned text with participant id or username
      const matched = participants.find(
        (p) =>
          p.id === scannedText ||
          p.username.toLowerCase() === scannedText.toLowerCase()
      );

      if (matched) {
        if (matched.attended) {
          toast({
            title: t("receptionist.already_attended") || "Already Attended",
            description: `${matched.fullname} (@${matched.username})`,
            variant: "default",
          });
        } else {
          // Mark as attended
          setParticipants((prev) =>
            prev.map((p) =>
              p.id === matched.id ? { ...p, attended: true } : p
            )
          );
          toast({
            title: t("receptionist.scan_success") || "Attendance Recorded!",
            description: `${matched.fullname} (@${matched.username})`,
          });
        }
      } else {
        toast({
          title: t("receptionist.scan_not_found") || "Not Found",
          description:
            t("receptionist.scan_not_found_desc") ||
            "QR code does not match any finalist.",
          variant: "destructive",
        });
      }
    },
    [participants, t, toast]
  );

  const markAttended = (id: string) => {
    setParticipants((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, attended: true } : p
      )
    );
  };

  const unmarkAttended = (id: string) => {
    setParticipants((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, attended: false } : p
      )
    );
  };

  // Participants = those NOT yet attended
  const notAttended = participants.filter((p) => !p.attended);
  const filteredParticipants = notAttended.filter(
    (p) =>
      p.fullname.toLowerCase().includes(participantQuery.toLowerCase()) ||
      p.username.toLowerCase().includes(participantQuery.toLowerCase())
  );

  // Attendance = those who HAVE attended
  const attended = participants.filter((p) => p.attended);
  const filteredAttendance = attended.filter(
    (p) =>
      p.fullname.toLowerCase().includes(attendanceQuery.toLowerCase()) ||
      p.username.toLowerCase().includes(attendanceQuery.toLowerCase())
  );

  const totalParticipants = participants.length;
  const totalNotAttended = notAttended.length;
  const totalAttended = attended.length;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted rounded w-64 animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-xl border border-border bg-card p-6 animate-pulse">
            <div className="h-6 bg-muted rounded w-40 mb-4" />
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3 py-3">
                <div className="h-10 w-10 rounded-full bg-muted" />
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded w-32 mb-1" />
                  <div className="h-3 bg-muted rounded w-24" />
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-border bg-card p-6 animate-pulse">
            <div className="h-6 bg-muted rounded w-40 mb-4" />
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3 py-3">
                <div className="h-10 w-10 rounded-full bg-muted" />
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded w-32 mb-1" />
                  <div className="h-3 bg-muted rounded w-24" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

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
          <Button
            onClick={() => setQrDialogOpen(true)}
            className="gap-2 bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
          >
            <QrCode className="h-4 w-4" />
            {t("receptionist.scan_qr") || "Scan QR"}
          </Button>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>
            <strong className="text-foreground">{totalParticipants}</strong> {t("receptionist.total_finalist") || "Total Finalist"}
          </span>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: Participants (not yet attended) */}
        <div className="rounded-xl border border-border bg-card">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                {t("competition.finalist") || "Finalist"}
                <Badge variant="secondary" className="ml-1 text-xs">
                  {totalNotAttended}
                </Badge>
              </h2>
            </div>
            <div className="relative">
              <SearchInput
                placeholder={t("competition.search_finalist") || "Search finalist..."}
                value={participantQuery}
                onSearch={handleParticipantSearch}
                className="h-9 text-sm"
              />
            </div>
          </div>
          <div className="divide-y divide-border max-h-[60vh] overflow-y-auto">
            {filteredParticipants.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="h-8 w-8 text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">
                  {totalNotAttended === 0
                    ? (t("receptionist.all_attended") || "All participants have attended!")
                    : (t("receptionist.no_participants") || "No participants found")}
                </p>
              </div>
            ) : (
              filteredParticipants.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer group"
                  onClick={() => markAttended(p.id)}
                >
                  {/* Avatar */}
                  <div className="relative h-10 w-10 rounded-full bg-muted overflow-hidden shrink-0">
                    {p.avatar_url ? (
                      <img
                        src={p.avatar_url}
                        alt={p.fullname}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sm font-medium text-muted-foreground">
                        {p.fullname.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {p.fullname}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      @{p.username}
                    </p>
                  </div>
                  {/* Hover hint */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <CheckCircle2 className="h-5 w-5 text-muted-foreground/50" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT: Attendance (attended) */}
        <div className="rounded-xl border border-emerald-500/20 bg-card">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-emerald-500" />
                {t("receptionist.attendance") || "Attendance"}
                <Badge className="ml-1 text-xs bg-emerald-500/10 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/20">
                  {totalAttended}
                </Badge>
              </h2>
            </div>
            <div className="relative">
              <SearchInput
                placeholder={t("receptionist.search_attendance") || "Search attendance..."}
                value={attendanceQuery}
                onSearch={handleAttendanceSearch}
                className="h-9 text-sm"
              />
            </div>
          </div>
          <div className="divide-y divide-border max-h-[60vh] overflow-y-auto">
            {filteredAttendance.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <UserCheck className="h-8 w-8 text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">
                  {t("receptionist.no_attendance") || "No one has attended yet"}
                </p>
              </div>
            ) : (
              filteredAttendance.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer group"
                  onClick={() => unmarkAttended(p.id)}
                >
                  {/* Avatar */}
                  <div className="relative h-10 w-10 rounded-full bg-muted overflow-hidden shrink-0">
                    {p.avatar_url ? (
                      <img
                        src={p.avatar_url}
                        alt={p.fullname}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sm font-medium text-muted-foreground">
                        {p.fullname.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {p.fullname}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      @{p.username}
                    </p>
                  </div>
                  {/* Green check */}
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                </div>
              ))
            )}
          </div>
        </div>
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

          {/* Camera feed with corner brackets */}
          <div className="flex-1 relative overflow-hidden bg-black">
            {/* Global style to forcefully hide html5-qrcode's default UI */}
            <style>{`
              #qr-shaded-region,
              #qr-reader *[style*="border"] {
                display: none !important;
                border: none !important;
                box-shadow: none !important;
              }
              /* Force video to fill screen and sit on top */
              #qr-reader video {
                z-index: 10 !important;
                border: none !important;
                box-shadow: none !important;
                position: absolute !important;
                top: 0 !important;
                left: 0 !important;
                width: 100% !important;
                height: 100% !important;
                object-fit: cover !important;
              }
            `}</style>
            
            <div id="qr-reader" className="absolute inset-0 w-full h-full" />

            {/* Corner brackets (Full width) */}
            <div className="absolute inset-6 pointer-events-none overflow-hidden z-[20]">
              {/* Top-left */}
              <div className="absolute top-0 left-0" style={{ width: "40px", height: "40px", borderTop: "4px solid #34d399", borderLeft: "4px solid #34d399", borderTopLeftRadius: "12px" }} />
              {/* Top-right */}
              <div className="absolute top-0 right-0" style={{ width: "40px", height: "40px", borderTop: "4px solid #34d399", borderRight: "4px solid #34d399", borderTopRightRadius: "12px" }} />
              {/* Bottom-left */}
              <div className="absolute bottom-0 left-0" style={{ width: "40px", height: "40px", borderBottom: "4px solid #34d399", borderLeft: "4px solid #34d399", borderBottomLeftRadius: "12px" }} />
              {/* Bottom-right */}
              <div className="absolute bottom-0 right-0" style={{ width: "40px", height: "40px", borderBottom: "4px solid #34d399", borderRight: "4px solid #34d399", borderBottomRightRadius: "12px" }} />
            </div>

            {/* Bottom label */}
            <div className="absolute bottom-6 left-0 right-0 text-center pointer-events-none z-[20]">
              <span className="text-white/80 text-sm font-medium tracking-wide bg-black/60 px-5 py-2 rounded-full">
                {t("receptionist.point_camera") || "Point camera at QR code"}
              </span>
            </div>
          </div>

          {/* Last scan result */}
          {scanResult && (
            <div className="flex items-center gap-2 p-3 mx-4 mb-4 rounded-lg bg-emerald-500/20 border border-emerald-500/30 shrink-0">
              <ScanLine className="h-4 w-4 text-emerald-400 shrink-0" />
              <p className="text-sm text-emerald-300 truncate">
                {t("receptionist.last_scan") || "Last scan"}: <span className="font-medium">{scanResult}</span>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
