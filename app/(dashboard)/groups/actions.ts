"use server"

import { getSupabaseAdminClient } from "@/lib/supabase-admin"
import { Group, GroupsResponse, GroupActivity } from "@/types/group"

interface FetchGroupsParams {
  page?: number
  limit?: number
  search?: string
  status?: string
  category?: string
  timeRange?: "this-year" | "last-year" | "all"
  year?: number
}

export async function fetchGroups({
  page = 1,
  limit = 12,
  search = "",
  status = "all",
  category = "",
  timeRange = "all",
  year,
}: FetchGroupsParams): Promise<GroupsResponse> {
  const supabase = getSupabaseAdminClient()
  const offset = (page - 1) * limit

  let query = supabase
    .from("groups")
    .select("*, creator:profiles!groups_creator_id_fkey(fullname, email, avatar_url, username, state:states(name), city:cities(name))", { count: "exact" })
    .is("deleted_at", null)

  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
  }

  if (status && status !== "all") {
    query = query.eq("settings->>status", status)
  }

  if (category) {
    // Map English categories to Indonesian database values for backward compatibility
    const categoryMapping: Record<string, string[]> = {
      "Campus": ["Kampus", "Campus"],
      "Office": ["Kantor", "Office"],
      "Family": ["Keluarga", "Family"],
      "Community": ["Komunitas", "Community"],
      "Mosque": ["Masjid/Musholla", "Masjid", "Musholla", "Mosque"],
      "Islamic Boarding School": ["Pesantren", "Islamic Boarding School"],
      "School": ["Sekolah", "School"],
      "General": ["Umum", "General"],
      "TPA/TPQ": ["TPA/TPQ"],
      "Other": ["Lainnya", "Other"]
    }

    const searchTerms = categoryMapping[category] || [category]
    // Create OR query for all possible terms: category.ilike.term1,category.ilike.term2
    const orQuery = searchTerms.map(term => `category.ilike.%${term}%`).join(",")
    query = query.or(orQuery)
  }

  // Filter by year or timeRange
  if (year) {
    const startOfYear = new Date(year, 0, 1).toISOString()
    const endOfYear = new Date(year + 1, 0, 1).toISOString()
    query = query.gte("created_at", startOfYear).lt("created_at", endOfYear)
  } else if (timeRange !== "all") {
    const now = new Date()
    const currentYear = now.getFullYear()
    
    if (timeRange === "this-year") {
      const startOfYear = new Date(currentYear, 0, 1).toISOString()
      const endOfYear = new Date(currentYear + 1, 0, 1).toISOString()
      query = query.gte("created_at", startOfYear).lt("created_at", endOfYear)
    } else if (timeRange === "last-year") {
      const startOfLastYear = new Date(currentYear - 1, 0, 1).toISOString()
      const endOfLastYear = new Date(currentYear, 0, 1).toISOString()
      query = query.gte("created_at", startOfLastYear).lt("created_at", endOfLastYear)
    }
  }

  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error("Error fetching groups:", error)
    return { data: [], totalCount: 0, totalPages: 0 }
  }

  return {
    data: data ?? [],
    totalCount: count ?? 0,
    totalPages: Math.ceil((count ?? 0) / limit),
  }
}

export async function updateGroupAction(id: string, updates: Partial<Group>) {
  const supabase = getSupabaseAdminClient()

  const { error } = await supabase
    .from("groups")
    .update(updates)
    .eq("id", id)

  if (error) {
    console.error("Error updating group:", error)
    return { error: error.message }
  }

  return { error: null }
}

export async function deleteGroupAction(id: string) {
  const supabase = getSupabaseAdminClient()

  const { error } = await supabase
    .from("groups")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)

  if (error) {
    console.error("Error deleting group:", error)
    return { error: error.message }
  }

  return { error: null }
}

import { GroupMember, GroupDetail, MembersResponse, Country, State, City } from "@/types/group"

export async function fetchGroupById(id: string): Promise<{ data: GroupDetail | null; error: string | null }> {
  const supabase = getSupabaseAdminClient()

  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("*, creator:profiles!groups_creator_id_fkey(fullname, email, avatar_url, username, state:states(name), city:cities(name))")
    .eq("id", id)
    .single()

  if (groupError) {
    console.error("Error fetching group:", groupError)
    return { data: null, error: groupError.message }
  }

  // Members are stored as JSONB array in groups.members field
  const rawMembers = (group.members as GroupMember[]) ?? []
  
  // Enrich members data from profiles if missing
  const userIds = rawMembers.map((m) => m.user_id).filter(Boolean)
  let profilesMap: Record<string, { fullname: string | null; username: string | null; avatar_url: string | null }> = {}
  
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, fullname, username, avatar_url")
      .in("id", userIds)
    
    if (profiles) {
      profilesMap = profiles.reduce((acc, p) => {
        acc[p.id] = { fullname: p.fullname, username: p.username, avatar_url: p.avatar_url }
        return acc
      }, {} as typeof profilesMap)
    }
  }

  const members = rawMembers.map((m) => ({
    ...m,
    fullname: m.fullname || profilesMap[m.user_id]?.fullname || null,
    username: m.username || profilesMap[m.user_id]?.username || null,
    avatar_url: m.avatar_url || profilesMap[m.user_id]?.avatar_url || null,
  }))

  return {
    data: {
      ...group,
      members_data: members,
      member_count: members.length,
    },
    error: null,
  }
}

export interface FetchMembersParams {
  groupId: string
  page?: number
  limit?: number
  search?: string
  role?: string
}

