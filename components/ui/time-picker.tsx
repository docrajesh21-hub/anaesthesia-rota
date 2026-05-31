'use client'

import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface TimePickerProps {
  value: string        // HH:MM (24-hour) or empty string
  onChange: (val: string) => void
  id?: string
}

const HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55']

function parse24(val: string): { h: number; m: number; ampm: 'AM' | 'PM' } {
  if (!val) return { h: 8, m: 0, ampm: 'AM' }
  const [hStr, mStr] = val.split(':')
  let h = parseInt(hStr, 10)
  const m = parseInt(mStr, 10)
  const ampm: 'AM' | 'PM' = h < 12 ? 'AM' : 'PM'
  if (h === 0) h = 12
  else if (h > 12) h = h - 12
  return { h, m, ampm }
}

function to24(h: number, m: number, ampm: 'AM' | 'PM'): string {
  let h24 = h
  if (ampm === 'AM' && h === 12) h24 = 0
  else if (ampm === 'PM' && h !== 12) h24 = h + 12
  return `${String(h24).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export default function TimePicker({ value, onChange, id }: TimePickerProps) {
  const { h: initH, m: initM, ampm: initAmpm } = parse24(value)
  const [open, setOpen] = useState(false)
  const [hour, setHour] = useState(initH)
  const [minute, setMinute] = useState(initM)
  const [ampm, setAmpm] = useState<'AM' | 'PM'>(initAmpm)
  const ref = useRef<HTMLDivElement>(null)

  // Sync state when external value changes
  useEffect(() => {
    const { h, m, ampm: a } = parse24(value)
    setHour(h); setMinute(m); setAmpm(a)
  }, [value])

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function select(h: number, m: number, a: 'AM' | 'PM') {
    setHour(h); setMinute(m); setAmpm(a)
    onChange(to24(h, m, a))
  }

  const displayValue = value
    ? `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${ampm}`
    : ''

  return (
    <div ref={ref} className="relative" id={id}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={cn(
          'h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm text-left',
          'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none',
          'cursor-pointer',
          !value && 'text-muted-foreground'
        )}
      >
        {displayValue || 'Select time'}
      </button>

      {/* Picker panel */}
      {open && (
        <div className="absolute top-9 left-0 z-50 w-64 rounded-lg border bg-white shadow-lg p-3 space-y-3">

          {/* AM / PM toggle */}
          <div className="flex rounded-lg border overflow-hidden text-sm font-medium">
            {(['AM', 'PM'] as const).map(a => (
              <button
                key={a}
                type="button"
                onClick={() => select(hour, minute, a)}
                className={cn(
                  'flex-1 py-1.5 transition-colors cursor-pointer',
                  ampm === a
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                )}
              >
                {a}
              </button>
            ))}
          </div>

          {/* Hour grid */}
          <div>
            <p className="text-xs text-gray-400 mb-1.5 font-medium uppercase tracking-wide">Hour</p>
            <div className="grid grid-cols-4 gap-1">
              {HOURS.map(h => (
                <button
                  key={h}
                  type="button"
                  onClick={() => select(h, minute, ampm)}
                  className={cn(
                    'rounded-md py-1.5 text-sm font-medium transition-colors cursor-pointer',
                    hour === h
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-gray-100 text-gray-700'
                  )}
                >
                  {h}
                </button>
              ))}
            </div>
          </div>

          {/* Minute grid */}
          <div>
            <p className="text-xs text-gray-400 mb-1.5 font-medium uppercase tracking-wide">Minute</p>
            <div className="grid grid-cols-4 gap-1">
              {MINUTES.map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => { select(hour, parseInt(m, 10), ampm); setOpen(false) }}
                  className={cn(
                    'rounded-md py-1.5 text-sm font-medium transition-colors cursor-pointer',
                    minute === parseInt(m, 10)
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-gray-100 text-gray-700'
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Clear */}
          {value && (
            <button
              type="button"
              onClick={() => { onChange(''); setOpen(false) }}
              className="w-full text-xs text-gray-400 hover:text-red-500 transition-colors py-1 cursor-pointer"
            >
              Clear time
            </button>
          )}
        </div>
      )}
    </div>
  )
}
