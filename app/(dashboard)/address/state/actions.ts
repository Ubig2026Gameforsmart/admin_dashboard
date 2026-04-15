"use server"

import { getSupabaseServerClient } from "@/lib/supabase-server"

export interface State {
  id: number
  name: string
  native: string | null
  country_id: number | null
  country_code: string | null
  iso2: string | null
  type: string | null
  latitude: number | null
  longitude: number | null
}

export interface StatesResponse {
  data: State[]
  totalCount: number
  totalPages: number
  countries: string[]
}

interface FetchStatesParams {
  page?: number
  limit?: number
  search?: string
  country?: string
}

export async function fetchStates({
  page = 1,
  limit = 15,
  search = "",
  country = "all",
}: FetchStatesParams): Promise<StatesResponse> {
  const supabase = await getSupabaseServerClient()
  const offset = (page - 1) * limit

  let query = supabase
    .from("states")
    .select("id, name, native, country_id, country_code, iso2, type, latitude, longitude", { count: "exact" })

  if (search) {
    query = query.or(`name.ilike.%${search}%,native.ilike.%${search}%,iso2.ilike.%${search}%,type.ilike.%${search}%`)
  }

  if (country && country !== "all") {
    query = query.eq("country_code", country)
  }

  const { data, count, error } = await query
    .order("name", { ascending: true })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error("Error fetching states:", error)
    return { data: [], totalCount: 0, totalPages: 0, countries: [] }
  }

  const { data: allCountries } = await supabase
    .from("states")
    .select("country_code")
    .not("country_code", "is", null)

  const uniqueCountries = [...new Set(allCountries?.map((s) => s.country_code).filter(Boolean) as string[])].sort()

  return {
    data: data ?? [],
    totalCount: count ?? 0,
    totalPages: Math.ceil((count ?? 0) / limit),
    countries: uniqueCountries,
  }
}

export async function fetchStateById(id: number): Promise<State | null> {
  const supabase = await getSupabaseServerClient()

  const { data, error } = await supabase
    .from("states")
    .select("*")
    .eq("id", id)
    .single()

  if (error) {
    console.error("Error fetching state:", error)
    return null
  }

  return data
}
