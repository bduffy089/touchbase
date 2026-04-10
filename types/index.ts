export interface Tag {
  id: number
  name: string
  color: string
}

export interface Contact {
  id: number
  name: string
  email: string | null
  phone: string | null
  company: string | null
  how_met: string | null
  notes: string | null
  cadence_days: number
  created_at: string
  updated_at: string
}

export interface ContactWithStatus extends Contact {
  last_interaction_date: string | null
  days_since: number
  days_overdue: number
  tags: Tag[]
}

export interface Interaction {
  id: number
  contact_id: number
  type: InteractionType
  note: string | null
  date: string
  created_at: string
}

export interface InteractionWithContact extends Interaction {
  contact_name: string
}

export type InteractionType = 'call' | 'text' | 'email' | 'in-person' | 'other'

export interface DashboardData {
  totalContacts: number
  overdueCount: number
  upcomingCount: number
  overdueContacts: ContactWithStatus[]
  upcomingContacts: ContactWithStatus[]
  recentInteractions: InteractionWithContact[]
}

export type AiAction = 'suggest-message' | 'parse-linkedin'

export type MessageChannel = 'linkedin' | 'email' | 'text'

export interface ParsedLinkedInContact {
  name: string
  company: string | null
  notes: string | null
}

export interface AiStatusResponse {
  available: boolean
}
