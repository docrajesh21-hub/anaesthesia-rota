'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { LeaveType } from '@/lib/types/database'

export interface LeaveFormData {
  start_date: string
  end_date: string
  type: LeaveType
  notes: string
}

export async function createLeaveRequest(data: LeaveFormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthenticated' }

  if (data.end_date < data.start_date) return { error: 'End date must be on or after start date' }

  const { error } = await supabase.from('leave_requests').insert({
    profile_id: user.id,
    start_date: data.start_date,
    end_date: data.end_date,
    type: data.type,
    notes: data.notes || null,
    status: 'pending',
  })

  if (error) return { error: error.message }
  revalidatePath('/leave')
  revalidatePath('/rota')
  return { error: null }
}

export async function approveLeave(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthenticated' }

  const { error } = await supabase
    .from('leave_requests')
    .update({ status: 'approved', reviewed_by: user.id, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/leave')
  revalidatePath('/rota')
  return { error: null }
}

export async function rejectLeave(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthenticated' }

  const { error } = await supabase
    .from('leave_requests')
    .update({ status: 'rejected', reviewed_by: user.id, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/leave')
  revalidatePath('/rota')
  return { error: null }
}

export async function deleteLeaveRequest(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthenticated' }

  const { error } = await supabase.from('leave_requests').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/leave')
  revalidatePath('/rota')
  return { error: null }
}
