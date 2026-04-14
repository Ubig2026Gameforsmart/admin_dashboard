"use server";

import { getSupabaseServerClient } from "@/lib/supabase-server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { GameSession } from "@/types/game-session";

interface FetchGameSessionsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  application?: string;
  questions?: string; // "lt_10", "10_20", "gt_20"
  duration?: string; // "lt_5", "5_15", "gt_15"
  sort?: string; // "newest", "oldest", "duration_desc", "duration_asc"
  category?: string;
}

export async function fetchGameSessions({
  page = 1,
  pageSize = 10,
  search = "",
  status = "all",
  application = "all",
  questions = "all",
  duration = "all",
  sort = "newest",
  category = "all",
}: FetchGameSessionsParams = {}) {
  const supabase = await getSupabaseServerClient();

  try {
    console.log("Fetching sessions with category:", category);
    let selectQuery = "*";
    if (category && category !== "all") {
      selectQuery = "*, quizzes!inner(category)";
    }

    let query = supabase
      .from("game_sessions")
      .select(selectQuery, { count: "exact" });

    // Apply Sorting
    switch (sort) {
      case "oldest":
        query = query.order("created_at", { ascending: true });
        break;
      case "duration_desc":
        query = query.order("duration_minutes", { ascending: false });
        break;
      case "duration_asc":
        query = query.order("duration_minutes", { ascending: true });
        break;
      case "questions_desc":
        query = query.order("total_questions", { ascending: false });
        break;
      case "newest":
      default:
        query = query.order("created_at", { ascending: false });
    }

    if (search) {
      query = query.or(`game_pin.ilike.%${search}%,quiz_detail->>title.ilike.%${search}%`);
    }

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    if (application && application !== "all") {
      query = query.ilike("application", `%${application}%`);
    }

    // Filter Questions
    if (questions && questions !== "all") {
      // Assume exact number for specific options like "5", "10"
      query = query.eq("total_questions", Number(questions));
    }

    // Filter Duration
    if (duration && duration !== "all") {
      // Assume exact number
      query = query.eq("duration_minutes", Number(duration));
    }

    // Filter Category
    if (category && category !== "all") {
      query = query.eq("quizzes.category", category);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data: rawSessions, error, count } = await query;
    console.log("Raw sessions count:", rawSessions?.length);
    if (error) {
      console.error("Query error object:", JSON.stringify(error, null, 2));
    }
    const sessions = rawSessions as any[];

    if (error) throw error;

    if (!sessions || sessions.length === 0) {
      return {
        data: [],
        totalCount: 0,
        totalPages: 0,
        currentPage: page,
        error: null,
      };
    }

    // Get host profiles
    const hostIds = new Set(sessions.map((s) => s.host_id).filter(Boolean));

    // Get participant user IDs
    const participantUserIds = new Set<string>();
    sessions.forEach(session => {
      if (Array.isArray(session.participants)) {
        session.participants.forEach((p: any) => {
          if (p.user_id) participantUserIds.add(p.user_id);
        });
      }
    });

    const allUserIds = [...new Set([...hostIds, ...participantUserIds])];

    const { data: profiles } = allUserIds.length > 0
      ? await supabase
        .from("profiles")
        .select("id, fullname, username, avatar_url")
        .in("id", allUserIds)
      : { data: [] };

    const profileMap = new Map(profiles?.map((p) => [p.id, p]));

    // Get Categories
    const quizIds = [...new Set(sessions.map(s => s.quiz_id).filter(Boolean))];
    const { data: quizzes } = quizIds.length > 0
      ? await supabase.from("quizzes").select("id, category").in("id", quizIds)
      : { data: [] };

    const categoryMap = new Map(quizzes?.map(q => [q.id, q.category]));

    const mappedSessions: GameSession[] = sessions.map((session) => {
      const rawParticipants = session.participants as any[];
      let participants: GameSession["participants"] = null;

      if (Array.isArray(rawParticipants)) {
        participants = rawParticipants.map(p => ({
          user_id: p.user_id,
          nickname: p.nickname,
          score: p.score,
          // Map avatar from profile if exists
          avatar_url: p.user_id ? profileMap.get(p.user_id)?.avatar_url : null
        }));
      }

      const quizTitle = session.quiz_detail?.title || "Untitled Quiz";
      let durationMinutes = session.total_time_minutes;

      if (!durationMinutes && session.started_at && session.ended_at) {
        const start = new Date(session.started_at);
        const end = new Date(session.ended_at);
        durationMinutes = Math.round((end.getTime() - start.getTime()) / 60000);
        if (durationMinutes === 0) durationMinutes = 1;
      }

      // Calculate total questions from current_questions array
      const currentQuestions = session.current_questions as any[];
      const totalQuestions = Array.isArray(currentQuestions) ? currentQuestions.length : 0;

      return {
        id: session.id,
        game_pin: session.game_pin,
        host_id: session.host_id,
        quiz_id: session.quiz_id,
        quiz_title: quizTitle,
        status: session.status || "unknown",
        created_at: session.created_at,
        started_at: session.started_at,
        ended_at: session.ended_at,
        participants: participants,
        participant_count: Array.isArray(participants) ? participants.length : 0,
        host: profileMap.get(session.host_id) || null,
        duration_minutes: durationMinutes,
        total_questions: totalQuestions,
        application: session.application,
        category: categoryMap.get(session.quiz_id) || "-",
      };
    });

    return {
      data: mappedSessions,
      totalCount: count || 0,
      totalPages: Math.ceil((count || 0) / pageSize),
      currentPage: page,
      error: null,
    };
  } catch (error) {
    console.error("Error fetching game sessions:", error);
    return {
      data: [],
      totalCount: 0,
      totalPages: 0,
      currentPage: page,
      error: "Failed to fetch game sessions",
    };
  }
}