export async function fetchGroupMembers({
  groupId,
  page = 1,
  limit = 10,
  search = "",
  role = "all",
}: FetchMembersParams): Promise<MembersResponse> {
  const supabase = getSupabaseAdminClient()
  const offset = (page - 1) * limit

  // Fetch group with members JSONB
  const { data: group, error } = await supabase
    .from("groups")
    .select("members")
    .eq("id", groupId)
    .single()

  if (error || !group) {
    console.error("Error fetching group members:", error)
    return { data: [], totalCount: 0, totalPages: 0 }
  }

  const rawMembers = (group.members as GroupMember[]) ?? []

  // Enrich members data from profiles if missing
  const userIds = rawMembers.map((m) => m.user_id).filter(Boolean)
  let profilesMap: Record<string, { fullname: string | null; username: string | null; avatar_url: string | null }> = {}
  
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, fullname, username, avatar_url")
      .in("id", userIds)
    
    if (profiles) {
      profilesMap = profiles.reduce((acc, p) => {
        acc[p.id] = { fullname: p.fullname, username: p.username, avatar_url: p.avatar_url }
        return acc
      }, {} as typeof profilesMap)
    }
  }

  let members = rawMembers.map((m) => ({
    ...m,
    fullname: m.fullname || profilesMap[m.user_id]?.fullname || null,
    username: m.username || profilesMap[m.user_id]?.username || null,
    avatar_url: m.avatar_url || profilesMap[m.user_id]?.avatar_url || null,
  }))

  // Filter by role
  if (role && role !== "all") {
    members = members.filter((m) => m.role === role)
  }

  // Filter by search
  if (search) {
    const searchLower = search.toLowerCase()
    members = members.filter((member) =>
      member.fullname?.toLowerCase().includes(searchLower) ||
      member.username?.toLowerCase().includes(searchLower)
    )
  }

  // Sort by joined_at descending
  members.sort((a, b) => {
    const dateA = a.joined_at ? new Date(a.joined_at).getTime() : 0
    const dateB = b.joined_at ? new Date(b.joined_at).getTime() : 0
    return dateB - dateA
  })

  const totalCount = members.length
  const totalPages = Math.ceil(totalCount / limit)

  // Paginate
  const paginatedMembers = members.slice(offset, offset + limit)

  return {
    data: paginatedMembers,
    totalCount,
    totalPages,
  }
}

export async function removeGroupMember(groupId: string, userId: string) {
  const supabase = getSupabaseAdminClient()

  // Fetch current members
  const { data: group, error: fetchError } = await supabase
    .from("groups")
    .select("members")
    .eq("id", groupId)
    .single()

  if (fetchError || !group) {
    console.error("Error fetching group:", fetchError)
    return { error: fetchError?.message || "Group not found" }
  }

  const members = (group.members as GroupMember[]) ?? []
  const updatedMembers = members.filter((m) => m.user_id !== userId)

  const { error } = await supabase
    .from("groups")
    .update({ members: updatedMembers })
    .eq("id", groupId)

  if (error) {
    console.error("Error removing member:", error)
    return { error: error.message }
  }

  return { error: null }
}

export async function updateMemberRole(groupId: string, userId: string, role: string) {
  const supabase = getSupabaseAdminClient()

  // Fetch current members
  const { data: group, error: fetchError } = await supabase
    .from("groups")
    .select("members")
    .eq("id", groupId)
    .single()

  if (fetchError || !group) {
    console.error("Error fetching group:", fetchError)
    return { error: fetchError?.message || "Group not found" }
  }

  const members = (group.members as GroupMember[]) ?? []
  const updatedMembers = members.map((m) =>
    m.user_id === userId ? { ...m, role } : m
  )

  const { error } = await supabase
    .from("groups")
    .update({ members: updatedMembers })
    .eq("id", groupId)

  if (error) {
    console.error("Error updating member role:", error)
    return { error: error.message }
  }

  return { error: null }
}


// Fetch all countries (cached - only 250 rows)
export async function fetchCountries(): Promise<Country[]> {
  const supabase = getSupabaseAdminClient()

  const { data, error } = await supabase
    .from("countries")
    .select("id, name, iso2, emoji")
    .order("name", { ascending: true })

  if (error) {
    console.error("Error fetching countries:", error)
    return []
  }

  return data ?? []
}

// Fetch states by country_id
export async function fetchStatesByCountry(countryId: number): Promise<State[]> {
  const supabase = getSupabaseAdminClient()

  const { data, error } = await supabase
    .from("states")
    .select("id, name, country_id")
    .eq("country_id", countryId)
    .order("name", { ascending: true })

  if (error) {
    console.error("Error fetching states:", error)
    return []
  }

  return data ?? []
}

// Fetch cities by state_id
export async function fetchCitiesByState(stateId: number): Promise<City[]> {
  const supabase = getSupabaseAdminClient()

  const { data, error } = await supabase
    .from("cities")
    .select("id, name, state_id")
    .eq("state_id", stateId)
    .order("name", { ascending: true })

  if (error) {
    console.error("Error fetching cities:", error)
    return []
  }

  return data ?? []
}

// Fetch static categories
export async function fetchGroupCategories(): Promise<string[]> {
  return [
    "Campus",
    "Office",
    "Family",
    "Community",
    "Mosque",
    "Islamic Boarding School",
    "School",
    "TPA/TPQ",
    "General",
    "Other",
  ]
}

export async function getAllGroups() {
  const supabase = getSupabaseAdminClient()
  
  const { data, error } = await supabase
    .from("groups")
    .select("*, creator:profiles!groups_creator_id_fkey(fullname, email, avatar_url, username, state:states(name), city:cities(name))")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(2000)

  if (error) {
    console.error("Error fetching all groups:", error)
    return []
  }

  return data ?? []
}
