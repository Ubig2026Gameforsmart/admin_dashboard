"use server"

import { getSupabaseServerClient } from "@/lib/supabase-server"

import { type GameApplication } from "@/types/game"

export async function fetchGameApplications(
    startDate?: string,
    endDate?: string
): Promise<{
    data: GameApplication[]
    error: string | null
}> {
    const supabase = await getSupabaseServerClient()

    let query = supabase
        .from("game_sessions")
        .select("application, status, host_id, participants, created_at")
        .not("application", "is", null)

    if (startDate) {
        query = query.gte("created_at", startDate)
    }
    if (endDate) {
        query = query.lte("created_at", endDate)
    }

    const { data: sessions, error } = await query

    if (error) {
        return { data: [], error: error.message }
    }

    // Aggregate data per application
    const appMap = new Map<
        string,
        {
            total_sessions: number
            finished_sessions: number
            active_sessions: number
            hosts: Set<string>
            total_players: number
            first_session: string | null
            last_session: string | null
        }
    >()

    for (const session of sessions || []) {
        const app = session.application as string
        if (!app) continue

        const existing = appMap.get(app) || {
            total_sessions: 0,
            finished_sessions: 0,
            active_sessions: 0,
            hosts: new Set<string>(),
            total_players: 0,
            first_session: null,
            last_session: null,
        }

        existing.total_sessions++
        if (session.status === "finished") existing.finished_sessions++
        if (session.status === "active") existing.active_sessions++
        if (session.host_id) existing.hosts.add(session.host_id)

        const participants = session.participants as unknown[]
        if (Array.isArray(participants)) {
            existing.total_players += participants.length
        }

        const created = session.created_at as string
        if (!existing.first_session || created < existing.first_session) {
            existing.first_session = created
        }
        if (!existing.last_session || created > existing.last_session) {
            existing.last_session = created
        }

        appMap.set(app, existing)
    }

    const result: GameApplication[] = Array.from(appMap.entries())
        .map(([name, stats]) => ({
            name,
            total_sessions: stats.total_sessions,
            finished_sessions: stats.finished_sessions,
            active_sessions: stats.active_sessions,
            unique_hosts: stats.hosts.size,
            total_players: stats.total_players,
            first_session: stats.first_session,
            last_session: stats.last_session,
        }))
        .sort((a, b) => b.total_sessions - a.total_sessions)

    return { data: result, error: null }
}
