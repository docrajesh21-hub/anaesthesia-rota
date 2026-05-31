import type { Session, Profile } from './database'

export interface SessionAssignment {
  id: string
  profile: Pick<Profile, 'id' | 'full_name' | 'colour'>
}

export interface SessionRow extends Session {
  rota_assignments: SessionAssignment[]
}
