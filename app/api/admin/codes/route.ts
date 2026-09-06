/**
 * POST   /api/admin/codes — generate one code, or a batch of single-use codes
 * PATCH  /api/admin/codes — activate / deactivate a code
 *
 * `access_codes` carries no RLS policy on purpose: only the service role may
 * touch it. So every read and write goes through the server, after the caller's
 * admin role is verified here.
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

const TYPES = new Set(['free_30d', 'promo_15', 'free_12m', 'lifetime', 'custom'])

// No I, O, 0 or 1 — these get read aloud and typed in by hand.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function randomCode(prefix: string, len = 6): string {
  let out = prefix
  const bytes = new Uint8Array(len)
  crypto.getRandomValues(bytes)
  for (let i = 0; i < len; i++) out += ALPHABET[bytes[i] % ALPHABET.length]
  return out
}

export async function POST(req: NextRequest) {
  const authErr = await requireAdmin()
  if (authErr) {
    return NextResponse.json({ error: authErr }, { status: authErr === 'forbidden' ? 403 : 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }

  const type = String(body.type ?? 'free_30d')
  if (!TYPES.has(type)) return NextResponse.json({ error: 'bad_type' }, { status: 400 })

  const durationDays = Math.max(1, Math.min(36_500, Number(body.duration_days ?? 30) || 30))
  const quantity     = Math.max(1, Math.min(200, Number(body.quantity ?? 1) || 1))

  // null = unlimited uses. Only honoured for a single code; a batch is always
  // one use per code, which is the point of generating a batch.
  const rawMax  = body.max_uses
  const maxUses = quantity > 1
    ? 1
    : (rawMax === null || rawMax === '' || rawMax === undefined
        ? null
        : Math.max(1, Number(rawMax) || 1))

  const prefix = String(body.prefix ?? 'PA').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6) || 'PA'
  const label  = body.batch_label ? String(body.batch_label).slice(0, 120) : null
  const notes  = body.notes ? String(body.notes).slice(0, 500) : null

  // An explicit single code the admin typed in, otherwise generate.
  const explicit = typeof body.code === 'string' && body.code.trim()
    ? body.code.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '')
    : null

  const rows = Array.from({ length: quantity }, (_, i) => ({
    code:          quantity === 1 && explicit ? explicit : randomCode(prefix),
    type,
    duration_days: durationDays,
    max_uses:      maxUses,
    notes,
    batch_label:   label,
    active:        true,
  }))

  const admin = await createAdminClient()

  // A generated code can, very rarely, collide with an existing one. Retry the
  // whole insert with fresh codes rather than handing back a partial batch.
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data, error } = await admin.from('access_codes').insert(rows).select()
    if (!error) return NextResponse.json({ ok: true, codes: data })

    if (error.code === '23505' && !explicit) {
      for (const r of rows) r.code = randomCode(prefix)
      continue
    }
    if (/batch_label/.test(error.message)) {
      return NextResponse.json({ error: 'column_missing' }, { status: 501 })
    }
    console.error('[admin/codes] insert failed:', error.message)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ error: 'code_collision' }, { status: 409 })
}

export async function PATCH(req: NextRequest) {
  const authErr = await requireAdmin()
  if (authErr) {
    return NextResponse.json({ error: authErr }, { status: authErr === 'forbidden' ? 403 : 401 })
  }

  let body: { id?: unknown; active?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }

  if (typeof body.id !== 'string' || typeof body.active !== 'boolean') {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }

  const admin = await createAdminClient()
  const { data, error } = await admin
    .from('access_codes')
    .update({ active: body.active })
    .eq('id', body.id)
    .select('id')

  if (error) {
    console.error('[admin/codes] update failed:', error.message)
    return NextResponse.json({ error: 'update_failed' }, { status: 500 })
  }
  if (!data || data.length === 0) {
    console.error('[admin/codes] update affected no rows for', body.id)
    return NextResponse.json({ error: 'no_rows_updated' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
