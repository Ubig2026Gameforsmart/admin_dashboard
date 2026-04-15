export interface GameApplication {
  name: string;
  total_sessions: number;
  finished_sessions: number;
  active_sessions: number;
  unique_hosts: number;
  total_players: number;
  first_session: string | null;
  last_session: string | null;
}
