export interface Profile {
  id: string;
  username?: string | null;
  email?: string | null;
  fullname?: string | null;
  avatar_url?: string | null;
  role?: string | null;
  last_active?: string | null;
  is_blocked?: boolean | null;
  organization?: string | null;
  phone?: string | null;
  address?: string | null;
  birthdate?: string | null;
  following_count?: number;
  followers_count?: number;
  friends_count?: number;
  country_id?: number | null;
  state_id?: number | null;
  city_id?: number | null;
  country?: {
    id: number;
    name: string;
    latitude: number | null;
    longitude: number | null;
  } | null;
  state?: {
    id: number;
    name: string;
    latitude: number | null;
    longitude: number | null;
  } | null;
  city?: {
    id: number;
    name: string;
    latitude: number | null;
    longitude: number | null;
  } | null;
}

export interface UserQuiz {
  id: string;
  title: string;
  play_count: number;
  avg_score: number;
}

export interface CreatedQuiz {
  id: string;
  title: string;
  category: string | null;
  question_count: number;
  created_at: string | null;
}
