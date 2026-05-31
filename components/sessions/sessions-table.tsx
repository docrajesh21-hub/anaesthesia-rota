'use client'

import { useState } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { deleteSession } from '@/app/actions/sessions'
import SessionForm from './session-form'
import AssignPartnerDialog from './assign-partner-dialog'
import { SESSION_STATUS_COLOUR } from '@/lib/types/database'
import type { Session, Profile, SessionStatus } from '@/lib/types/database'
import type { SessionRow } from '@/lib/types/sessions'

interface SessionsTableProps {
  sessions: SessionRow[]
  partners: Pick<Profile, 'id' | 'full_name' | 'colour'>[]
  isAdmin: boolean
}

export default function SessionsTable({ sessions, partners, isAdmin }: SessionsTableProps) {
  const [editSession, setEditSession] = useState<Session | null>(null)
  const [assignSession, setAssignSession] = useState<SessionRow | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  async function handleDelete(id: string) {
    if (!confirm('Delete this session?')) return
    setDeleting(id)
    await deleteSession(id)
    setDeleting(null)
  }

  return (
    <>
      {isAdmin && (
        <div className="flex justify-end mb-4">
          <Button onClick={() => setCreating(true)}>+ New session</Button>
        </div>
      )}

      {sessions.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No sessions yet.{isAdmin ? ' Create one above.' : ''}
        </div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Date</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Session</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Type</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Partners</th>
                {isAdmin && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody className="divide-y">
              {sessions.map(s => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                    {new Date(s.date + 'T00:00:00').toLocaleDateString('en-GB', {
                      day: '2-digit', month: 'short', year: 'numeric',
                    })}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {s.title}
                    {s.start_time && (
                      <span className="ml-1.5 text-xs text-gray-400">
                        {s.start_time.slice(0, 5)}
                        {s.end_time ? `–${s.end_time.slice(0, 5)}` : ''}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 capitalize text-gray-600">{s.type}</td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium text-white capitalize"
                      style={{ backgroundColor: SESSION_STATUS_COLOUR[s.status as SessionStatus] }}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {s.rota_assignments.length === 0 ? (
                        <span className="text-gray-400 text-xs">Unassigned</span>
                      ) : (
                        s.rota_assignments.map(a => (
                          <Badge
                            key={a.id}
                            className="text-xs text-white"
                            style={{ backgroundColor: a.profile.colour }}
                          >
                            {a.profile.full_name}
                          </Badge>
                        ))
                      )}
                    </div>
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setAssignSession(s)}
                        >
                          Assign
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditSession(s)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-500 hover:text-red-700"
                          disabled={deleting === s.id}
                          onClick={() => handleDelete(s.id)}
                        >
                          {deleting === s.id ? '…' : 'Delete'}
                        </Button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={creating} onOpenChange={() => setCreating(false)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>New session</DialogTitle></DialogHeader>
          <SessionForm onDone={() => setCreating(false)} />
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editSession} onOpenChange={() => setEditSession(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit session</DialogTitle></DialogHeader>
          {editSession && (
            <SessionForm session={editSession} onDone={() => setEditSession(null)} />
          )}
        </DialogContent>
      </Dialog>

      {/* Assign partner dialog */}
      {assignSession && (
        <AssignPartnerDialog
          open={!!assignSession}
          onClose={() => setAssignSession(null)}
          sessionId={assignSession.id}
          sessionTitle={assignSession.title}
          assignments={assignSession.rota_assignments}
          allPartners={partners}
        />
      )}
    </>
  )
}
