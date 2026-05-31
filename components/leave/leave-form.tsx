'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { createLeaveRequest, type LeaveFormData } from '@/app/actions/leave'
import type { LeaveType } from '@/lib/types/database'

const LEAVE_TYPES: { value: LeaveType; label: string }[] = [
  { value: 'annual',  label: 'Annual leave' },
  { value: 'study',   label: 'Study leave' },
  { value: 'sick',    label: 'Sick leave' },
  { value: 'other',   label: 'Other' },
]

interface LeaveFormProps {
  onDone: () => void
}

export default function LeaveForm({ onDone }: LeaveFormProps) {
  const [form, setForm] = useState<LeaveFormData>({
    start_date: '',
    end_date: '',
    type: 'annual',
    notes: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function set<K extends keyof LeaveFormData>(key: K, value: LeaveFormData[K]) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const result = await createLeaveRequest(form)
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
          <Label htmlFor="start_date">Start date</Label>
          <Input
            id="start_date"
            type="date"
            value={form.start_date}
            onChange={e => set('start_date', e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="end_date">End date</Label>
          <Input
            id="end_date"
            type="date"
            value={form.end_date}
            min={form.start_date}
            onChange={e => set('end_date', e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="type">Type</Label>
        <Select value={form.type} onValueChange={v => set('type', v as LeaveType)}>
          <SelectTrigger id="type"><SelectValue /></SelectTrigger>
          <SelectContent>
            {LEAVE_TYPES.map(t => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes <span className="text-gray-400">(optional)</span></Label>
        <Textarea
          id="notes"
          placeholder="Any additional information..."
          value={form.notes}
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
          {loading ? 'Submitting…' : 'Request leave'}
        </Button>
      </div>
    </form>
  )
}
