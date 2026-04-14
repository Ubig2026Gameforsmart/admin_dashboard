import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { 
  Quiz, 
  QuizzesResponse, 
  FetchQuizzesParams, 
  QuizSession 
} from "@/types/quiz";

export const QuizService = {
  async fetchQuizzes({
    page = 1,
    limit = 15,
    search = "",
    category = "all",
    visibility = "all",
    status = "all",
  }: FetchQuizzesParams): Promise<QuizzesResponse> {
    const supabase = getSupabaseAdminClient();
    const offset = (page - 1) * limit;

    let query = supabase
      .from("quizzes")
      .select(
        "id, title, description, category, questions, is_hidden, is_public, created_at, language, status, request, creator:profiles!creator_id(id, email, username, fullname, avatar_url)",
        { count: "exact" }
      )
      .is("deleted_at", null);

    if (search) {
      query = query.or(`title.ilike.%${search}%,category.ilike.%${search}%`);
    }

    if (category && category !== "all") {
      query = query.eq("category", category);
    }

    if (visibility && visibility !== "all") {
      if (visibility === "publik") {
        query = query.eq("is_public", true);
      } else if (visibility === "private") {
        query = query.eq("is_public", false);
      }
    }

    if (status && status !== "all") {
      if (status === "active") {
        query = query.or("status.is.null,status.neq.block");
      } else if (status === "block") {
        query = query.eq("status", "block");
      }
    }

    const { data, count, error } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching quizzes:", error);
      return { data: [], totalCount: 0, totalPages: 0, categories: [] };
    }

    const { data: allCategories } = await supabase
      .from("quizzes")
      .select("category")
      .is("deleted_at", null)
      .not("category", "is", null);

    const uniqueCategories = [
      ...new Set(allCategories?.map((q) => q.category).filter(Boolean) as string[]),
    ].sort();

    const transformedData: Quiz[] = (data ?? []).map((item: any) => ({
      ...item,
      creator: Array.isArray(item.creator) ? item.creator[0] ?? null : item.creator,
    }));

    return {
      data: transformedData,
      totalCount: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / limit),
      categories: uniqueCategories,
    };
  },

  async fetchQuizById(
    id: string
  ): Promise<{ data: Quiz | null; error: string | null }> {
    const supabase = getSupabaseAdminClient();

    const { data, error } = await supabase
      .from("quizzes")
      .select(
        "id, title, description, category, questions, is_hidden, is_public, created_at, language, status, request, creator:profiles!creator_id(id, email, username, fullname, avatar_url)"
      )
      .eq("id", id)
      .is("deleted_at", null)
      .single();

    if (error) {
      console.error("Error fetching quiz:", error);
      return { data: null, error: error.message };
    }

    const transformedData: Quiz = {
      ...data,
      creator: Array.isArray(data.creator) ? data.creator[0] ?? null : data.creator,
    };

    return { data: transformedData, error: null };
  },

  async getAllQuizzes() {
    const supabase = getSupabaseAdminClient();

    const { data, error } = await supabase
      .from("quizzes")
      .select(
        "id, title, description, category, questions, is_hidden, is_public, created_at, language, status, request, creator:profiles!creator_id(id, email, username, fullname, avatar_url)"
      )
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(5000);

    if (error) {
      console.error("Error fetching all quizzes:", error);
      return [];
    }

    const transformedData: Quiz[] = (data ?? []).map((item: any) => ({
      ...item,
      creator: Array.isArray(item.creator) ? item.creator[0] ?? null : item.creator,
    }));

    return transformedData;
  },

  async updateQuizVisibility(id: string, isPublic: boolean, note?: string) {
    const supabase = getSupabaseAdminClient();

    const { error } = await supabase
      .from("quizzes")
      .update({ is_public: isPublic })
      .eq("id", id);

    if (error) {
      console.error("Error updating quiz:", error);
      return { error: error.message };
    }
    return { error: null };
  },

  async blockQuiz(id: string, note?: string) {
    const supabase = getSupabaseAdminClient();

    const { error } = await supabase
      .from("quizzes")
      .update({ status: "block" })
      .eq("id", id);

    if (error) {
      console.error("Error blocking quiz:", error);
      return { error: error.message };
    }
    return { error: null };
  },

  async unblockQuiz(id: string, note?: string) {
    const supabase = getSupabaseAdminClient();

    const { error } = await supabase
      .from("quizzes")
      .update({ status: null })
      .eq("id", id);

    if (error) {
      console.error("Error unblocking quiz:", error);
      return { error: error.message };
    }
    return { error: null };
  },

  async deleteQuiz(id: string) {
    const supabase = getSupabaseAdminClient();

    const { error } = await supabase
      .from("quizzes")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      console.error("Error deleting quiz:", error);
      return { error: error.message };
    }
    return { error: null };
  },

  async fetchQuizSessions(quizId: string): Promise<QuizSession[]> {
    const supabase = getSupabaseAdminClient();

    const { data, error } = await supabase
      .from("game_sessions")
      .select(
        "id, game_pin, status, created_at, started_at, ended_at, participants, application"
      )
      .eq("quiz_id", quizId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching quiz sessions:", error);
      return [];
    }
    return (data ?? []) as QuizSession[];
  },
};
