"use server"

import { getSupabaseAdminClient } from "@/lib/supabase-admin"
import { revalidatePath } from "next/cache"
import type { DeletedQuiz, DeletedUser, DeletedGroup } from "@/types/trash-bin"

// Fetch deleted quizzes
export async function fetchDeletedQuizzes(): Promise<DeletedQuiz[]> {
  const supabase = getSupabaseAdminClient()

  const { data, error } = await supabase
    .from("quizzes")
    .select("id, title, category, questions, deleted_at, creator:profiles!creator_id(fullname, email)")
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false })

  if (error) {
    console.error("Error fetching deleted quizzes:", error)
    return []
  }

  return (data ?? []).map((quiz) => ({
    id: quiz.id,
    title: quiz.title,
    category: quiz.category,
    questions_count: Array.isArray(quiz.questions) ? quiz.questions.length : 0,
    deleted_at: quiz.deleted_at,
    creator: Array.isArray(quiz.creator) ? quiz.creator[0] : quiz.creator,
  }))
}

// Fetch deleted users
export async function fetchDeletedUsers(): Promise<DeletedUser[]> {
  const supabase = getSupabaseAdminClient()

  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, fullname, email, avatar_url, role, deleted_at")
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false })

  if (error) {
    console.error("Error fetching deleted users:", error)
    return []
  }

  return data ?? []
}

// Fetch deleted groups
export async function fetchDeletedGroups(): Promise<DeletedGroup[]> {
  const supabase = getSupabaseAdminClient()

  const { data, error } = await supabase
    .from("groups")
    .select("id, name, description, avatar_url, members, deleted_at, creator:profiles!groups_creator_id_fkey(fullname, email)")
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false })

  if (error) {
    console.error("Error fetching deleted groups:", error)
    return []
  }

  return (data ?? []).map((group) => ({
    id: group.id,
    name: group.name,
    description: group.description,
    avatar_url: group.avatar_url,
    member_count: Array.isArray(group.members) ? group.members.length : 0,
    deleted_at: group.deleted_at,
    creator: Array.isArray(group.creator) ? group.creator[0] : group.creator,
  }))
}

// Restore quiz
export async function restoreQuizAction(id: string) {
  const supabase = getSupabaseAdminClient()

  const { error } = await supabase
    .from("quizzes")
    .update({ deleted_at: null })
    .eq("id", id)

  if (error) {
    console.error("Error restoring quiz:", error)
    return { error: error.message }
  }

  revalidatePath("/trash-bin")
  revalidatePath("/master/quiz")
  return { error: null }
}

// Restore user
export async function restoreUserAction(id: string) {
  const supabase = getSupabaseAdminClient()

  const { error } = await supabase
    .from("profiles")
    .update({ deleted_at: null })
    .eq("id", id)

  if (error) {
    console.error("Error restoring user:", error)
    return { error: error.message }
  }

  revalidatePath("/trash-bin")
  revalidatePath("/administrator/user")
  return { error: null }
}

// Restore group
export async function restoreGroupAction(id: string) {
  const supabase = getSupabaseAdminClient()

  const { error } = await supabase
    .from("groups")
    .update({ deleted_at: null })
    .eq("id", id)

  if (error) {
    console.error("Error restoring group:", error)
    return { error: error.message }
  }

  revalidatePath("/trash-bin")
  revalidatePath("/groups")
  return { error: null }
}

// Permanent delete quiz
export async function permanentDeleteQuizAction(id: string) {
  const supabase = getSupabaseAdminClient()

  const { error } = await supabase
    .from("quizzes")
    .delete()
    .eq("id", id)

  if (error) {
    console.error("Error permanently deleting quiz:", error)
    return { error: error.message }
  }

  revalidatePath("/trash-bin")
  return { error: null }
}

// Permanent delete user
export async function permanentDeleteUserAction(id: string) {
  const supabase = getSupabaseAdminClient()

  const { error } = await supabase
    .from("profiles")
    .delete()
    .eq("id", id)

  if (error) {
    console.error("Error permanently deleting user:", error)
    return { error: error.message }
  }

  revalidatePath("/trash-bin")
  return { error: null }
}

// Permanent delete group
export async function permanentDeleteGroupAction(id: string) {
  const supabase = getSupabaseAdminClient()

  const { error } = await supabase
    .from("groups")
    .delete()
    .eq("id", id)

  if (error) {
    console.error("Error permanently deleting group:", error)
    return { error: error.message }
  }

  revalidatePath("/trash-bin")
  return { error: null }
}

// Soft delete quiz (move to trash)
export async function softDeleteQuizAction(id: string) {
  const supabase = getSupabaseAdminClient()

  const { error } = await supabase
    .from("quizzes")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)

  if (error) {
    console.error("Error soft deleting quiz:", error)
    return { error: error.message }
  }

  revalidatePath("/master/quiz")
  revalidatePath("/trash-bin")
  return { error: null }
}

// Soft delete user (move to trash)
export async function softDeleteUserAction(id: string) {
  const supabase = getSupabaseAdminClient()

  const { error } = await supabase
    .from("profiles")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)

  if (error) {
    console.error("Error soft deleting user:", error)
    return { error: error.message }
  }

  revalidatePath("/administrator/user")
  revalidatePath("/trash-bin")
  return { error: null }
}

// Soft delete group (move to trash)
export async function softDeleteGroupAction(id: string) {
  const supabase = getSupabaseAdminClient()

  const { error } = await supabase
    .from("groups")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)

  if (error) {
    console.error("Error soft deleting group:", error)
    return { error: error.message }
  }

  revalidatePath("/groups")
  revalidatePath("/trash-bin")
  return { error: null }
}
