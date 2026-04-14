export interface QuizApproval {
  id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  language?: string | null;
  image_url?: string | null;
  cover_image?: string | null;
  questions?: unknown[];
  created_at?: string | null;
  creator?: {
    id: string;
    fullname: string | null;
    username: string | null;
    email: string | null;
    avatar_url: string | null;
  } | null;
}

export interface QuizApprovalResponse {
  data: QuizApproval[];
  totalCount: number;
  totalPages: number;
  categories: string[];
}

export interface FetchQuizApprovalsParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  timeRange?: "this-year" | "last-year" | "all";
  year?: number;
}
