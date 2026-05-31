'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { prevMonth, nextMonth, MONTH_NAMES } from '@/lib/utils/calendar'

interface MonthNavProps {
  year: number
  month: number
}

export default function MonthNav({ year, month }: MonthNavProps) {
  const router = useRouter()

  return (
    <div className="flex items-center gap-3">
      <Button
        variant="outline"
        size="sm"
        onClick={() => router.push(`/rota?month=${prevMonth(year, month)}`)}
      >
        ←
      </Button>
      <span className="text-lg font-semibold text-gray-900 w-44 text-center">
        {MONTH_NAMES[month - 1]} {year}
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => router.push(`/rota?month=${nextMonth(year, month)}`)}
      >
        →
      </Button>
    </div>
  )
}
