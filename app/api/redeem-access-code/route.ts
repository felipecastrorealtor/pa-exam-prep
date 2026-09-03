import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  // Auth check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ ok: false, error: 'unauthenticated' }, { status: 401 })
  }

  // Parse body
  let code: string
  try {
    const body = await req.json()
    code = (body.code ?? '').trim().toUpperCase()
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_body' }, { status: 400 })
  }

  if (!code) {
    return NextResponse.json({ ok: false, error: 'missing_code' }, { status: 400 })
  }

  // Redeem via the atomic DB function (validates + increments + grants access)
  const supabaseAdmin = await createAdminClient()
  const { data, error } = await supabaseAdmin.rpc('redeem_access_code', {
    p_user_id: user.id,
    p_code:    code,
  })

  if (error) {
    console.error('redeem_access_code RPC error:', error)
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 })
  }

  return NextResponse.json(data)
}
