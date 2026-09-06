/**
 * PATCH /api/admin/units — flip a unit's availability or its Focus-mode use.
 *
 * The browser can't write to `units` (no RLS policy grants it), so the toggle
 * goes through here: the role is verified server-side and the write runs with
 * the service-role client.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 'unauthenticated' as const

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()

  return (profile as { role?: string } | null)?.role === 'admin' ? null : ('forbidden' as const)
}

export async function PATCH(req: NextRequest) {
  const authErr = await requireAdmin()
  if (authErr) {
    return NextResponse.json({ error: authErr }, { status: authErr === 'forbidden' ? 403 : 401 })
  }

  let body: { id?: unknown; enabled?: unknown; focus_enabled?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }

  const id = Number(body.id)
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }

  const patch: Record<string, boolean> = {}
  if (typeof body.enabled === 'boolean')       patch.enabled = body.enabled
  if (typeof body.focus_enabled === 'boolean') patch.focus_enabled = body.focus_enabled
  if (!Object.keys(patch).length) {
    return NextResponse.json({ error: 'nothing_to_update' }, { status: 400 })
  }

  const admin = await createAdminClient()
  // .select() so a write that matched no row can be told apart from one that
  // worked. Without it PostgREST answers 204 either way, and a blocked update
  // looks exactly like a successful one.
  const { data, error } = await admin.from('units').update(patch).eq('id', id).select('id')

  if (!error && (!data || data.length === 0)) {
    console.error('[admin/units] update affected no rows for unit', id)
    return NextResponse.json({ error: 'no_rows_updated' }, { status: 500 })
  }

  if (error) {
    const missing = /focus_enabled/.test(error.message)
    console.error('[admin/units] update failed:', error.message)
    return NextResponse.json(
      { error: missing ? 'column_missing' : 'update_failed' },
      { status: missing ? 501 : 500 },
    )
  }

  return NextResponse.json({ ok: true, id, ...patch })
}
