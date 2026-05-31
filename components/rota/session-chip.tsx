import { SESSION_STATUS_COLOUR, type SessionStatus } from '@/lib/types/database'

interface SessionChipProps {
  title: string
  status: SessionStatus
  partners: Array<{ full_name: string; colour: string }>
}

export default function SessionChip({ title, status, partners }: SessionChipProps) {
  const bg = SESSION_STATUS_COLOUR[status]

  return (
    <div
      className="rounded px-1.5 py-0.5 text-xs leading-tight mb-0.5 text-white truncate"
      style={{ backgroundColor: bg }}
      title={`${title}${partners.length ? ` — ${partners.map(p => p.full_name).join(', ')}` : ''}`}
    >
      <span className="font-medium">{title}</span>
      {partners.length > 0 && (
        <span className="ml-1 opacity-90">
          {partners.map(p => initials(p.full_name)).join(' ')}
        </span>
      )}
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
