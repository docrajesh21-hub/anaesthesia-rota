export interface CalendarDay {
  date: Date
  iso: string       // YYYY-MM-DD
  isCurrentMonth: boolean
  isToday: boolean
}

export function getCalendarDays(year: number, month: number): CalendarDay[] {
  const today = new Date()
  const todayIso = toIso(today)

  const firstOfMonth = new Date(year, month - 1, 1)
  const lastOfMonth = new Date(year, month, 0)

  // Week starts Monday: shift so Mon=0
  const startPad = (firstOfMonth.getDay() + 6) % 7
  const endPad = (6 - (lastOfMonth.getDay() + 6) % 7)

  const days: CalendarDay[] = []

  for (let i = startPad; i > 0; i--) {
    const d = new Date(firstOfMonth)
    d.setDate(d.getDate() - i)
    days.push({ date: d, iso: toIso(d), isCurrentMonth: false, isToday: toIso(d) === todayIso })
  }

  for (let d = new Date(firstOfMonth); d <= lastOfMonth; d.setDate(d.getDate() + 1)) {
    const copy = new Date(d)
    days.push({ date: copy, iso: toIso(copy), isCurrentMonth: true, isToday: toIso(copy) === todayIso })
  }

  for (let i = 1; i <= endPad; i++) {
    const d = new Date(lastOfMonth)
    d.setDate(d.getDate() + i)
    days.push({ date: d, iso: toIso(d), isCurrentMonth: false, isToday: toIso(d) === todayIso })
  }

  return days
}

export function toIso(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseYearMonth(value: string | undefined): { year: number; month: number } {
  if (value && /^\d{4}-\d{2}$/.test(value)) {
    const [y, m] = value.split('-').map(Number)
    if (m >= 1 && m <= 12) return { year: y, month: m }
  }
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() + 1 }
}

export function prevMonth(year: number, month: number): string {
  const d = new Date(year, month - 2, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function nextMonth(year: number, month: number): string {
  const d = new Date(year, month, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
