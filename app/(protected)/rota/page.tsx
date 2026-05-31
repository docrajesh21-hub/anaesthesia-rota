import { createClient } from '@/lib/supabase/server'
import { getCalendarDays, parseYearMonth } from '@/lib/utils/calendar'
import { SESSION_STATUS_COLOUR, LEAVE_COLOUR } from '@/lib/types/database'
import MonthNav from '@/components/rota/month-nav'
import SessionChip from '@/components/rota/session-chip'
import LeaveChip from '@/components/rota/leave-chip'
import type { SessionStatus, LeaveType } from '@/lib/types/database'

type PartnerRef = { id: string; full_name: string; colour: string } | null
type AssignmentRow = { id: string; profile: PartnerRef | PartnerRef[] }
type LeaveRow = {
  id: string; start_date: string; end_date: string; type: string
  profile: PartnerRef | PartnerRef[]
}

function resolveProfile(p: PartnerRef | PartnerRef[] | null | undefined): PartnerRef {
  if (!p) return null
  return Array.isArray(p) ? (p[0] ?? null) : p
}

const DAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

interface PageProps {
  searchParams: { month?: string }
}

export default async function RotaPage({ searchParams }: PageProps) {
  const { year, month } = parseYearMonth(searchParams.month)

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`

  const supabase = await createClient()

  const [{ data: sessions }, { data: leaves }] = await Promise.all([
    supabase
      .from('sessions')
      .select(`
        id, date, title, status, type, start_time,
        rota_assignments (
          id,
          profile:profiles ( id, full_name, colour )
        )
      `)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('start_time', { ascending: true }),

    supabase
      .from('leave_requests')
      .select(`
        id, start_date, end_date, type,
        profile:profiles ( id, full_name, colour )
      `)
      .lte('start_date', endDate)
      .gte('end_date', startDate)
      .eq('status', 'approved'),
  ])

  // Index sessions and leave by ISO date for O(1) lookup
  const sessionsByDate = new Map<string, typeof sessions>()
  for (const s of sessions ?? []) {
    const list = sessionsByDate.get(s.date) ?? []
    list.push(s)
    sessionsByDate.set(s.date, list)
  }

  const leaveByDate = new Map<string, typeof leaves>()
  for (const l of leaves ?? []) {
    const start = new Date(l.start_date)
    const end = new Date(l.end_date)
    for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const iso = d.toISOString().slice(0, 10)
      const list = leaveByDate.get(iso) ?? []
      list.push(l)
      leaveByDate.set(iso, list)
    }
  }

  const days = getCalendarDays(year, month)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Rota</h1>
        <MonthNav year={year} month={month} />
      </div>

      {/* Colour legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        {(Object.entries(SESSION_STATUS_COLOUR) as [SessionStatus, string][]).map(([status, colour]) => (
          <span key={status} className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colour }} />
            <span className="capitalize text-gray-600">{status}</span>
          </span>
        ))}
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: LEAVE_COLOUR }} />
          <span className="text-gray-600">Leave</span>
        </span>
      </div>

      {/* Calendar grid */}
      <div className="bg-white rounded-lg border overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b">
          {DAY_HEADERS.map(d => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {d}
            </div>
          ))}
        </div>

        {/* Weeks */}
        <div className="grid grid-cols-7 divide-x divide-y">
          {days.map(day => {
            const daySessions = sessionsByDate.get(day.iso) ?? []
            const dayLeaves = leaveByDate.get(day.iso) ?? []

            return (
              <div
                key={day.iso}
                className={[
                  'min-h-[100px] p-1.5',
                  day.isCurrentMonth ? 'bg-white' : 'bg-gray-50',
                  day.isToday ? 'ring-2 ring-inset ring-blue-400' : '',
                ].join(' ')}
              >
                <p className={[
                  'text-xs font-medium mb-1 text-right',
                  day.isToday ? 'text-blue-600' : day.isCurrentMonth ? 'text-gray-700' : 'text-gray-400',
                ].join(' ')}>
                  {day.date.getDate()}
                </p>

                {daySessions.map(s => (
                  <SessionChip
                    key={s.id}
                    title={s.title}
                    status={s.status as SessionStatus}
                    partners={(s.rota_assignments as AssignmentRow[] ?? []).flatMap(a => {
                      const p = resolveProfile(a.profile)
                      return p?.full_name ? [{ full_name: p.full_name, colour: p.colour }] : []
                    })}
                  />
                ))}

                {(dayLeaves as LeaveRow[]).map(l => {
                  const p = resolveProfile(l.profile)
                  return (
                    <LeaveChip
                      key={l.id + day.iso}
                      fullName={p?.full_name ?? ''}
                      type={l.type as LeaveType}
                    />
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
