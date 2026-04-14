export interface Quiz {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  questions: unknown[] | null;
  is_hidden: boolean | null;
  is_public: boolean | null;
  created_at: string | null;
  language: string | null;
  status: string | null;
  request: boolean | null;

  creator?: {
    id: string | null;
    username: string | null;
    email: string | null;
    fullname: string | null;
    avatar_url: string | null;
  } | null;
}

export interface QuizzesResponse {
  data: Quiz[];
  totalCount: number;
  totalPages: number;
  categories: string[];
}

export interface FetchQuizzesParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  visibility?: string;
  status?: string;
}

export interface QuizSession {
  id: string;
  game_pin: string;
  status: string;
  created_at: string;
  started_at: string | null;
  ended_at: string | null;
  application?: string;
  participants: Array<{
    user_id?: string;
    nickname?: string;
    score?: number;
    started?: string;
    ended?: string;
  }> | null;
}
