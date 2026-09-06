/**
 * PATCH /api/admin/reports — triage a student's error report.
 *
 * error_reports has an admin RLS policy, but the write still goes through here
 * so the role is checked in one place and the client never needs to know the
 * table exists.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

const STATUSES = new Set(['open', 'resolved', 'dismissed'])

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if ((profile as { role?: string } | null)?.role !== 'admin') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  let body: { id?: unknown; status?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }

  if (typeof body.id !== 'string' || typeof body.status !== 'string' || !STATUSES.has(body.status)) {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }

  const admin = await createAdminClient()
  const { error } = await admin
    .from('error_reports')
    .update({
      status: body.status,
      resolved_at: body.status === 'open' ? null : new Date().toISOString(),
    })
    .eq('id', body.id)

  if (error) {
    console.error('[admin/reports] update failed:', error.message)
    return NextResponse.json({ error: 'update_failed' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
