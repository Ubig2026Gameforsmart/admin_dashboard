"use server"

import { getSupabaseServerClient } from "@/lib/supabase-server"

export interface City {
  id: number
  name: string
  native: string | null
  state_id: number | null
  state_code: string | null
  country_id: number | null
  country_code: string | null
  latitude: number | null
  longitude: number | null
}

export interface CitiesResponse {
  data: City[]
  totalCount: number
  totalPages: number
  countries: string[]
  states: string[]
}

interface FetchCitiesParams {
  page?: number
  limit?: number
  search?: string
  country?: string
  state?: string
}

export async function fetchCities({
  page = 1,
  limit = 15,
  search = "",
  country = "all",
  state = "all",
}: FetchCitiesParams): Promise<CitiesResponse> {
  const supabase = await getSupabaseServerClient()
  const offset = (page - 1) * limit

  let query = supabase
    .from("cities")
    .select("id, name, native, state_id, state_code, country_id, country_code, latitude, longitude", { count: "exact" })

  if (search) {
    query = query.or(`name.ilike.%${search}%,native.ilike.%${search}%,state_code.ilike.%${search}%`)
  }

  if (country && country !== "all") {
    query = query.eq("country_code", country)
  }

  if (state && state !== "all") {
    query = query.eq("state_code", state)
  }

  const { data, count, error } = await query
    .order("name", { ascending: true })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error("Error fetching cities:", error)
    return { data: [], totalCount: 0, totalPages: 0, countries: [], states: [] }
  }

  // Optimized: Fetch countries from the 'countries' table instead of 'cities'
  // This ensures we get ALL countries, not just those in the current 'cities' page/limit
  const { data: allCountries } = await supabase
    .from("countries")
    .select("iso2")
    .order("iso2", { ascending: true })

  const uniqueCountries = [
    ...new Set(allCountries?.map((c) => c.iso2).filter(Boolean) as string[]),
  ]

  // Optimized: Fetch states from 'states' table
  // Filter by country if selected
  let statesQuery = supabase
    .from("states")
    .select("iso2")
    .not("iso2", "is", null)

  if (country && country !== "all") {
    statesQuery = statesQuery.eq("country_code", country)
  }

  const { data: allStates } = await statesQuery.order("iso2", { ascending: true })

  const uniqueStates = [
    ...new Set(allStates?.map((s) => s.iso2).filter(Boolean) as string[]),
  ]

  return {
    data: data ?? [],
    totalCount: count ?? 0,
    totalPages: Math.ceil((count ?? 0) / limit),
    countries: uniqueCountries,
    states: uniqueStates,
  }
}

export async function fetchCityById(id: number): Promise<City | null> {
  const supabase = await getSupabaseServerClient()

  const { data, error } = await supabase
    .from("cities")
    .select("*")
    .eq("id", id)
    .single()

  if (error) {
    console.error("Error fetching city:", error)
    return null
  }

  return data
}
