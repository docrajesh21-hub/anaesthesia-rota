'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function assignFromRota(sessionId: string, targetProfileId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthenticated' }

  const { data: actorProfile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  if (!actorProfile) return { error: 'Profile not found' }

  const isAdmin = actorProfile.role === 'admin'

  // Partners can only assign themselves
  if (!isAdmin && targetProfileId !== user.id) {
    return { error: 'You can only assign yourself to a session' }
  }

  // Get session title for notifications
  const { data: session } = await supabase
    .from('sessions')
    .select('title, date')
    .eq('id', sessionId)
    .single()

  if (!session) return { error: 'Session not found' }

  // Create the assignment
  const { error: assignError } = await supabase
    .from('rota_assignments')
    .insert({ session_id: sessionId, profile_id: targetProfileId, created_by: user.id })

  if (assignError) {
    if (assignError.code === '23505') return { error: 'Already assigned to this session' }
    return { error: assignError.message }
  }

  // --- Notifications (using admin client to write across users) ---
  const admin = createAdminClient()

  const { data: targetProfile } = await admin
    .from('profiles')
    .select('full_name')
    .eq('id', targetProfileId)
    .single()

  const { data: admins } = await admin
    .from('profiles')
    .select('id')
    .eq('role', 'admin')

  const notifs: { user_id: string; message: string; link: string }[] = []

  const sessionLabel = `"${session.title}" on ${new Date(session.date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`
  const isSelfAssign = targetProfileId === user.id

  // Notify all admins
  for (const a of admins ?? []) {
    if (a.id === user.id) continue // skip self if actor is admin
    const msg = isSelfAssign
      ? `${actorProfile.full_name} assigned themselves to ${sessionLabel}`
      : `${actorProfile.full_name} assigned ${targetProfile?.full_name ?? 'a partner'} to ${sessionLabel}`
    notifs.push({ user_id: a.id, message: msg, link: '/rota' })
  }

  // Notify the assigned partner (if not the actor)
  if (targetProfileId !== user.id) {
    notifs.push({
      user_id: targetProfileId,
      message: `You have been assigned to ${sessionLabel}`,
      link: '/rota',
    })
  }

  if (notifs.length > 0) {
    await admin.from('notifications').insert(notifs)
  }

  revalidatePath('/rota')
  revalidatePath('/sessions')
  return { error: null }
}

export async function markNotificationsRead(ids: string[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('notifications')
    .update({ read: true })
    .in('id', ids)
    .eq('user_id', user.id)
}
