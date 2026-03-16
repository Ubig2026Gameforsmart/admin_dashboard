"use server"

import { getSupabaseAdminClient } from "@/lib/supabase-admin"
import { getUser } from "@/lib/supabase-server"
import { revalidatePath } from "next/cache"

export interface QuizApproval {
  id: string
  title: string
  description?: string | null
  category?: string | null
  language?: string | null
  image_url?: string | null
  cover_image?: string | null
  questions?: unknown[]
  created_at?: string | null
  creator?: {
    id: string
    fullname: string | null
    username: string | null
    email: string | null
    avatar_url: string | null
  } | null
}

export interface QuizApprovalResponse {
  data: QuizApproval[]
  totalCount: number
  totalPages: number
  categories: string[]
}

interface FetchQuizApprovalsParams {
  page?: number
  limit?: number
  search?: string
  category?: string
  timeRange?: "this-year" | "last-year" | "all"
  year?: number
}

export async function fetchQuizApprovals({
  page = 1,
  limit = 8,
  search = "",
  category = "all",
  timeRange = "all",
  year,
}: FetchQuizApprovalsParams): Promise<QuizApprovalResponse> {
  const supabase = getSupabaseAdminClient()
  const offset = (page - 1) * limit

  // 1. Fetch Quizzes
  let query = supabase
    .from("quizzes")
    .select("*", { count: "exact" })
    .eq("request", true)

  // Search (Title or Description)
  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
  }

  // Filter by Category
  if (category && category !== "all") {
    query = query.eq("category", category)
  }

  // Filter by Time
  if (year) {
    const start = `${year}-01-01`
    const end = `${year}-12-31`
    query = query.gte("created_at", start).lte("created_at", end)
  } else if (timeRange === "this-year") {
    const y = new Date().getFullYear();
    query = query.gte("created_at", `${y}-01-01`).lte("created_at", `${y}-12-31`)
  } else if (timeRange === "last-year") {
    const y = new Date().getFullYear() - 1;
    query = query.gte("created_at", `${y}-01-01`).lte("created_at", `${y}-12-31`)
  }

  // Pagination
  query = query.range(offset, offset + limit - 1).order("created_at", { ascending: false })

  const { data: quizzes, count, error } = await query

  if (error) {
    console.error("Error fetching quizzes for approval:", error)
    return { data: [], totalCount: 0, totalPages: 0, categories: [] }
  }

  // 2. Fetch Creators (Profiles)
  let quizApprovals: QuizApproval[] = []

  if (quizzes && quizzes.length > 0) {
    const creatorIds = [...new Set(quizzes.map((q) => q.creator_id).filter(Boolean))]

    let profilesMap: Record<string, any> = {}

    if (creatorIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, fullname, username, email, avatar_url")
        .in("id", creatorIds)

      if (profiles) {
        profiles.forEach(p => {
          profilesMap[p.id] = p
        })
      }
    }

    // 3. Map Data
    quizApprovals = quizzes.map((quiz) => ({
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      category: quiz.category,
      language: quiz.language,
      cover_image: quiz.cover_image || quiz.image_url, // Handle legacy image fields
      questions: quiz.questions,
      created_at: quiz.created_at,
      creator: profilesMap[quiz.creator_id] || null
    }))
  }

  // 4. Fetch distinct categories (Optimized: separate query or hardcoded list usually better)
  // For now, we reuse the existing strategy but query DB
  // To avoid heavy query, we'll return empty or common categories if not critical,
  // Or fetch distinct categories from DB.
  // Let's do a quick distinct query
  const { data: catData } = await supabase.from("quizzes").select("category")
  const categories = [...new Set(catData?.map(c => c.category).filter(Boolean) as string[])].sort()

  return {
    data: quizApprovals,
    totalCount: count || 0,
    totalPages: Math.ceil((count || 0) / limit),
    categories,
  }
}

export async function fetchQuizApprovalById(id: string): Promise<{ data: QuizApproval | null; error: string | null }> {
  const supabase = getSupabaseAdminClient()

  const { data: quiz, error } = await supabase
    .from("quizzes")
    .select("*")
    .eq("id", id)
    .single()

  if (error || !quiz) {
    return { data: null, error: error?.message || "Quiz not found" }
  }

  let creator = null
  if (quiz.creator_id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, fullname, username, email, avatar_url")
      .eq("id", quiz.creator_id)
      .single()
    creator = profile
  }

  const result: QuizApproval = {
    id: quiz.id,
    title: quiz.title,
    description: quiz.description,
    category: quiz.category,
    language: quiz.language,
    cover_image: quiz.cover_image || quiz.image_url,
    questions: quiz.questions,
    created_at: quiz.created_at,
    creator
  }

  return { data: result, error: null }
}

