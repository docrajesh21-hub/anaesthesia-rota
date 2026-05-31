'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'

export default function ViewToggle() {
  const router = useRouter()
  const params = useSearchParams()
  const view = params.get('view') ?? 'partners'

  function switchTo(v: string) {
    const p = new URLSearchParams(params.toString())
    p.set('view', v)
    // Reset week/month when switching
    p.delete('week')
    p.delete('month')
    router.push(`/rota?${p.toString()}`)
  }

  return (
    <div className="flex rounded-lg border overflow-hidden text-sm font-medium">
      {[
        { value: 'partners', label: 'Partners' },
        { value: 'calendar', label: 'Calendar' },
      ].map(opt => (
        <button
          key={opt.value}
          onClick={() => switchTo(opt.value)}
          className={cn(
            'px-4 py-1.5 transition-colors',
            view === opt.value
              ? 'bg-primary text-primary-foreground'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
