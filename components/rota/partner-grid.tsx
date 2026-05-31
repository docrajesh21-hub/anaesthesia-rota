'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { SESSION_STATUS_COLOUR, LEAVE_COLOUR } from '@/lib/types/database'
import { DAY_SHORT, formatWeekHeader, prevWeek, nextWeek, toIso } from '@/lib/utils/calendar'
import { Button } from '@/components/ui/button'
import { assignFromRota } from '@/app/actions/rota'
import SessionDetailDialog from '@/components/rota/session-detail-dialog'
import type { SessionStatus } from '@/lib/types/database'

interface SessionCell {
  id: string
  title: string
  status: SessionStatus
  start_time: string | null
  date: string
}

interface LeaveCell {
  id: string
  type: string
}

interface PartnerRow {
  id: string
  full_name: string
  colour: string
  sessions: Record<string, SessionCell[]>
  leaves: Record<string, LeaveCell[]>
}

interface PartnerGridProps {
  monday: string
  weekDays: string[]
  partners: PartnerRow[]
  unassignedByDate: Record<string, SessionCell[]>
  currentUserId: string
  currentUserRole: string
}

const TODAY = toIso(new Date())

export default function PartnerGrid({
  monday, weekDays, partners, unassignedByDate, currentUserId, currentUserRole,
}: PartnerGridProps) {
  const router = useRouter()
  const isAdmin = currentUserRole === 'admin'

  const mondayDate = new Date(monday + 'T00:00:00')
  const sundayDate = new Date(weekDays[6] + 'T00:00:00')
  const weekLabel = `${formatWeekHeader(monday)} – ${formatWeekHeader(weekDays[6])} ${sundayDate.getFullYear()}`

  const [draggedSession, setDraggedSession] = useState<SessionCell | null>(null)
  const [dropTarget, setDropTarget] = useState<{ profileId: string; date: string } | null>(null)
  const [assigning, setAssigning] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [detailSessionId, setDetailSessionId] = useState<string | null>(null)

  const totalUnassigned = weekDays.reduce((n, d) => n + (unassignedByDate[d]?.length ?? 0), 0)

  const isValidDropTarget = useCallback((profileId: string) => {
    if (isAdmin) return true
    return profileId === currentUserId
  }, [isAdmin, currentUserId])

  function onDragStart(e: React.DragEvent, session: SessionCell) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('sessionId', session.id)
    setDraggedSession(session)
    setErrorMsg(null)
  }

  function onDragEnd() {
    setDraggedSession(null)
    setDropTarget(null)
  }

  function onDragOver(e: React.DragEvent, profileId: string, date: string) {
    if (!isValidDropTarget(profileId)) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDropTarget({ profileId, date })
  }

  function onDragLeave() {
    setDropTarget(null)
  }

  async function onDrop(e: React.DragEvent, profileId: string) {
    e.preventDefault()
    setDropTarget(null)
    const sessionId = e.dataTransfer.getData('sessionId')
    if (!sessionId || !isValidDropTarget(profileId)) return

    setAssigning(sessionId)
    const result = await assignFromRota(sessionId, profileId)
    setAssigning(null)

    if (result.error) {
      setErrorMsg(result.error)
    } else {
      router.refresh()
    }
  }

  return (
    <div className="space-y-3">
      {/* Week navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.push(`/rota?view=partners&week=${prevWeek(mondayDate)}`)}>←</Button>
          <span className="text-base font-semibold text-gray-900 w-52 text-center">{weekLabel}</span>
          <Button variant="outline" size="sm" onClick={() => router.push(`/rota?view=partners&week=${nextWeek(mondayDate)}`)}>→</Button>
        </div>
        {!isAdmin && (
          <p className="text-xs text-gray-400">Drag an unassigned session to your row to claim it</p>
        )}
      </div>

      {errorMsg && (
        <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
          {errorMsg}
        </div>
      )}

      {partners.length === 0 ? (
        <div className="bg-white rounded-lg border p-8 text-center text-gray-400">
          No partners added yet.
        </div>
      ) : (
        <div className="bg-white rounded-lg border overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-3 py-2 text-left font-medium text-gray-500 w-36 border-r sticky left-0 bg-gray-50 z-10">Partner</th>
                {weekDays.map((iso, i) => {
                  const isToday = iso === TODAY
                  const d = new Date(iso + 'T00:00:00')
                  return (
                    <th key={iso} className={cn(
                      'px-2 py-2 text-center font-medium min-w-[120px]',
                      isToday ? 'bg-blue-50 text-blue-700' : 'text-gray-500',
                      i < 6 && 'border-r'
                    )}>
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

              {/* ── Unassigned row ────────────────────────────────────── */}
              {totalUnassigned > 0 && (
                <tr className="bg-amber-50/60 border-b-2 border-amber-200">
                  <td className="px-3 py-2 border-r sticky left-0 bg-amber-50 z-10 align-top">
                    <div className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Unassigned</div>
                    <div className="text-xs text-amber-500 mt-0.5">drag to claim</div>
                  </td>
                  {weekDays.map((iso, i) => {
                    const sessions = unassignedByDate[iso] ?? []
                    return (
                      <td key={iso} className={cn(
                        'px-1.5 py-1.5 align-top',
                        i < 6 && 'border-r',
                        iso === TODAY && 'bg-amber-50'
                      )}>
                        {sessions.map(s => (
                          <div
                            key={s.id}
                            draggable
                            onDragStart={e => onDragStart(e, { ...s, date: iso })}
                            onDragEnd={onDragEnd}
                            onDoubleClick={() => setDetailSessionId(s.id)}
                            className={cn(
                              'rounded px-1.5 py-0.5 text-xs text-white mb-0.5 truncate',
                              'cursor-grab active:cursor-grabbing select-none',
                              'border border-white/20',
                              assigning === s.id && 'opacity-40',
                              draggedSession?.id === s.id && 'opacity-50 scale-95',
                            )}
                            style={{ backgroundColor: SESSION_STATUS_COLOUR[s.status] }}
                            title={`${s.title} — drag to assign · double-click for details`}
                          >
                            <span className="mr-1">⠿</span>
                            {s.title}
                            {s.start_time && <span className="ml-1 opacity-75">{s.start_time.slice(0, 5)}</span>}
                          </div>
                        ))}
                        {sessions.length === 0 && <div className="h-5" />}
                      </td>
                    )
                  })}
                </tr>
              )}

              {/* ── Partner rows ──────────────────────────────────────── */}
              {partners.map((partner, pi) => {
                const canDrop = isValidDropTarget(partner.id)
                const isOwnRow = partner.id === currentUserId

                return (
                  <tr key={partner.id} className={cn(
                    pi % 2 === 0 ? 'bg-white' : 'bg-gray-50/30',
                    isOwnRow && 'ring-1 ring-inset ring-blue-200',
                  )}>
                    {/* Partner name */}
                    <td className={cn(
                      'px-3 py-2 border-r align-top sticky left-0 z-10',
                      pi % 2 === 0 ? 'bg-white' : 'bg-gray-50/30',
                    )}>
                      <div className="flex items-center gap-2">
                        <span className="inline-block h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: partner.colour }} />
                        <span className="font-medium text-gray-900 text-xs leading-tight">{partner.full_name}</span>
                        {isOwnRow && <span className="text-[10px] text-blue-400 font-medium">you</span>}
                      </div>
                    </td>

                    {/* Day cells */}
                    {weekDays.map((iso, i) => {
                      const daySessions = partner.sessions[iso] ?? []
                      const dayLeaves = partner.leaves[iso] ?? []
                      const isToday = iso === TODAY
                      const isWeekend = i >= 5
                      const isDropping = dropTarget?.profileId === partner.id && dropTarget?.date === iso && canDrop && !!draggedSession
                      const hasUnassigned = (unassignedByDate[iso]?.length ?? 0) > 0

                      return (
                        <td
                          key={iso}
                          onDragOver={e => onDragOver(e, partner.id, iso)}
                          onDragLeave={onDragLeave}
                          onDrop={e => onDrop(e, partner.id)}
                          className={cn(
                            'px-1.5 py-1.5 align-top min-h-[60px] transition-colors',
                            isToday && 'bg-blue-50/60',
                            isWeekend && !isToday && 'bg-gray-50/60',
                            i < 6 && 'border-r',
                            isDropping && 'bg-green-100 border-2 border-dashed border-green-400',
                            !isDropping && draggedSession && canDrop && hasUnassigned && 'bg-green-50/40',
                            !canDrop && draggedSession && 'opacity-40',
                          )}
                        >
                          {dayLeaves.map(l => (
                            <div
                              key={l.id}
                              className="rounded px-1.5 py-0.5 text-xs text-white mb-0.5 truncate capitalize"
                              style={{ backgroundColor: LEAVE_COLOUR }}
                            >
                              {l.type} leave
                            </div>
                          ))}
                          {daySessions.map(s => (
                            <div
                              key={s.id}
                              onDoubleClick={() => setDetailSessionId(s.id)}
                              className="rounded px-1.5 py-0.5 text-xs text-white mb-0.5 truncate cursor-pointer"
                              style={{ backgroundColor: SESSION_STATUS_COLOUR[s.status] }}
                              title={`${s.title}${s.start_time ? ` · ${s.start_time.slice(0, 5)}` : ''} — double-click for details`}
                            >
                              {s.title}
                              {s.start_time && <span className="ml-1 opacity-75">{s.start_time.slice(0, 5)}</span>}
                            </div>
                          ))}
                          {daySessions.length === 0 && dayLeaves.length === 0 && (
                            <div className={cn(
                              'h-8 rounded border-2 border-dashed border-transparent transition-colors',
                              isDropping && 'border-green-400',
                            )} />
                          )}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <SessionDetailDialog
        sessionId={detailSessionId}
        onClose={() => setDetailSessionId(null)}
      />
    </div>
  )
}