export async function approveQuizAction(id: string) {
  const supabase = getSupabaseAdminClient()

  // Try to get admin user profile ID (profiles.id uses XID, not Auth UUID)
  let actorId: string | null = null
  try {
    const user = await getUser()
    if (user?.id) {
      // Lookup profile XID from auth_user_id (UUID)
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("auth_user_id", user.id)
        .single()
      if (profile?.id) actorId = profile.id
    }
  } catch (e) {
    console.warn("Could not get user profile in approveQuizAction")
  }

  try {
    // 1. Fetch quiz to get creator_id and title
    const { data: quiz, error: fetchError } = await supabase
      .from("quizzes")
      .select("title, creator_id")
      .eq("id", id)
      .single()

    if (fetchError || !quiz) {
      console.error("Error fetching quiz for approval:", fetchError)
      return { error: fetchError?.message || "Quiz not found" }
    }

    // 2. Approve: request = false, is_public = true
    const { error } = await supabase
      .from("quizzes")
      .update({ request: false, is_public: true })
      .eq("id", id)

    if (error) {
      console.error("Error approving quiz:", error)
      return { error: error.message }
    }

    // 3. Send Notification to creator
    if (quiz.creator_id) {
      console.log("Inserting approve notification for creator:", quiz.creator_id, "actor:", actorId)
      const { error: notifyError } = await supabase.from("notifications").insert({
        user_id: quiz.creator_id,
        actor_id: actorId,
        type: "admin",
        entity_type: "support",
        entity_id: null,
        content: {
          title: "Approval Quiz",
          message: `Your quiz "${quiz.title}" has been published.`,
        },
        is_read: false
      })

      if (notifyError) {
        console.error("Error inserting approve notification:", notifyError)
      } else {
        console.log("Approve notification inserted successfully")
      }
    }

    revalidatePath("/quiz-approval")
    return { error: null }
  } catch (err: any) {
    console.error("Exception in approveQuizAction:", err)
    return { error: err.message || "Unknown error occurred" }
  }
}

export async function rejectQuizAction(id: string, reason?: string) {
  const supabase = getSupabaseAdminClient()

  // Try to get admin user profile ID (profiles.id uses XID, not Auth UUID)
  let actorId: string | null = null
  try {
    const user = await getUser()
    if (user?.id) {
      // Lookup profile XID from auth_user_id (UUID)
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("auth_user_id", user.id)
        .single()
      if (profile?.id) actorId = profile.id
    }
  } catch (e) {
    console.warn("Could not get user profile in rejectQuizAction")
  }

  try {
    // 1. Fetch quiz to get creator_id and title
    const { data: quiz, error: fetchError } = await supabase
      .from("quizzes")
      .select("title, creator_id")
      .eq("id", id)
      .single()

    if (fetchError || !quiz) {
      console.error("Error fetching quiz for rejection:", fetchError)
      return { error: fetchError?.message || "Quiz not found" }
    }

    // 2. Reject: request = false (removed from pending list)
    const { error } = await supabase
      .from("quizzes")
      .update({ request: false })
      .eq("id", id)

    if (error) {
      console.error("Error rejecting quiz:", error)
      return { error: error.message }
    }

    // 3. Send Notification to creator
    if (quiz.creator_id) {
      const defaultReason = "Tidak ada alasan spesifik yang diberikan.";
      console.log("Inserting reject notification for creator:", quiz.creator_id, "actor:", actorId)
      const { error: notifyError } = await supabase.from("notifications").insert({
        user_id: quiz.creator_id,
        actor_id: actorId,
        type: "admin",
        entity_type: "support",
        entity_id: null,
        content: {
          title: "Approval Quiz",
          message: `Your quiz "${quiz.title}" has been rejected. Reason: ${reason || defaultReason}`,
        },
        is_read: false
      })

      if (notifyError) {
        console.error("Error inserting reject notification:", notifyError)
      } else {
        console.log("Reject notification inserted successfully")
      }
    }

    revalidatePath("/quiz-approval")
    return { error: null }
  } catch (err: any) {
    console.error("Exception in rejectQuizAction:", err)
    return { error: err.message || "Unknown error occurred" }
  }
}
