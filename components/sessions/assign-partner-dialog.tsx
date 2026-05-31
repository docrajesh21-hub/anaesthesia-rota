'use client'

import { useState } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { assignPartner, removeAssignment } from '@/app/actions/sessions'
import type { Profile } from '@/lib/types/database'

interface Assignment {
  id: string
  profile: Pick<Profile, 'id' | 'full_name' | 'colour'>
}

interface AssignPartnerDialogProps {
  open: boolean
  onClose: () => void
  sessionId: string
  sessionTitle: string
  assignments: Assignment[]
  allPartners: Pick<Profile, 'id' | 'full_name' | 'colour'>[]
}

export default function AssignPartnerDialog({
  open, onClose, sessionId, sessionTitle, assignments, allPartners,
}: AssignPartnerDialogProps) {
  const [loading, setLoading] = useState<string | null>(null)

  const assignedIds = new Set(assignments.map(a => a.profile.id))
  const unassigned = allPartners.filter(p => !assignedIds.has(p.id))

  async function handleAssign(profileId: string) {
    setLoading(profileId)
    await assignPartner(sessionId, profileId)
    setLoading(null)
  }

  async function handleRemove(assignmentId: string) {
    setLoading(assignmentId)
    await removeAssignment(assignmentId)
    setLoading(null)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Assign partners — {sessionTitle}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {assignments.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Assigned</p>
              <div className="flex flex-wrap gap-2">
                {assignments.map(a => (
                  <div key={a.id} className="flex items-center gap-1">
                    <Badge
                      style={{ backgroundColor: a.profile.colour, color: '#fff' }}
                      className="text-xs"
                    >
                      {a.profile.full_name}
                    </Badge>
                    <button
                      onClick={() => handleRemove(a.id)}
                      disabled={loading === a.id}
                      className="text-gray-400 hover:text-red-500 text-xs font-bold leading-none"
                      title="Remove"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {unassigned.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Add partner</p>
              <div className="flex flex-wrap gap-2">
                {unassigned.map(p => (
                  <button
                    key={p.id}
                    onClick={() => handleAssign(p.id)}
                    disabled={loading === p.id}
                    className="rounded-full px-3 py-1 text-xs font-medium text-white transition-opacity hover:opacity-80 disabled:opacity-50"
                    style={{ backgroundColor: p.colour }}
                  >
                    {loading === p.id ? '…' : p.full_name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {assignments.length === 0 && unassigned.length === 0 && (
            <p className="text-sm text-gray-500">No partners found. Add partners first.</p>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="outline" onClick={onClose}>Done</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
