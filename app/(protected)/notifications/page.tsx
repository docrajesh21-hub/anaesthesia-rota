export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { markNotificationsRead } from '@/app/actions/rota'
import Link from 'next/link'

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: notifications } = await supabase
    .from('notifications')
    .select('id, message, link, read, created_at')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const unreadIds = (notifications ?? []).filter(n => !n.read).map(n => n.id)

  // Mark all as read (fire and forget — page already rendered with unread styling)
  if (unreadIds.length > 0) {
    await markNotificationsRead(unreadIds)
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>

      {(!notifications || notifications.length === 0) ? (
        <div className="bg-white rounded-lg border p-8 text-center text-gray-400">
          No notifications yet.
        </div>
      ) : (
        <div className="bg-white rounded-lg border divide-y">
          {notifications.map(n => (
            <div key={n.id} className={`px-4 py-3 flex items-start gap-3 ${!n.read ? 'bg-blue-50/50' : ''}`}>
              {!n.read && (
                <span className="mt-1.5 h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
              )}
              {n.read && <span className="mt-1.5 h-2 w-2 flex-shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800">{n.message}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date(n.created_at).toLocaleString('en-GB', {
                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                  })}
                </p>
              </div>
              {n.link && (
                <Link href={n.link} className="text-xs text-blue-500 hover:underline whitespace-nowrap">
                  View →
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
