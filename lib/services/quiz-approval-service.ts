import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { getUser } from "@/lib/supabase-server";
import { 
  QuizApproval, 
  QuizApprovalResponse, 
  FetchQuizApprovalsParams 
} from "@/types/quiz-approval";

export const QuizApprovalService = {
  async fetchQuizApprovals({
    page = 1,
    limit = 8,
    search = "",
    category = "all",
    timeRange = "all",
    year,
  }: FetchQuizApprovalsParams): Promise<QuizApprovalResponse> {
    const supabase = getSupabaseAdminClient();
    const offset = (page - 1) * limit;

    let query = supabase
      .from("quizzes")
      .select("*", { count: "exact" })
      .eq("request", true);

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (category && category !== "all") {
      query = query.eq("category", category);
    }

    if (year) {
      const start = `${year}-01-01`;
      const end = `${year}-12-31`;
      query = query.gte("created_at", start).lte("created_at", end);
    } else if (timeRange === "this-year") {
      const y = new Date().getFullYear();
      query = query.gte("created_at", `${y}-01-01`).lte("created_at", `${y}-12-31`);
    } else if (timeRange === "last-year") {
      const y = new Date().getFullYear() - 1;
      query = query.gte("created_at", `${y}-01-01`).lte("created_at", `${y}-12-31`);
    }

    query = query.range(offset, offset + limit - 1).order("created_at", { ascending: false });

    const { data: quizzes, count, error } = await query;

    if (error) {
      console.error("Error fetching quizzes for approval:", error);
      return { data: [], totalCount: 0, totalPages: 0, categories: [] };
    }

    let quizApprovals: QuizApproval[] = [];

    if (quizzes && quizzes.length > 0) {
      const creatorIds = [...new Set(quizzes.map((q) => q.creator_id).filter(Boolean))];

      let profilesMap: Record<string, any> = {};

      if (creatorIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, fullname, username, email, avatar_url")
          .in("id", creatorIds);

        if (profiles) {
          profiles.forEach((p) => {
            profilesMap[p.id] = p;
          });
        }
      }

      quizApprovals = quizzes.map((quiz) => ({
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        category: quiz.category,
        language: quiz.language,
        cover_image: quiz.cover_image || quiz.image_url,
        questions: quiz.questions,
        created_at: quiz.created_at,
        creator: profilesMap[quiz.creator_id] || null,
      }));
    }

    const { data: catData } = await supabase.from("quizzes").select("category");
    const categories = [
      ...new Set(catData?.map((c) => c.category).filter(Boolean) as string[]),
    ].sort();

    return {
      data: quizApprovals,
      totalCount: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
      categories,
    };
  },

  async fetchQuizApprovalById(
    id: string
  ): Promise<{ data: QuizApproval | null; error: string | null }> {
    const supabase = getSupabaseAdminClient();

    const { data: quiz, error } = await supabase
      .from("quizzes")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !quiz) {
      return { data: null, error: error?.message || "Quiz not found" };
    }

    let creator = null;
    if (quiz.creator_id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, fullname, username, email, avatar_url")
        .eq("id", quiz.creator_id)
        .single();
      creator = profile;
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
      creator,
    };

    return { data: result, error: null };
  },

  async approveQuiz(id: string) {
    const supabase = getSupabaseAdminClient();
    let actorId: string | null = null;
    
    try {
      const user = await getUser();
      if (user?.id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("auth_user_id", user.id)
          .single();
        if (profile?.id) actorId = profile.id;
      }
    } catch (e) {
      console.warn("Could not get user profile in approveQuiz");
    }

    try {
      const { data: quiz, error: fetchError } = await supabase
        .from("quizzes")
        .select("title, creator_id")
        .eq("id", id)
        .single();

      if (fetchError || !quiz) return { error: fetchError?.message || "Quiz not found" };

      const { error } = await supabase
        .from("quizzes")
        .update({ request: false, is_public: true })
        .eq("id", id);

      if (error) return { error: error.message };

      if (quiz.creator_id) {
        await supabase.from("notifications").insert({
          user_id: quiz.creator_id,
          actor_id: actorId,
          type: "admin",
          entity_type: "support",
          content: {
            title: "Approval Quiz",
            message: `Your quiz "${quiz.title}" has been published.`,
          },
          is_read: false,
        });
      }

      return { error: null };
    } catch (err: any) {
      return { error: err.message || "Unknown error occurred" };
    }
  },

  async rejectQuiz(id: string, reason?: string) {
    const supabase = getSupabaseAdminClient();
    let actorId: string | null = null;
    
    try {
      const user = await getUser();
      if (user?.id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("auth_user_id", user.id)
          .single();
        if (profile?.id) actorId = profile.id;
      }
    } catch (e) {
      console.warn("Could not get user profile in rejectQuiz");
    }

    try {
      const { data: quiz, error: fetchError } = await supabase
        .from("quizzes")
        .select("title, creator_id")
        .eq("id", id)
        .single();

      if (fetchError || !quiz) return { error: fetchError?.message || "Quiz not found" };

      const { error } = await supabase
        .from("quizzes")
        .update({ request: false })
        .eq("id", id);

      if (error) return { error: error.message };

      if (quiz.creator_id) {
        const defaultReason = "Tidak ada alasan spesifik yang diberikan.";
        await supabase.from("notifications").insert({
          user_id: quiz.creator_id,
          actor_id: actorId,
          type: "admin",
          entity_type: "support",
          content: {
            title: "Approval Quiz",
            message: `Your quiz "${quiz.title}" has been rejected. Reason: ${reason || defaultReason}`,
          },
          is_read: false,
        });
      }

      return { error: null };
    } catch (err: any) {
      return { error: err.message || "Unknown error occurred" };
    }
  },
};
