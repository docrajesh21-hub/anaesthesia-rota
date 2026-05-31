'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { createSession, updateSession, type SessionFormData } from '@/app/actions/sessions'
import type { Session, SessionType, SessionStatus } from '@/lib/types/database'

interface SessionFormProps {
  session?: Session
  onDone: () => void
}

const SESSION_TYPES: SessionType[] = ['theatre', 'oncall', 'icu', 'clinic', 'other']
const SESSION_STATUSES: { value: SessionStatus; label: string }[] = [
  { value: 'pending',   label: 'Pending (yellow)' },
  { value: 'confirmed', label: 'Confirmed (green)' },
  { value: 'cancelled', label: 'Cancelled (red)' },
]

export default function SessionForm({ session, onDone }: SessionFormProps) {
  const [form, setForm] = useState<SessionFormData>({
    date:       session?.date       ?? '',
    title:      session?.title      ?? '',
    type:       session?.type       ?? 'theatre',
    status:     session?.status     ?? 'pending',
    start_time: session?.start_time ?? '',
    end_time:   session?.end_time   ?? '',
    notes:      session?.notes      ?? '',
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function set<K extends keyof SessionFormData>(key: K, value: SessionFormData[K]) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const result = session
      ? await updateSession(session.id, form)
      : await createSession(form)

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    onDone()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="date">Date</Label>
          <Input id="date" type="date" value={form.date} onChange={e => set('date', e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="type">Type</Label>
          <Select value={form.type} onValueChange={v => set('type', v as SessionType)}>
            <SelectTrigger id="type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SESSION_TYPES.map(t => (
                <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          placeholder="e.g. Theatre 1 — General"
          value={form.title}
          onChange={e => set('title', e.target.value)}
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="status">Status</Label>
        <Select value={form.status} onValueChange={v => set('status', v as SessionStatus)}>
          <SelectTrigger id="status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SESSION_STATUSES.map(s => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="start_time">Start time</Label>
          <Input id="start_time" type="time" value={form.start_time ?? ''} onChange={e => set('start_time', e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="end_time">End time</Label>
          <Input id="end_time" type="time" value={form.end_time ?? ''} onChange={e => set('end_time', e.target.value)} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          placeholder="Optional notes..."
          value={form.notes ?? ''}
          onChange={e => set('notes', e.target.value)}
          rows={2}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="outline" onClick={onDone} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving…' : session ? 'Save changes' : 'Create session'}
        </Button>
      </div>
    </form>
  )
}
