// ===== Competition Types =====

export type CompetitionStatus = "draft" | "published" | "completed" | "coming_soon" | "finished";

export interface Competition {
  id: string;
  title: string;
  slug: string;
  status: CompetitionStatus;
  description: string | null;
  rules: string[] | null;
  registration_start_date: string;
  registration_end_date: string;
  qualification_start_date: string | null;
  qualification_end_date: string | null;
  final_start_date: string | null;
  final_end_date: string | null;
  poster_url: string | null;
  category: string | null;
  registration_fee: string | null;
  prize_pool: string | null;
  registration_link: string | null;
  created_at: string;
}

// ===== Tournament Round Types =====

export type RoundStatus = "pending" | "active" | "completed";

export interface CompetitionRound {
  id: string;
  competition_id: string;
  name: string;
  round_order: number;
  status: RoundStatus;
  created_at: string;
  groups?: CompetitionGroup[];
}

// ===== Group Types =====

export interface CompetitionGroup {
  id: string;
  round_id: string;
  name: string;
  quiz_ids: string[] | null;
  created_at: string;
  members?: GroupMember[];
}

// ===== Group Member Types =====

export interface GroupMember {
  id: string;
  group_id: string;
  participant_id: string;
  score: number;
  time_seconds: number;
  is_advanced: boolean;
  created_at: string;
  // Joined or local data
  participant?: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
}

// ===== Dummy Player (for local mockup testing) =====

export interface DummyPlayer {
  id: string;
  name: string;
  avatar: string | null;
  gamesPlayed: number;
  avgScore: number;
  paid: boolean;
  registeredAt: string;
  isFinalist?: boolean;
  category?: string;
}

// ===== Mock Quiz (for local mockup testing) =====

export interface MockQuiz {
  id: string;
  title: string;
  questionCount: number;
  duration: number; // minutes
}

// ===== Competition Phase =====

export type CompetitionPhase =
  | "registration"
  | "payment"
  | "qualification"
  | "group_stage"
  | "completed";

// ===== Mapped Types (for list page) =====

export interface CompetitionListItem {
  id: string;
  title: string;
  slug: string;
  status: CompetitionStatus;
  regStartDate: string;
  regEndDate: string;
  finalEndDate: string | null;
  posterUrl: string | null;
  participantCount: number;
  category: string | null;
}
