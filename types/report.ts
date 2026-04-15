export interface ReportProfile {
  id: string
  username: string | null
  email: string | null
  fullname: string | null
  avatar_url: string | null
}

export interface Report {
  id: string
  report_type: string | null
  reported_content_type: string | null
  reported_content_id: string | null
  reporter_id: string | null
  reported_user_id: string | null
  status: string | null
  priority?: string | null
  created_at: string | null
  updated_at?: string | null
  title: string | null
  description: string | null
  admin_notes?: string | null
  evidence_url?: string | null
  resolved_at?: string | null
  resolved_by?: string | null
  reporter?: ReportProfile | null
  reported_user?: ReportProfile | null
}

export interface ReportsResponse {
  data: Report[]
  totalCount: number
  totalPages: number
  stats: {
    total: number
    pending: number
    inProgress: number
    resolved: number
  }
}

export interface Message {
  id: string
  sender_id: string
  sender_type: "admin" | "user"
  content: string
  created_at: string
}

export interface ReportWithMessages extends Report {
  messages: Message[] | null
}
