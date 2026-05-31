export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import LeaveTable from '@/components/leave/leave-table'
import type { LeaveStatus, LeaveType } from '@/lib/types/database'

type ProfileRef = { id: string; full_name: string; colour: string }

type RawLeave = {
  id: string
  start_date: string
  end_date: string
  type: string
  status: string
  notes: string | null
  profile: ProfileRef | ProfileRef[] | null
}

interface LeaveRow {
  id: string
  start_date: string
  end_date: string
  type: LeaveType
  status: LeaveStatus
  notes: string | null
  profile: ProfileRef
}

function resolveProfile(p: ProfileRef | ProfileRef[] | null): ProfileRef {
  const resolved = Array.isArray(p) ? (p[0] ?? null) : p
  return resolved ?? { id: '', full_name: 'Unknown', colour: '#6B7280' }
}

export default async function LeavePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profileData } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user!.id)
    .single()

  const isAdmin = profileData?.role === 'admin'

  const query = supabase
    .from('leave_requests')
    .select(`
      id, start_date, end_date, type, status, notes,
      profile:profiles!leave_requests_profile_id_fkey ( id, full_name, colour )
    `)
    .order('start_date', { ascending: false })

  // Partners only see their own requests
  if (!isAdmin) query.eq('profile_id', user!.id)

  const { data: raw } = await query

  const requests: LeaveRow[] = (raw as RawLeave[] ?? []).map(r => ({
    id: r.id,
    start_date: r.start_date,
    end_date: r.end_date,
    type: r.type as LeaveType,
    status: r.status as LeaveStatus,
    notes: r.notes,
    profile: resolveProfile(r.profile),
  }))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Leave</h1>
        {isAdmin && (
          <p className="text-sm text-gray-500">
            {requests.filter(r => r.status === 'pending').length} pending approval
          </p>
        )}
      </div>
      <LeaveTable
        requests={requests}
        isAdmin={isAdmin}
        currentUserId={user!.id}
      />
    </div>
  )
}
