export interface GameSession {
  id: string;
  game_pin: string;
  host_id: string;
  quiz_id: string;
  quiz_title: string;
  status: string;
  created_at: string;
  started_at: string | null;
  ended_at: string | null;
  question_limit?: string;
  total_time_minutes?: number;
  participants: Array<{
    user_id?: string;
    nickname?: string;
    score?: number;
    avatar_url?: string;
  }> | null;
  participant_count: number;
  host?: {
    id: string;
    fullname: string;
    username: string;
    avatar_url: string;
  } | null;
  duration_minutes?: number;
  total_questions: number;
  application?: string;
  category?: string;
}
