'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { SESSION_STATUS_COLOUR } from '@/lib/types/database'
import type { SessionStatus, SessionType } from '@/lib/types/database'

interface SessionDetail {
  id: string
  title: string
  date: string
  type: SessionType
  status: SessionStatus
  start_time: string | null
  end_time: string | null
  notes: string | null
  rota_assignments: {
    id: string
    profile: { id: string; full_name: string; colour: string } | null
  }[]
}

interface Props {
  sessionId: string | null
  onClose: () => void
}

const TYPE_LABELS: Record<SessionType, string> = {
  theatre: 'Theatre',
  oncall:  'On-Call',
  icu:     'ICU',
  clinic:  'Clinic',
  other:   'Other',
}

const STATUS_LABELS: Record<SessionStatus, string> = {
  pending:   'Pending',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
}

function fmt(time: string) {
  const [h, m] = time.split(':').map(Number)
  const ampm = h < 12 ? 'AM' : 'PM'
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
}

export default function SessionDetailDialog({ sessionId, onClose }: Props) {
  const [session, setSession] = useState<SessionDetail | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!sessionId) { setSession(null); return }
    setLoading(true)
    const supabase = createClient()
    supabase
      .from('sessions')
      .select(`
        id, title, date, type, status, start_time, end_time, notes,
        rota_assignments (
          id,
          profile:profiles!rota_assignments_profile_id_fkey ( id, full_name, colour )
        )
      `)
      .eq('id', sessionId)
      .single()
      .then(({ data }) => {
        setSession(data as SessionDetail | null)
        setLoading(false)
      })
  }, [sessionId])

  const statusColour = session ? SESSION_STATUS_COLOUR[session.status] : '#6B7280'

  const partners = (session?.rota_assignments ?? []).flatMap(a => {
    const p = Array.isArray(a.profile) ? a.profile[0] : a.profile
    return p ? [p] : []
  })

  return (
    <Dialog open={!!sessionId} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        {loading && (
          <div className="py-8 text-center text-sm text-gray-400">Loading…</div>
        )}

        {!loading && session && (
          <>
            <DialogHeader>
              <div className="flex items-start gap-3">
                <span
                  className="mt-1 inline-block h-3 w-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: statusColour }}
                />
                <DialogTitle className="text-lg leading-snug">{session.title}</DialogTitle>
              </div>
            </DialogHeader>

            <div className="space-y-4 pt-1">
              {/* Date + time */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">
                  {new Date(session.date + 'T00:00:00').toLocaleDateString('en-GB', {
                    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </span>
                {session.start_time && (
                  <span className="text-gray-700 font-medium">
                    {fmt(session.start_time)}
                    {session.end_time && ` – ${fmt(session.end_time)}`}
                  </span>
                )}
              </div>

              {/* Type + Status chips */}
              <div className="flex gap-2">
                <span className="rounded-full bg-gray-100 text-gray-700 text-xs font-medium px-3 py-1">
                  {TYPE_LABELS[session.type]}
                </span>
                <span
                  className="rounded-full text-white text-xs font-medium px-3 py-1"
                  style={{ backgroundColor: statusColour }}
                >
                  {STATUS_LABELS[session.status]}
                </span>
              </div>

              {/* Notes */}
              {session.notes ? (
                <div className="rounded-lg bg-gray-50 border px-3 py-2.5">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Notes</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{session.notes}</p>
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">No notes added.</p>
              )}

              {/* Assigned partners */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                  Assigned partners
                </p>
                {partners.length === 0 ? (
                  <p className="text-sm text-amber-600 font-medium">Unassigned</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {partners.map(p => (
                      <span
                        key={p.id}
                        className="rounded-full px-3 py-1 text-xs font-medium text-white"
                        style={{ backgroundColor: p.colour }}
                      >
                        {p.full_name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
