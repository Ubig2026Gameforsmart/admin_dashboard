export interface Competition {
  id: string;
  title: string;
  slug: string;
  status: string;
  registration_start_date: string;
  registration_end_date: string;
  final_end_date: string | null;
  poster_url: string | null;
  category: string | null;
}
