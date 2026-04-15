import { getSupabaseServerClient } from "@/lib/supabase-server";
import { Category } from "@/types/category";

export const CategoryService = {
  async fetchCategories(): Promise<{ data: Category[]; error: string | null }> {
    try {
      const supabase = await getSupabaseServerClient();
      const [{ data: catData, error: catError }, { data: compData, error: compError }] =
        await Promise.all([
          supabase.from("competition_categories").select("*").order("created_at", { ascending: false }),
          supabase.from("competitions").select("category"),
        ]);

      if (catError) throw new Error(catError.message);
      if (compError) throw new Error(compError.message);

      const comps = compData || [];
      const formattedCategories = (catData || []).map((cat) => {
        let count = 0;
        comps.forEach((c) => {
          if (c.category) {
            const usedCats = c.category.split(",").map((s: string) => s.trim().toLowerCase());
            if (usedCats.includes(cat.name.toLowerCase())) {
              count++;
            }
          }
        });

        return {
          ...cat,
          competitions_count: count,
        };
      });

      return { data: formattedCategories, error: null };
    } catch (err: any) {
      console.error("Error fetching categories:", err);
      return { data: [], error: err.message || "Failed to load categories" };
    }
  },

  async createCategory(payload: { name: string; status: string }) {
    try {
      const supabase = await getSupabaseServerClient();
      const { error } = await supabase.from("competition_categories").insert([
        {
          name: payload.name.trim(),
          status: payload.status,
        },
      ]);
      if (error) throw error;
      return { error: null };
    } catch (err: any) {
      return { error: err.message };
    }
  },

  async updateCategory(id: string, payload: { name: string; status: string }) {
    try {
      const supabase = await getSupabaseServerClient();
      const { error } = await supabase
        .from("competition_categories")
        .update({
          name: payload.name.trim(),
          status: payload.status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
      return { error: null };
    } catch (err: any) {
      return { error: err.message };
    }
  },

  async toggleStatus(id: string, currentStatus: string) {
    try {
      const supabase = await getSupabaseServerClient();
      const newStatus = currentStatus === "active" ? "inactive" : "active";
      const { error } = await supabase
        .from("competition_categories")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      return { error: null, newStatus };
    } catch (err: any) {
      return { error: err.message, newStatus: currentStatus };
    }
  },
};
