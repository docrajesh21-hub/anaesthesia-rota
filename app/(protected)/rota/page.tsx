export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import {
  getCalendarDays, parseYearMonth, parseWeekParam, getWeekDays, toIso,
} from '@/lib/utils/calendar'
import { SESSION_STATUS_COLOUR, LEAVE_COLOUR } from '@/lib/types/database'
import MonthNav from '@/components/rota/month-nav'
import ViewToggle from '@/components/rota/view-toggle'
import PartnerGrid from '@/components/rota/partner-grid'
import CalendarGrid from '@/components/rota/calendar-grid'
import type { SessionStatus, LeaveType } from '@/lib/types/database'

interface PageProps {
  searchParams: { month?: string; week?: string; view?: string }
}

type PartnerRef = { id: string; full_name: string; colour: string } | null

function resolveProfile(p: PartnerRef | PartnerRef[] | null | undefined): PartnerRef {
  if (!p) return null
  return Array.isArray(p) ? (p[0] ?? null) : p
}

export default async function RotaPage({ searchParams }: PageProps) {
  const view = searchParams.view ?? 'partners'
  const supabase = await createClient()

  // ── Partners view ─────────────────────────────────────────────────────────
  if (view === 'partners') {
    const monday = parseWeekParam(searchParams.week)
    const weekDays = getWeekDays(monday)
    const startDate = weekDays[0]
    const endDate = weekDays[6]

    const [{ data: profiles }, { data: rawSessions }, { data: rawLeaves }] = await Promise.all([
      supabase.from('profiles').select('id, full_name, colour').order('full_name'),

      supabase
        .from('sessions')
        .select(`
          id, date, title, status, start_time,
          rota_assignments ( profile_id )
        `)
        .gte('date', startDate)
        .lte('date', endDate),

      supabase
        .from('leave_requests')
        .select('id, profile_id, start_date, end_date, type')
        .lte('start_date', endDate)
        .gte('end_date', startDate)
        .eq('status', 'approved'),
    ])

    const { data: { user } } = await supabase.auth.getUser()
    const { data: currentProfile } = await supabase
      .from('profiles').select('role').eq('id', user!.id).single()

    type SessionCell = { id: string; title: string; status: SessionStatus; start_time: string | null; date: string }
    const unassignedByDate: Record<string, SessionCell[]> = {}

    // Build partner rows
    const partners = (profiles ?? []).map(p => {
      const sessions: Record<string, SessionCell[]> = {}
      const leaves: Record<string, { id: string; type: string }[]> = {}

      for (const s of rawSessions ?? []) {
        const assignments = s.rota_assignments as { profile_id: string }[] ?? []
        if (assignments.some(a => a.profile_id === p.id)) {
          const list = sessions[s.date] ?? []
          list.push({ id: s.id, title: s.title, status: s.status as SessionStatus, start_time: s.start_time, date: s.date })
          sessions[s.date] = list
        }
      }

      for (const l of rawLeaves ?? []) {
        if (l.profile_id !== p.id) continue
        const from = new Date(l.start_date + 'T00:00:00')
        const to = new Date(l.end_date + 'T00:00:00')
        for (const d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
          const iso = toIso(d)
          if (!weekDays.includes(iso)) continue
          const list = leaves[iso] ?? []
          list.push({ id: l.id, type: l.type })
          leaves[iso] = list
        }
      }

      return { ...p, sessions, leaves }
    })

    // Unassigned: sessions with zero assignments this week
    for (const s of rawSessions ?? []) {
      const assignments = s.rota_assignments as { profile_id: string }[] ?? []
      if (assignments.length === 0) {
        const list = unassignedByDate[s.date] ?? []
        list.push({ id: s.id, title: s.title, status: s.status as SessionStatus, start_time: s.start_time, date: s.date })
        unassignedByDate[s.date] = list
      }
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Rota</h1>
          <Suspense><ViewToggle /></Suspense>
        </div>
        <ColourLegend />
        <PartnerGrid
          monday={toIso(monday)}
          partners={partners}
          weekDays={weekDays}
          unassignedByDate={unassignedByDate}
          currentUserId={user!.id}
          currentUserRole={currentProfile?.role ?? 'partner'}
        />
      </div>
    )
  }

  // ── Monthly calendar view ──────────────────────────────────────────────────
  const { year, month } = parseYearMonth(searchParams.month)
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`

  const [{ data: sessions }, { data: leaves }] = await Promise.all([
    supabase
      .from('sessions')
      .select(`
        id, date, title, status, type, start_time,
        rota_assignments (
          id,
          profile:profiles!rota_assignments_profile_id_fkey ( id, full_name, colour )
        )
      `)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('start_time', { ascending: true }),

    supabase
      .from('leave_requests')
      .select(`
        id, start_date, end_date, type,
        profile:profiles!leave_requests_profile_id_fkey ( id, full_name, colour )
      `)
      .lte('start_date', endDate)
      .gte('end_date', startDate)
      .eq('status', 'approved'),
  ])

  const calDays = getCalendarDays(year, month)

  // Build CalendarGrid-shaped data
  const sessionsByDate = new Map<string, typeof sessions>()
  for (const s of sessions ?? []) {
    const list = sessionsByDate.get(s.date) ?? []
    list.push(s)
    sessionsByDate.set(s.date, list)
  }

  const gridDays = calDays.map(day => {
    const daySessions = (sessionsByDate.get(day.iso) ?? []).map(s => ({
      id: s.id,
      title: s.title,
      status: s.status as SessionStatus,
      start_time: s.start_time,
      partners: (s.rota_assignments as { profile: PartnerRef | PartnerRef[] | null }[] ?? []).flatMap(a => {
        const p = resolveProfile(a.profile)
        return p?.full_name ? [{ full_name: p.full_name, colour: p.colour ?? '' }] : []
      }),
    }))

    const dayLeaves = (leaves ?? [])
      .filter(l => day.iso >= l.start_date && day.iso <= l.end_date)
      .map(l => {
        const p = resolveProfile((l as { profile: PartnerRef | PartnerRef[] | null }).profile)
        return { id: l.id, full_name: p?.full_name ?? '', type: l.type as LeaveType }
      })

    return {
      iso: day.iso,
      dayNum: day.date.getDate(),
      isCurrentMonth: day.isCurrentMonth,
      isToday: day.isToday,
      sessions: daySessions,
      leaves: dayLeaves,
    }
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Rota</h1>
        <div className="flex items-center gap-3">
          <Suspense><ViewToggle /></Suspense>
          <MonthNav year={year} month={month} />
        </div>
      </div>
      <ColourLegend />
      <CalendarGrid days={gridDays} />
    </div>
  )
}

function ColourLegend() {
  return (
    <div className="flex flex-wrap gap-3 text-xs">
      {(Object.entries(SESSION_STATUS_COLOUR) as [SessionStatus, string][]).map(([status, hex]) => (
        <span key={status} className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: hex }} />
          <span className="capitalize text-gray-600">{status}</span>
        </span>
      ))}
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: LEAVE_COLOUR }} />
        <span className="text-gray-600">Leave</span>
      </span>
    </div>
  )
}
