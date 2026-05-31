'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import type { UserRole } from '@/lib/types/database'

const navItems = [
  { href: '/dashboard',      label: 'Dashboard' },
  { href: '/rota',           label: 'Rota' },
  { href: '/sessions',       label: 'Sessions' },
  { href: '/leave',          label: 'Leave' },
  { href: '/notifications',  label: 'Notifications' },
]

const adminItems = [
  { href: '/partners', label: 'Partners' },
]

interface SidebarProps {
  fullName: string
  role: UserRole | string
  unreadCount: number
}

export default function Sidebar({ fullName, role, unreadCount }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const items = role === 'admin' ? [...navItems, ...adminItems] : navItems

  return (
    <aside className="w-56 flex flex-col bg-white border-r">
      <div className="px-5 py-4">
        <span className="text-lg font-bold text-gray-900">AnaesthRota</span>
      </div>

      <Separator />

      <nav className="flex-1 px-3 py-4 space-y-1">
        {items.map(item => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const isNotif = item.href === '/notifications'
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <span>{item.label}</span>
              {isNotif && unreadCount > 0 && (
                <span className="ml-2 rounded-full bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 leading-none">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <Separator />

      <div className="px-5 py-4 space-y-1">
        <p className="text-sm font-medium text-gray-900 truncate">{fullName}</p>
        <p className="text-xs text-gray-500 capitalize">{role}</p>
        <button
          onClick={handleSignOut}
          className="mt-2 text-xs text-red-500 hover:text-red-700 transition-colors"
        >
          Sign out
        </button>
      </div>
    </aside>
  )
}
