"use server"

import { getSupabaseServerClient } from "@/lib/supabase-server"
import type { Profile, UserQuiz, CreatedQuiz } from "@/types/profile"

export async function fetchProfileById(id: string): Promise<{ data: Profile | null; error: string | null }> {
  const supabase = await getSupabaseServerClient()

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single()

  if (error) {
    console.error("Error fetching profile:", error)
    return { data: null, error: error.message }
  }

  // Check if counts are stored directly in profiles table
  let following_count = data.following_count ?? data.followings_count ?? 0
  let followers_count = data.followers_count ?? data.follower_count ?? 0
  let friends_count = data.friends_count ?? data.friend_count ?? 0

  // If not in profiles, try relationship tables
  if (following_count === 0 && followers_count === 0) {
    // Try follows table with different column name patterns
    const { count: followingCount, error: followingError } = await supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", id)
    
    if (!followingError && followingCount !== null) {
      following_count = followingCount
    }

    const { count: followersCount, error: followersError } = await supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", id)
    
    if (!followersError && followersCount !== null) {
      followers_count = followersCount
    }
  }

  // Try friendships table if friends_count is still 0
  if (friends_count === 0) {
    const { count: friendsCount, error: friendsError } = await supabase
      .from("friendships")
      .select("*", { count: "exact", head: true })
      .or(`user_id.eq.${id},friend_id.eq.${id}`)
      .eq("status", "accepted")
    
    if (!friendsError && friendsCount !== null) {
      friends_count = friendsCount
    }
  }

  let country = null
  let state = null
  let city = null

  if (data.country_id) {
    const { data: countryData } = await supabase
      .from("countries")
      .select("id, name, latitude, longitude")
      .eq("id", data.country_id)
      .single()
    country = countryData
  }

  if (data.state_id) {
    const { data: stateData } = await supabase
      .from("states")
      .select("id, name, latitude, longitude")
      .eq("id", data.state_id)
      .single()
    state = stateData
  }

  if (data.city_id) {
    const { data: cityData } = await supabase
      .from("cities")
      .select("id, name, latitude, longitude")
      .eq("id", data.city_id)
      .single()
    city = cityData
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
  }
}



export async function fetchUserQuizzes(userId: string): Promise<{ data: UserQuiz[]; error: string | null }> {
  const supabase = await getSupabaseServerClient()

  // Fetch all game_sessions to check if user participated
  const { data: sessions, error: sessionsError } = await supabase
    .from("game_sessions")
    .select("quiz_id, participants")

  if (sessionsError) {
    console.error("Error fetching game sessions:", sessionsError)
    return { data: [], error: sessionsError.message }
  }

  // Filter sessions where user participated, count per quiz, and track scores
  const quizStats: Record<string, { count: number; totalScore: number }> = {}
  
  for (const session of sessions ?? []) {
    const participants = session.participants as Array<{ user_id: string; score?: number }> | null
    if (participants && Array.isArray(participants)) {
      const userParticipant = participants.find(p => p.user_id === userId)
      if (userParticipant) {
        if (!quizStats[session.quiz_id]) {
          quizStats[session.quiz_id] = { count: 0, totalScore: 0 }
        }
        quizStats[session.quiz_id].count += 1
        quizStats[session.quiz_id].totalScore += userParticipant.score ?? 0
      }
    }
  }

  // Get quiz IDs sorted by play count (top 10)
  const sortedQuizIds = Object.entries(quizStats)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)
    .map(([quizId]) => quizId)

  if (sortedQuizIds.length === 0) {
    return { data: [], error: null }
  }

  // Fetch quiz details
  const { data: quizzes, error: quizzesError } = await supabase
    .from("quizzes")
    .select("id, title")
    .in("id", sortedQuizIds)

  if (quizzesError) {
    console.error("Error fetching quizzes:", quizzesError)
    return { data: [], error: quizzesError.message }
  }

  // Map quizzes with play count, avg score and sort by play_count
  const result: UserQuiz[] = (quizzes ?? [])
    .map(quiz => {
      const stats = quizStats[quiz.id] || { count: 0, totalScore: 0 }
      return {
        id: quiz.id,
        title: quiz.title,
        play_count: stats.count,
        avg_score: stats.count > 0 ? Math.round(stats.totalScore / stats.count) : 0
      }
    })
    .sort((a, b) => b.play_count - a.play_count)

  return { data: result, error: null }
}



export async function fetchCreatedQuizzes(userId: string): Promise<{ data: CreatedQuiz[]; error: string | null }> {
  const supabase = await getSupabaseServerClient()

  const { data, error } = await supabase
    .from("quizzes")
    .select("id, title, category, questions, created_at")
    .eq("creator_id", userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(10)

  if (error) {
    console.error("Error fetching created quizzes:", error)
    return { data: [], error: error.message }
  }

  const result: CreatedQuiz[] = (data ?? []).map(quiz => ({
    id: quiz.id,
    title: quiz.title,
    category: quiz.category,
    question_count: Array.isArray(quiz.questions) ? quiz.questions.length : 0,
    created_at: quiz.created_at
  }))

  return { data: result, error: null }
}
