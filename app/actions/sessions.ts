'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { SessionType, SessionStatus } from '@/lib/types/database'

export interface SessionFormData {
  date: string
  title: string
  type: SessionType
  status: SessionStatus
  start_time: string
  end_time: string
  notes: string
}

export async function createSession(data: SessionFormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthenticated' }

  const { error } = await supabase.from('sessions').insert({
    ...data,
    start_time: data.start_time || null,
    end_time: data.end_time || null,
    notes: data.notes || null,
    created_by: user.id,
  })

  if (error) return { error: error.message }
  revalidatePath('/sessions')
  revalidatePath('/rota')
  return { error: null }
}

export async function updateSession(id: string, data: SessionFormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthenticated' }

  const { error } = await supabase
    .from('sessions')
    .update({
      ...data,
      start_time: data.start_time || null,
      end_time: data.end_time || null,
      notes: data.notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/sessions')
  revalidatePath('/rota')
  return { error: null }
}

export async function deleteSession(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthenticated' }

  const { error } = await supabase.from('sessions').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/sessions')
  revalidatePath('/rota')
  return { error: null }
}

export async function assignPartner(sessionId: string, profileId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthenticated' }

  const { error } = await supabase.from('rota_assignments').insert({
    session_id: sessionId,
    profile_id: profileId,
    created_by: user.id,
  })

  if (error) return { error: error.message }
  revalidatePath('/sessions')
  revalidatePath('/rota')
  return { error: null }
}

export async function removeAssignment(assignmentId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthenticated' }

  const { error } = await supabase.from('rota_assignments').delete().eq('id', assignmentId)
  if (error) return { error: error.message }
  revalidatePath('/sessions')
  revalidatePath('/rota')
  return { error: null }
}
