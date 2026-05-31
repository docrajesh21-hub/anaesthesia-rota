import { LEAVE_COLOUR } from '@/lib/types/database'

interface LeaveChipProps {
  fullName: string
  type: string
}

export default function LeaveChip({ fullName, type }: LeaveChipProps) {
  return (
    <div
      className="rounded px-1.5 py-0.5 text-xs leading-tight mb-0.5 text-white truncate"
      style={{ backgroundColor: LEAVE_COLOUR }}
      title={`${fullName} — ${type} leave`}
    >
      {initials(fullName)} leave
    </div>
  )
}

function initials(name: string) {
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 3)
}
