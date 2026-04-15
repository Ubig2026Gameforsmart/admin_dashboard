export interface StaleSession {
    id: string;
    game_pin: string;
    quiz_title: string;
    host_name: string;
    host_id: string;
    created_at: string;
    waiting_duration_minutes: number;
    participant_count: number;
    application: string;
    avatar_url?: string;
}