export async function getGameSessionById(id: string) {
  console.log("🔍 getGameSessionById called with ID:", id);
  console.log("🔍 ID type:", typeof id);
  console.log("🔍 ID length:", id?.length);

  const supabase = getSupabaseAdminClient();
  let session = null;

  try {
    console.log("🔍 Querying game_sessions table...");
    const { data, error } = await supabase
      .from("game_sessions")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    console.log("🔍 Query result - data found:", !!data);
    console.log("🔍 Query result - error:", error);

    if (error) {
      console.error("❌ Error fetching base session:", JSON.stringify(error, null, 2));
      return null;
    }
    session = data;
  } catch (err) {
    console.error("❌ Unexpected error fetching base session:", err);
    return null;
  }

  if (!session) {
    console.log("❌ Session not found for ID:", id);
    return null;
  }

  console.log("✅ Session found:", session.id);

  // Fetch Host Profile (Safe)
  let host = null;
  try {
    if (session.host_id) {
      const { data: hostData } = await supabase
        .from("profiles")
        .select("id, fullname, username, avatar_url")
        .eq("id", session.host_id)
        .single();
      host = hostData;
    }
  } catch (err) {
    console.warn("Failed to fetch host data:", err);
  }

  // Fetch Quiz Category & Title (Safe)
  let category = "-";
  let quizTitle = session.quiz_detail?.title || "Untitled Quiz";
  try {
    if (session.quiz_id) {
      const { data: quizData } = await supabase
        .from("quizzes")
        .select("title, category")
        .eq("id", session.quiz_id)
        .single();
      if (quizData) {
        category = quizData.category || "-";
        quizTitle = quizData.title || quizTitle;
      }
    }
  } catch (err) {
    console.warn("Failed to fetch quiz data:", err);
  }

  // Enrich Participants with Avatar (Safe)
  let participants = session.participants;
  let participantCount = 0;
  try {
    if (Array.isArray(participants)) {
      participantCount = participants.length;
      const userIds = participants
        .map((p: any) => p.user_id)
        .filter(Boolean);

      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, avatar_url")
          .in("id", userIds);

        const profileMap = new Map(profiles?.map((p) => [p.id, p]));

        participants = participants.map((p: any) => ({
          ...p,
          avatar_url: p.user_id ? profileMap.get(p.user_id)?.avatar_url : null,
        }));
      }
    }
  } catch (err) {
    console.warn("Failed to enrich participants:", err);
  }

  // Calculate Duration
  let durationMinutes = session.total_time_minutes;
  try {
    if (!durationMinutes && session.started_at && session.ended_at) {
      const start = new Date(session.started_at);
      const end = new Date(session.ended_at);
      durationMinutes = Math.round((end.getTime() - start.getTime()) / 60000);
      if (durationMinutes === 0) durationMinutes = 1;
    }
  } catch (err) {
    console.warn("Error calculating duration:", err);
  }

  // Calculate Total Questions
  let totalQuestions = 0;
  try {
    const currentQuestions = session.current_questions as any[];
    totalQuestions = Array.isArray(currentQuestions)
      ? currentQuestions.length
      : 0;
  } catch (err) {
    console.warn("Error calculating questions:", err);
  }

  return {
    ...session,
    host,
    category,
    quiz_title: quizTitle,
    duration_minutes: durationMinutes,
    total_questions: totalQuestions,
    participants,
    participant_count: participantCount,
  } as GameSession;
}
