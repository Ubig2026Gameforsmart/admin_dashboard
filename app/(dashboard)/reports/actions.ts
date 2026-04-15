"use server"

import { getSupabaseServerClient } from "@/lib/supabase-server"
import { revalidatePath } from "next/cache"
import { Report, ReportProfile, ReportsResponse, ReportWithMessages, Message } from "@/types/report"

interface FetchReportsParams {
  page?: number
  limit?: number
  search?: string
  status?: string
  type?: string
}

export async function fetchReports({
  page = 1,
  limit = 15,
  search = "",
  status = "all",
  type = "all",
}: FetchReportsParams): Promise<ReportsResponse> {
  const supabase = await getSupabaseServerClient()
  const offset = (page - 1) * limit

  let query = supabase
    .from("reports")
    .select("*", { count: "exact" })

  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
  }

  if (status && status !== "all") {
    query = query.ilike("status", status)
  }

  if (type && type !== "all") {
    query = query.ilike("report_type", type)
  }

  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error("Error fetching reports:", error)
    return { data: [], totalCount: 0, totalPages: 0, stats: { total: 0, pending: 0, inProgress: 0, resolved: 0 } }
  }

  // Get unique profile IDs from reports
  const reporterIds = [...new Set((data ?? []).map(r => r.reporter_id).filter(Boolean))] as string[]
  const reportedUserIds = [...new Set((data ?? []).map(r => r.reported_user_id).filter(Boolean))] as string[]
  const allProfileIds = [...new Set([...reporterIds, ...reportedUserIds])]

  // Fetch profiles
  let profilesMap: Record<string, ReportProfile> = {}
  if (allProfileIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, email, fullname, avatar_url")
      .in("id", allProfileIds)

    if (profiles) {
      profilesMap = profiles.reduce((acc, p) => {
        acc[p.id] = p
        return acc
      }, {} as Record<string, ReportProfile>)
    }
  }

  // Get stats
  const { data: allReports } = await supabase
    .from("reports")
    .select("status")

  const stats = {
    total: allReports?.length ?? 0,
    pending: allReports?.filter(r => r.status?.toLowerCase() === "pending").length ?? 0,
    inProgress: allReports?.filter(r => r.status?.toLowerCase() === "in progress").length ?? 0,
    resolved: allReports?.filter(r => r.status?.toLowerCase() === "resolved").length ?? 0,
  }

  // Combine reports with profiles
  const processedData: Report[] = (data ?? []).map(report => ({
    ...report,
    reporter: report.reporter_id ? profilesMap[report.reporter_id] || null : null,
    reported_user: report.reported_user_id ? profilesMap[report.reported_user_id] || null : null,
  }))

  return {
    data: processedData,
    totalCount: count ?? 0,
    totalPages: Math.ceil((count ?? 0) / limit),
    stats,
  }
}

export async function updateReportAction(id: string, updates: Record<string, unknown>) {
  const supabase = await getSupabaseServerClient()

  const { error } = await supabase
    .from("reports")
    .update(updates)
    .eq("id", id)

  if (error) {
    console.error("Error updating report:", error)
    return { error: error.message }
  }

  revalidatePath("/reports")
  return { error: null }
}

export async function deleteReportAction(id: string) {
  const supabase = await getSupabaseServerClient()

  const { error } = await supabase
    .from("reports")
    .delete()
    .eq("id", id)

  if (error) {
    console.error("Error deleting report:", error)
    return { error: error.message }
  }

  revalidatePath("/reports")
  return { error: null }
}


