import { getSupabaseServerClient } from "@/lib/supabase-server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import type { 
  Profile, 
  UserQuiz, 
  CreatedQuiz, 
  UserGameActivity, 
  ProfilesResponse, 
  FetchProfilesParams 
} from "@/types/user";

export const UserService = {
  async fetchProfileById(id: string): Promise<{ data: Profile | null; error: string | null }> {
    const supabase = await getSupabaseServerClient();

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
      return { data: null, error: error.message };
    }

    let following_count = data.following_count ?? data.followings_count ?? 0;
    let followers_count = data.followers_count ?? data.follower_count ?? 0;
    let friends_count = data.friends_count ?? data.friend_count ?? 0;

    if (following_count === 0 && followers_count === 0) {
      const { count: followingCount, error: followingError } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", id);

      if (!followingError && followingCount !== null) {
        following_count = followingCount;
      }

      const { count: followersCount, error: followersError } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", id);

      if (!followersError && followersCount !== null) {
        followers_count = followersCount;
      }
    }

    if (friends_count === 0) {
      const { count: friendsCount, error: friendsError } = await supabase
        .from("friendships")
        .select("*", { count: "exact", head: true })
        .or(`user_id.eq.${id},friend_id.eq.${id}`)
        .eq("status", "accepted");

      if (!friendsError && friendsCount !== null) {
        friends_count = friendsCount;
      }
    }

    let country = null;
    let state = null;
    let city = null;

    if (data.country_id) {
      const { data: countryData } = await supabase
        .from("countries")
        .select("id, name, latitude, longitude")
        .eq("id", data.country_id)
        .single();
      country = countryData;
    }

    if (data.state_id) {
      const { data: stateData } = await supabase
        .from("states")
        .select("id, name, latitude, longitude")
        .eq("id", data.state_id)
        .single();
      state = stateData;
    }

    if (data.city_id) {
      const { data: cityData } = await supabase
        .from("cities")
        .select("id, name, latitude, longitude")
        .eq("id", data.city_id)
        .single();
      city = cityData;
    }

    return {
      data: {
        ...data,
        following_count,
        followers_count,
        friends_count,
        country,
        state,
        city,
      },
      error: null,
    };
  },

  async fetchUserQuizzes(userId: string): Promise<{ data: UserQuiz[]; error: string | null }> {
    const supabase = await getSupabaseServerClient();

    const { data: sessions, error: sessionsError } = await supabase
      .from("game_sessions")
      .select("quiz_id, participants");

    if (sessionsError) {
      console.error("Error fetching game sessions:", sessionsError);
      return { data: [], error: sessionsError.message };
    }

    const quizStats: Record<string, { count: number; totalScore: number }> = {};

    for (const session of sessions ?? []) {
      const participants = session.participants as Array<{ user_id: string; score?: number }> | null;
      if (participants && Array.isArray(participants)) {
        const userParticipant = participants.find((p) => p.user_id === userId);
        if (userParticipant) {
          if (!quizStats[session.quiz_id]) {
            quizStats[session.quiz_id] = { count: 0, totalScore: 0 };
          }
          quizStats[session.quiz_id].count += 1;
          quizStats[session.quiz_id].totalScore += userParticipant.score ?? 0;
        }
      }
    }

    const sortedQuizIds = Object.entries(quizStats)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([quizId]) => quizId);

    if (sortedQuizIds.length === 0) {
      return { data: [], error: null };
    }

    const { data: quizzes, error: quizzesError } = await supabase
      .from("quizzes")
      .select("id, title")
      .in("id", sortedQuizIds);

    if (quizzesError) {
      console.error("Error fetching quizzes:", quizzesError);
      return { data: [], error: quizzesError.message };
    }

    const result: UserQuiz[] = (quizzes ?? [])
      .map((quiz) => {
        const stats = quizStats[quiz.id] || { count: 0, totalScore: 0 };
        return {
          id: quiz.id,
          title: quiz.title,
          play_count: stats.count,
          avg_score: stats.count > 0 ? Math.round(stats.totalScore / stats.count) : 0,
        };
      })
      .sort((a, b) => b.play_count - a.play_count);

    return { data: result, error: null };
  },

  async fetchCreatedQuizzes(userId: string): Promise<{ data: CreatedQuiz[]; error: string | null }> {
    const supabase = await getSupabaseServerClient();

    const { data, error } = await supabase
      .from("quizzes")
      .select("id, title, category, questions, created_at")
      .eq("creator_id", userId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Error fetching created quizzes:", error);
      return { data: [], error: error.message };
    }

    const result: CreatedQuiz[] = (data ?? []).map((quiz) => ({
      id: quiz.id,
      title: quiz.title,
      category: quiz.category,
      question_count: Array.isArray(quiz.questions) ? quiz.questions.length : 0,
      created_at: quiz.created_at,
    }));

    return { data: result, error: null };
  },

  async fetchUserGameActivity(userId: string): Promise<{ data: UserGameActivity; error: string | null }> {
    const supabase = await getSupabaseServerClient();

    // Sessions hosted by this user
    const { data: hostedSessions, error: hostError } = await supabase
      .from("game_sessions")
      .select("id, game_pin, status, application, created_at, participants")
      .eq("host_id", userId)
      .order("created_at", { ascending: false });

    if (hostError) {
      console.error("Error fetching hosted sessions:", hostError);
    }

    // Sessions where user participated
    const { data: allSessions, error: allError } = await supabase
      .from("game_sessions")
      .select("id, participants, application");

    if (allError) {
      console.error("Error fetching all sessions:", allError);
    }

    let totalGamesPlayed = 0;
    const appCounts: Record<string, number> = {};

    for (const session of allSessions ?? []) {
      const participants = session.participants as Array<{ user_id: string }> | null;
      if (participants?.some((p) => p.user_id === userId)) {
        totalGamesPlayed++;
        const app = session.application || "Unknown";
        appCounts[app] = (appCounts[app] || 0) + 1;
      }
    }

    // Also count hosted sessions for app stats
    for (const session of hostedSessions ?? []) {
      const app = session.application || "Unknown";
      if (!appCounts[app]) appCounts[app] = 0;
    }

    const topApplications = Object.entries(appCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    const recentSessions = (hostedSessions ?? []).slice(0, 5).map((s) => ({
      id: s.id,
      game_pin: s.game_pin,
      status: s.status,
      application: s.application,
      created_at: s.created_at,
      participant_count: Array.isArray(s.participants) ? s.participants.length : 0,
    }));

    return {
      data: {
        total_sessions_hosted: hostedSessions?.length ?? 0,
        total_games_played: totalGamesPlayed,
        top_applications: topApplications,
        recent_sessions: recentSessions,
      },
      error: null,
    };
  },

  async fetchProfiles({
    page = 1,
    limit = 15,
    search = "",
    role = "all",
    status = "all",
  }: FetchProfilesParams): Promise<ProfilesResponse> {
    const supabase = getSupabaseAdminClient();
    const offset = (page - 1) * limit;

    let query = supabase
      .from("profiles")
      .select("*, state:states(name), city:cities(name)", { count: "exact" })
      .is("deleted_at", null);

    if (search) {
      query = query.or(`username.ilike.%${search}%,email.ilike.%${search}%,fullname.ilike.%${search}%`);
    }

    if (role && role !== "all") {
      query = query.ilike("role", role);
    }

    if (status && status !== "all") {
      if (status === "blocked") {
        query = query.eq("is_blocked", true);
      } else if (status === "active") {
        query = query.or("is_blocked.is.null,is_blocked.eq.false");
      }
    }

    const { data, count, error } = await query
      .order("last_active", { ascending: false, nullsFirst: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching profiles:", error);
      return { data: [], totalCount: 0, totalPages: 0 };
    }

    return {
      data: data ?? [],
      totalCount: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / limit),
    };
  },

  async updateProfile(id: string, updates: Partial<Profile>) {
    const supabase = getSupabaseAdminClient();

    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", id);

    if (error) {
      console.error("Error updating profile:", error);
      return { error: error.message };
    }

    return { error: null };
  },

  async deleteProfile(id: string) {
    const supabase = getSupabaseAdminClient();

    const { error } = await supabase
      .from("profiles")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      console.error("Error deleting profile:", error);
      return { error: error.message };
    }

    return { error: null };
  },

  async getAllProfiles() {
    const supabase = getSupabaseAdminClient();

    // Fetch up to 5000 profiles for client-side caching
    const { data, error } = await supabase
      .from("profiles")
      .select("*, state:states(name), city:cities(name)")
      .is("deleted_at", null)
      .order("last_active", { ascending: false, nullsFirst: false })
      .limit(5000);

    if (error) {
      console.error("Error fetching all profiles:", error);
      return [];
    }

    return data ?? [];
  },
};
