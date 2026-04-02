"use server";

import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export interface StaleSession {
    id: string;
    game_pin: string;
    quiz_title: string;
    host_name: string;
    host_id: string;
    created_at: string;
    waiting_duration_minutes: number;
    participant_count: number;
    application: string;
    avatar_url?: string;
}

export async function fetchStaleWaitingSessions(): Promise<{
    data: StaleSession[];
    error: string | null;
}> {
    try {
        const supabase = getSupabaseAdminClient();

        // Calculate the timestamp for 1 hour ago
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

        const { data: sessions, error } = await supabase
            .from("game_sessions")
            .select("id, game_pin, quiz_id, host_id, created_at, participants, application, quiz_detail, status")
            .eq("status", "waiting")
            .lte("created_at", oneHourAgo)
            .order("created_at", { ascending: true });

        if (error) throw error;

        if (!sessions || sessions.length === 0) {
            return { data: [], error: null };
        }

        // Get host profiles
        const hostIds = [...new Set(sessions.map((s) => s.host_id).filter(Boolean))];
        const { data: profiles } = hostIds.length > 0
            ? await supabase
                .from("profiles")
                .select("id, fullname, username, avatar_url")
                .in("id", hostIds)
            : { data: [] };

        const profileMap = new Map(profiles?.map((p) => [p.id, p]));

        const now = Date.now();

        const mapped: StaleSession[] = sessions.map((session) => {
            const host = profileMap.get(session.host_id);
            const participants = session.participants as any[] | null;
            const quizDetail = session.quiz_detail as any;
            const createdAt = new Date(session.created_at).getTime();
            const waitingMinutes = Math.round((now - createdAt) / 60000);

            return {
                id: session.id,
                game_pin: session.game_pin,
                quiz_title: quizDetail?.title || "Untitled Quiz",
                host_name: host?.fullname || host?.username || "Unknown",
                host_id: session.host_id,
                created_at: session.created_at,
                waiting_duration_minutes: waitingMinutes,
                participant_count: Array.isArray(participants) ? participants.length : 0,
                application: session.application || "-",
                avatar_url: host?.avatar_url,
            };
        });

        return { data: mapped, error: null };
    } catch (err: any) {
        console.error("fetchStaleWaitingSessions error:", err);
        return { data: [], error: err.message || "Failed to fetch stale sessions" };
    }
}

import { revalidatePath } from "next/cache";

export async function clearSessions(sessionIds: string[]): Promise<{
    cleared: number;
    error: string | null;
}> {
    try {
        if (!sessionIds || sessionIds.length === 0) {
            return { cleared: 0, error: "No session IDs provided" };
        }

        const supabase = getSupabaseAdminClient();

        // 1. Pre-emptively delete related notifications to avoid foreign key constraints
        await supabase
            .from("notifications")
            .delete()
            .eq("entity_type", "session")
            .in("entity_id", sessionIds);

        // 2. Delete the actual game sessions
        const { error } = await supabase
            .from("game_sessions")
            .delete()
            .in("id", sessionIds);

        if (error) throw error;

        // 3. Force Next.js cache bypass so the table UI refreshes properly
        revalidatePath("/manage-sessions");
        revalidatePath("/(dashboard)/manage-sessions", "page");

        return { cleared: sessionIds.length, error: null };
    } catch (err: any) {
        console.error("clearSessions error:", err);
        return { cleared: 0, error: err.message || "Failed to clear sessions" };
    }
}
