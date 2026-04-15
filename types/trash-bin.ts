export interface DeletedQuiz {
  id: string;
  title: string;
  category: string | null;
  questions_count: number;
  deleted_at: string;
  creator: {
    fullname: string | null;
    email: string | null;
  } | null;
}

export interface DeletedUser {
  id: string;
  username: string | null;
  fullname: string | null;
  email: string | null;
  avatar_url: string | null;
  role: string | null;
  deleted_at: string;
}

export interface DeletedGroup {
  id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  member_count: number;
  deleted_at: string;
  creator: {
    fullname: string | null;
    email: string | null;
  } | null;
}
