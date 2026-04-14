export interface GroupActivity {
  id: string
  type: string
  desc: string
  nama: string
  user: string
  created: string
  meta?: Record<string, any>
}

export interface Group {
  id: string
  name: string
  description?: string | null
  avatar_url?: string | null
  cover_url?: string | null
  creator_id: string
  invite_code: string
  slug?: string | null
  category?: string | null
  members?: Record<string, unknown>[] | null
  settings?: Record<string, unknown> | null
  activities?: GroupActivity[] | null
  created_at?: string | null
  creator?: {
    fullname: string | null
    email: string | null
    avatar_url: string | null
    username: string | null
    state?: { name: string } | null
    city?: { name: string } | null
  } | null
}

export interface GroupsResponse {
  data: Group[]
  totalCount: number
  totalPages: number
}

export interface GroupMember {
  user_id: string
  username: string | null
  fullname: string | null
  avatar_url: string | null
  role: string
  joined_at: string
}

export interface GroupDetail extends Group {
  members_data?: GroupMember[]
  member_count?: number
}

export interface MembersResponse {
  data: GroupMember[]
  totalCount: number
  totalPages: number
}

// Location types
export interface Country {
  id: number
  name: string
  iso2: string
  emoji: string | null
}

export interface State {
  id: number
  name: string
  country_id: number
}

export interface City {
  id: number
  name: string
  state_id: number
}