export async function fetchReportById(id: string): Promise<{ data: ReportWithMessages | null; error: string | null }> {
  const supabase = await getSupabaseServerClient()

  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .eq("id", id)
    .single()

  if (error) {
    console.error("Error fetching report:", error)
    return { data: null, error: error.message }
  }

  // Fetch profiles for reporter and reported user
  const profileIds = [data.reporter_id, data.reported_user_id].filter(Boolean) as string[]
  let profilesMap: Record<string, ReportProfile> = {}

  if (profileIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, email, fullname, avatar_url")
      .in("id", profileIds)

    if (profiles) {
      profilesMap = profiles.reduce((acc, p) => {
        acc[p.id] = p
        return acc
      }, {} as Record<string, ReportProfile>)
    }
  }

  const reportWithProfiles: ReportWithMessages = {
    ...data,
    messages: data.messages || [],
    reporter: data.reporter_id ? profilesMap[data.reporter_id] || null : null,
    reported_user: data.reported_user_id ? profilesMap[data.reported_user_id] || null : null,
  }

  return { data: reportWithProfiles, error: null }
}

export async function sendMessageAction(reportId: string, content: string, senderType: "admin" | "user" = "admin") {
  const supabase = await getSupabaseServerClient()

  // Fetch current messages
  const { data: report, error: fetchError } = await supabase
    .from("reports")
    .select("messages")
    .eq("id", reportId)
    .single()

  if (fetchError) {
    console.error("Error fetching report messages:", fetchError)
    return { error: fetchError.message }
  }

  const currentMessages: Message[] = report?.messages || []
  const newMessage: Message = {
    id: crypto.randomUUID(),
    sender_id: "admin",
    sender_type: senderType,
    content,
    created_at: new Date().toISOString(),
  }

  const updatedMessages = [...currentMessages, newMessage]

  const { error } = await supabase
    .from("reports")
    .update({ messages: updatedMessages, updated_at: new Date().toISOString() })
    .eq("id", reportId)

  if (error) {
    console.error("Error sending message:", error)
    return { error: error.message }
  }

  revalidatePath(`/reports/${reportId}`)
  return { error: null, message: newMessage }
}

export async function deleteMessageAction(reportId: string, messageId: string, senderType: "admin" | "user") {
  const supabase = await getSupabaseServerClient()

  // Only admin can delete their own messages
  if (senderType !== "admin") {
    return { error: "You can only delete your own messages" }
  }

  // Fetch current messages
  const { data: report, error: fetchError } = await supabase
    .from("reports")
    .select("messages")
    .eq("id", reportId)
    .single()

  if (fetchError) {
    console.error("Error fetching report messages:", fetchError)
    return { error: fetchError.message }
  }

  const currentMessages: Message[] = report?.messages || []
  const messageToDelete = currentMessages.find(m => m.id === messageId)

  // Verify the message belongs to admin
  if (!messageToDelete || messageToDelete.sender_type !== "admin") {
    return { error: "You can only delete your own messages" }
  }

  const updatedMessages = currentMessages.filter(m => m.id !== messageId)

  const { error } = await supabase
    .from("reports")
    .update({ messages: updatedMessages, updated_at: new Date().toISOString() })
    .eq("id", reportId)

  if (error) {
    console.error("Error deleting message:", error)
    return { error: error.message }
  }

  revalidatePath(`/reports/${reportId}`)
  return { error: null }
}

export async function getAllReports() {
  const supabase = await getSupabaseServerClient()
  
  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(2000)

  if (error) {
    console.error("Error fetching all reports:", error)
    return []
  }

  // Optimized parallel fetch for profiles
  const profileIds = new Set<string>()
  data?.forEach(r => {
    if (r.reporter_id) profileIds.add(r.reporter_id)
    if (r.reported_user_id) profileIds.add(r.reported_user_id)
  })

  let profilesMap: Record<string, ReportProfile> = {}
  if (profileIds.size > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, email, fullname, avatar_url")
      .in("id", Array.from(profileIds))
    
    if (profiles) {
      profilesMap = profiles.reduce((acc, p) => {
        acc[p.id] = p
        return acc
      }, {} as Record<string, ReportProfile>)
    }
  }

  const processedData: Report[] = (data ?? []).map(report => ({
    ...report,
    reporter: report.reporter_id ? profilesMap[report.reporter_id] || null : null,
    reported_user: report.reported_user_id ? profilesMap[report.reported_user_id] || null : null,
  }))

  return processedData
}
