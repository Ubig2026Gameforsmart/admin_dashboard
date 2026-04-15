"use server"

import { getSupabaseServerClient } from "@/lib/supabase-server"

export interface Country {
  id: number
  name: string
  native: string | null
  region: string | null
  subregion: string | null
  iso2: string | null
  iso3: string | null
  phonecode: string | null
  capital: string | null
  currency: string | null
  currency_symbol: string | null
  emoji: string | null
  latitude: number | null
  longitude: number | null
}

export interface CountriesResponse {
  data: Country[]
  totalCount: number
  totalPages: number
  regions: string[]
}

interface FetchCountriesParams {
  page?: number
  limit?: number
  search?: string
  region?: string
}

export async function fetchCountries({
  page = 1,
  limit = 15,
  search = "",
  region = "all",
}: FetchCountriesParams): Promise<CountriesResponse> {
  const supabase = await getSupabaseServerClient()
  const offset = (page - 1) * limit

  let query = supabase
    .from("countries")
    .select("id, name, native, region, subregion, iso2, iso3, phonecode, capital, currency, currency_symbol, emoji, latitude, longitude", { count: "exact" })

  if (search) {
    query = query.or(`name.ilike.%${search}%,native.ilike.%${search}%,iso2.ilike.%${search}%,capital.ilike.%${search}%`)
  }

  if (region && region !== "all") {
    query = query.eq("region", region)
  }

  const { data, count, error } = await query
    .order("name", { ascending: true })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error("Error fetching countries:", error)
    return { data: [], totalCount: 0, totalPages: 0, regions: [] }
  }

  const { data: allRegions } = await supabase
    .from("countries")
    .select("region")
    .not("region", "is", null)

  const uniqueRegions = [...new Set(allRegions?.map((r) => r.region).filter(Boolean) as string[])].sort()

  return {
    data: data ?? [],
    totalCount: count ?? 0,
    totalPages: Math.ceil((count ?? 0) / limit),
    regions: uniqueRegions,
  }
}

export async function fetchCountryById(id: number): Promise<Country | null> {
  const supabase = await getSupabaseServerClient()

  const { data, error } = await supabase
    .from("countries")
    .select("*")
    .eq("id", id)
    .single()

  if (error) {
    console.error("Error fetching country:", error)
    return null
  }

  return data
}
