import { createClient } from '@/lib/supabase/server'
import { SESSION_STATUS_COLOUR, LEAVE_COLOUR } from '@/lib/types/database'

export default async function DashboardPage() {
  const supabase = await createClient()

  const [{ count: sessionCount }, { count: leaveCount }, { count: partnerCount }] =
    await Promise.all([
      supabase.from('sessions').select('*', { count: 'exact', head: true }),
      supabase.from('leave_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
    ])

  const stats = [
    { label: 'Total sessions', value: sessionCount ?? 0, colour: SESSION_STATUS_COLOUR.confirmed },
    { label: 'Pending leave', value: leaveCount ?? 0, colour: LEAVE_COLOUR },
    { label: 'Partners', value: partnerCount ?? 0, colour: '#6366f1' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map(stat => (
          <div key={stat.label} className="bg-white rounded-lg border p-5 flex items-center gap-4">
            <div className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: stat.colour }} />
            <div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg border p-5">
        <h2 className="font-semibold text-gray-700 mb-3">Colour key</h2>
        <div className="flex flex-wrap gap-4 text-sm">
          {Object.entries(SESSION_STATUS_COLOUR).map(([status, colour]) => (
            <div key={status} className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: colour }} />
              <span className="capitalize text-gray-600">{status}</span>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: LEAVE_COLOUR }} />
            <span className="text-gray-600">Leave</span>
          </div>
        </div>
      </div>
    </div>
  )
}
