"use server";

import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { type Competition } from "@/types/receptionist";

export async function fetchCompetitions(): Promise<{
  data: Competition[];
  error: string | null;
}> {
  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("competitions")
      .select("id, title, slug, status, registration_start_date, registration_end_date, final_end_date, poster_url, category")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("fetchCompetitions error:", error);
      return { data: [], error: error.message };
    }

    return { data: data || [], error: null };
  } catch (err: any) {
    console.error("fetchCompetitions unexpected error:", err);
    return { data: [], error: err.message || "Failed to fetch competitions" };
  }
}
