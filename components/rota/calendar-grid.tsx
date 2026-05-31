'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { SESSION_STATUS_COLOUR, LEAVE_COLOUR } from '@/lib/types/database'
import SessionDetailDialog from './session-detail-dialog'
import type { SessionStatus, LeaveType } from '@/lib/types/database'

interface CalendarSession {
  id: string
  title: string
  status: SessionStatus
  start_time: string | null
  partners: { full_name: string; colour: string }[]
}

interface CalendarLeave {
  id: string
  full_name: string
  type: LeaveType
}

interface CalendarDay {
  iso: string
  dayNum: number
  isCurrentMonth: boolean
  isToday: boolean
  sessions: CalendarSession[]
  leaves: CalendarLeave[]
}

interface CalendarGridProps {
  days: CalendarDay[]
}

const DAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 3)
}

export default function CalendarGrid({ days }: CalendarGridProps) {
  const [detailSessionId, setDetailSessionId] = useState<string | null>(null)

  return (
    <>
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
          {days.map(day => (
            <div
              key={day.iso}
              className={cn(
                'min-h-[110px] p-1.5',
                day.isCurrentMonth ? 'bg-white' : 'bg-gray-50',
                day.isToday && 'ring-2 ring-inset ring-blue-400',
              )}
            >
              <p className={cn(
                'text-xs font-medium mb-1 text-right',
                day.isToday ? 'text-blue-600' : day.isCurrentMonth ? 'text-gray-700' : 'text-gray-400',
              )}>
                {day.dayNum}
              </p>

              {day.sessions.map(s => (
                <div
                  key={s.id}
                  onDoubleClick={() => setDetailSessionId(s.id)}
                  className="rounded px-1.5 py-0.5 text-xs text-white mb-0.5 truncate cursor-pointer select-none"
                  style={{ backgroundColor: SESSION_STATUS_COLOUR[s.status] }}
                  title={`${s.title} — double-click for details`}
                >
                  <span className="font-medium">{s.title}</span>
                  {s.partners.length > 0 && (
                    <span className="ml-1 opacity-90">
                      {s.partners.map(p => initials(p.full_name)).join(' ')}
                    </span>
                  )}
                </div>
              ))}

              {day.leaves.map(l => (
                <div
                  key={l.id + day.iso}
                  className="rounded px-1.5 py-0.5 text-xs text-white mb-0.5 truncate"
                  style={{ backgroundColor: LEAVE_COLOUR }}
                  title={`${l.full_name} — ${l.type} leave`}
                >
                  {initials(l.full_name)} leave
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <SessionDetailDialog
        sessionId={detailSessionId}
        onClose={() => setDetailSessionId(null)}
      />
    </>
  )
}
