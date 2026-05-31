export type UserRole = 'admin' | 'partner'
export type SessionType = 'theatre' | 'oncall' | 'icu' | 'clinic' | 'other'
export type SessionStatus = 'pending' | 'confirmed' | 'cancelled'
export type LeaveType = 'annual' | 'study' | 'sick' | 'other'
export type LeaveStatus = 'pending' | 'approved' | 'rejected'

export const SESSION_STATUS_COLOUR: Record<SessionStatus, string> = {
  pending:   '#EAB308', // yellow
  confirmed: '#22C55E', // green
  cancelled: '#EF4444', // red
}

export const LEAVE_COLOUR = '#3B82F6' // blue

export interface Profile {
  id: string
  full_name: string
  grade: string
  colour: string
  role: UserRole
  created_at: string
  updated_at: string
}

export interface Session {
  id: string
  date: string
  title: string
  type: SessionType
  status: SessionStatus
  start_time: string | null
  end_time: string | null
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface RotaAssignment {
  id: string
  session_id: string
  profile_id: string
  created_by: string | null
  created_at: string
}

export interface LeaveRequest {
  id: string
  profile_id: string
  start_date: string
  end_date: string
  type: LeaveType
  status: LeaveStatus
  notes: string | null
  reviewed_by: string | null
  created_at: string
  updated_at: string
}
