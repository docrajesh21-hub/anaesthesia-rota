export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import SessionsTable from '@/components/sessions/sessions-table'
import type { Session, Profile } from '@/lib/types/database'
import type { SessionRow, SessionAssignment } from '@/lib/types/sessions'

type RawAssignment = {
  id: string
  profile: Pick<Profile, 'id' | 'full_name' | 'colour'> | Pick<Profile, 'id' | 'full_name' | 'colour'>[] | null
}

function resolveProfile(
  p: RawAssignment['profile']
): Pick<Profile, 'id' | 'full_name' | 'colour'> | null {
  if (!p) return null
  return Array.isArray(p) ? (p[0] ?? null) : p
}

export default async function SessionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: rawSessions }, { data: partners }, { data: profile }] = await Promise.all([
    supabase
      .from('sessions')
      .select(`
        *,
        rota_assignments (
          id,
          profile:profiles!rota_assignments_profile_id_fkey ( id, full_name, colour )
        )
      `)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true }),

    supabase
      .from('profiles')
      .select('id, full_name, colour')
      .order('full_name'),

    supabase
      .from('profiles')
      .select('role')
      .eq('id', user!.id)
      .single(),
  ])

  const sessions: SessionRow[] = (rawSessions ?? []).map(s => {
    const assignments: SessionAssignment[] = ((s.rota_assignments ?? []) as RawAssignment[])
      .flatMap(a => {
        const p = resolveProfile(a.profile)
        return p ? [{ id: a.id, profile: p }] : []
      })
    return { ...(s as Session), rota_assignments: assignments }
  })

  const isAdmin = profile?.role === 'admin'

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Sessions</h1>
      <SessionsTable
        sessions={sessions}
        partners={(partners ?? []) as Pick<Profile, 'id' | 'full_name' | 'colour'>[]}
        isAdmin={isAdmin}
      />
    </div>
  )
}
