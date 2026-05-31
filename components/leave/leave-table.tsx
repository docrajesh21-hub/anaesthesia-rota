'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { LEAVE_COLOUR } from '@/lib/types/database'
import { approveLeave, rejectLeave, deleteLeaveRequest } from '@/app/actions/leave'
import LeaveForm from './leave-form'
import type { LeaveStatus, LeaveType } from '@/lib/types/database'

interface LeaveRow {
  id: string
  start_date: string
  end_date: string
  type: LeaveType
  status: LeaveStatus
  notes: string | null
  profile: { id: string; full_name: string; colour: string }
}

interface LeaveTableProps {
  requests: LeaveRow[]
  isAdmin: boolean
  currentUserId: string
}

const STATUS_STYLE: Record<LeaveStatus, { bg: string; label: string }> = {
  pending:  { bg: '#EAB308', label: 'Pending' },
  approved: { bg: LEAVE_COLOUR, label: 'Approved' },
  rejected: { bg: '#6B7280', label: 'Rejected' },
}

const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  annual: 'Annual',
  study:  'Study',
  sick:   'Sick',
  other:  'Other',
}

function formatDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

function dayCount(start: string, end: string) {
  const ms = new Date(end).getTime() - new Date(start).getTime()
  return Math.round(ms / 86400000) + 1
}

export default function LeaveTable({ requests, isAdmin, currentUserId }: LeaveTableProps) {
  const [creating, setCreating] = useState(false)
  const [acting, setActing] = useState<string | null>(null)

  async function handle(fn: () => Promise<{ error: string | null }>, id: string) {
    setActing(id)
    await fn()
    setActing(null)
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={() => setCreating(true)}>+ Request leave</Button>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No leave requests yet.</div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {isAdmin && (
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Partner</th>
                )}
                <th className="px-4 py-3 text-left font-medium text-gray-600">Dates</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Days</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Type</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Notes</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {requests.map(r => {
                const canDelete = isAdmin || (r.profile.id === currentUserId && r.status === 'pending')
                const style = STATUS_STYLE[r.status]

                return (
                  <tr key={r.id} className="hover:bg-gray-50">
                    {isAdmin && (
                      <td className="px-4 py-3">
                        <span
                          className="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                          style={{ backgroundColor: r.profile.colour }}
                        >
                          {r.profile.full_name}
                        </span>
                      </td>
                    )}
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                      {formatDate(r.start_date)}
                      {r.start_date !== r.end_date && (
                        <span className="text-gray-400"> → {formatDate(r.end_date)}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {dayCount(r.start_date, r.end_date)}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {LEAVE_TYPE_LABELS[r.type]}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                        style={{ backgroundColor: style.bg }}
                      >
                        {style.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">
                      {r.notes ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 justify-end">
                        {isAdmin && r.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                              disabled={acting === r.id}
                              onClick={() => handle(() => approveLeave(r.id), r.id)}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-gray-500"
                              disabled={acting === r.id}
                              onClick={() => handle(() => rejectLeave(r.id), r.id)}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                        {canDelete && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-500 hover:text-red-700"
                            disabled={acting === r.id}
                            onClick={() => handle(() => deleteLeaveRequest(r.id), r.id)}
                          >
                            {acting === r.id ? '…' : 'Delete'}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={creating} onOpenChange={() => setCreating(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Request leave</DialogTitle></DialogHeader>
          <LeaveForm onDone={() => setCreating(false)} />
        </DialogContent>
      </Dialog>
    </>
  )
}
