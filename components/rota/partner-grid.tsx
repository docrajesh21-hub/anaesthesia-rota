'use client'

import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { SESSION_STATUS_COLOUR, LEAVE_COLOUR } from '@/lib/types/database'
import {
  DAY_SHORT, formatWeekHeader, prevWeek, nextWeek, toIso,
} from '@/lib/utils/calendar'
import { Button } from '@/components/ui/button'
import type { SessionStatus } from '@/lib/types/database'

interface SessionCell {
  id: string
  title: string
  status: SessionStatus
  start_time: string | null
}

interface LeaveCell {
  id: string
  type: string
}

interface PartnerRow {
  id: string
  full_name: string
  colour: string
  sessions: Record<string, SessionCell[]>   // iso → sessions
  leaves: Record<string, LeaveCell[]>       // iso → leaves
}

interface PartnerGridProps {
  monday: string   // YYYY-MM-DD
  partners: PartnerRow[]
  weekDays: string[]  // 7 ISO dates
}

const TODAY = toIso(new Date())

export default function PartnerGrid({ monday, partners, weekDays }: PartnerGridProps) {
  const router = useRouter()

  const mondayDate = new Date(monday + 'T00:00:00')
  const sundayDate = new Date(weekDays[6] + 'T00:00:00')
  const weekLabel = `${formatWeekHeader(monday)} – ${formatWeekHeader(weekDays[6])} ${sundayDate.getFullYear()}`

  return (
    <div className="space-y-3">
      {/* Week navigation */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => router.push(`/rota?view=partners&week=${prevWeek(mondayDate)}`)}>←</Button>
        <span className="text-base font-semibold text-gray-900 w-52 text-center">{weekLabel}</span>
        <Button variant="outline" size="sm" onClick={() => router.push(`/rota?view=partners&week=${nextWeek(mondayDate)}`)}>→</Button>
      </div>

      {partners.length === 0 ? (
        <div className="bg-white rounded-lg border p-8 text-center text-gray-400">
          No partners added yet. Add partners to see the rota grid.
        </div>
      ) : (
        <div className="bg-white rounded-lg border overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b bg-gray-50">
                {/* Partner column */}
                <th className="px-3 py-2 text-left font-medium text-gray-500 w-36 border-r">Partner</th>
                {weekDays.map((iso, i) => {
                  const isToday = iso === TODAY
                  const d = new Date(iso + 'T00:00:00')
                  return (
                    <th
                      key={iso}
                      className={cn(
                        'px-2 py-2 text-center font-medium min-w-[110px]',
                        isToday ? 'bg-blue-50 text-blue-700' : 'text-gray-500',
                        i < 6 && 'border-r'
                      )}
                    >
                      <div className="text-xs uppercase tracking-wide">{DAY_SHORT[i]}</div>
                      <div className={cn('text-base font-bold', isToday ? 'text-blue-600' : 'text-gray-800')}>
                        {d.getDate()}
                      </div>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody className="divide-y">
              {partners.map((partner, pi) => (
                <tr key={partner.id} className={cn('hover:bg-gray-50/50', pi % 2 === 0 ? 'bg-white' : 'bg-gray-50/30')}>
                  {/* Partner name */}
                  <td className="px-3 py-2 border-r align-top">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: partner.colour }}
                      />
                      <span className="font-medium text-gray-900 text-xs leading-tight">
                        {partner.full_name}
                      </span>
                    </div>
                  </td>

                  {/* Day cells */}
                  {weekDays.map((iso, i) => {
                    const daySessions = partner.sessions[iso] ?? []
                    const dayLeaves = partner.leaves[iso] ?? []
                    const isToday = iso === TODAY
                    const isWeekend = i >= 5

                    return (
                      <td
                        key={iso}
                        className={cn(
                          'px-1.5 py-1.5 align-top min-h-[56px]',
                          isToday && 'bg-blue-50/60',
                          isWeekend && !isToday && 'bg-gray-50/60',
                          i < 6 && 'border-r'
                        )}
                      >
                        {dayLeaves.map(l => (
                          <div
                            key={l.id}
                            className="rounded px-1.5 py-0.5 text-xs text-white mb-0.5 truncate capitalize"
                            style={{ backgroundColor: LEAVE_COLOUR }}
                            title={`${l.type} leave`}
                          >
                            {l.type} leave
                          </div>
                        ))}
                        {daySessions.map(s => (
                          <div
                            key={s.id}
                            className="rounded px-1.5 py-0.5 text-xs text-white mb-0.5 truncate"
                            style={{ backgroundColor: SESSION_STATUS_COLOUR[s.status] }}
                            title={`${s.title}${s.start_time ? ` · ${s.start_time.slice(0,5)}` : ''}`}
                          >
                            {s.title}
                            {s.start_time && (
                              <span className="ml-1 opacity-80">{s.start_time.slice(0, 5)}</span>
                            )}
                          </div>
                        ))}
                        {daySessions.length === 0 && dayLeaves.length === 0 && (
                          <div className="h-5" />
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
