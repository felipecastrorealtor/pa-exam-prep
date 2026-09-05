/**
 * PATCH /api/admin/questions  — update one question and its Spanish translation
 * POST  /api/admin/questions  — create a new question in a unit
 * Admin only. Role is verified server-side on every call.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthenticated' as const, supabase: null, user: null }

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()

  if ((profile as { role?: string } | null)?.role !== 'admin') {
    return { error: 'forbidden' as const, supabase: null, user: null }
  }
  return { error: null, supabase, user }
}

const LETTERS = ['A', 'B', 'C', 'D']

export async function PATCH(req: NextRequest) {
  const { error: authErr, supabase } = await requireAdmin()
  if (authErr) return NextResponse.json({ error: authErr }, { status: authErr === 'forbidden' ? 403 : 401 })

  const body = await req.json()
  const { id, en, es } = body as {
    id: string
    en?: Record<string, unknown>
    es?: Record<string, unknown>
  }
  if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 })

  if (en) {
    if (en.correct != null && !LETTERS.includes(String(en.correct))) {
      return NextResponse.json({ error: 'correct must be A, B, C or D' }, { status: 400 })
    }
    const patch: Record<string, unknown> = {}
    for (const k of ['question_en','option_a_en','option_b_en','option_c_en','option_d_en','correct','explanation_en','page_ref','enabled','is_essential']) {
      if (k in en) patch[k] = en[k]
    }
    if (Object.keys(patch).length) {
      const { error } = await supabase!.from('questions').update(patch).eq('id', id)
      if (error) {
        console.error('[admin/questions] update EN failed:', error)
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
    }
  }

  if (es) {
    const patch: Record<string, unknown> = { question_id: id }
    for (const k of ['question_es','option_a_es','option_b_es','option_c_es','option_d_es','explanation_es']) {
      if (k in es) patch[k] = es[k]
    }
    // upsert — a question may not have a translation row yet
    const { error } = await supabase!.from('question_translations').upsert(patch, { onConflict: 'question_id' })
    if (error) {
      console.error('[admin/questions] update ES failed:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
  }

  return NextResponse.json({ ok: true })
}

export async function POST(req: NextRequest) {
  const { error: authErr, supabase } = await requireAdmin()
  if (authErr) return NextResponse.json({ error: authErr }, { status: authErr === 'forbidden' ? 403 : 401 })

  const { unit_id, en, es } = await req.json()
  if (!unit_id) return NextResponse.json({ error: 'missing unit_id' }, { status: 400 })
  if (!LETTERS.includes(String(en?.correct))) {
    return NextResponse.json({ error: 'correct must be A, B, C or D' }, { status: 400 })
  }

  // next legacy_id within the unit
  const { data: last } = await supabase!
    .from('questions')
    .select('legacy_id')
    .eq('unit_id', unit_id)
    .order('legacy_id', { ascending: false })
    .limit(1)

  const nextId = (((last as { legacy_id: number }[] | null)?.[0]?.legacy_id) ?? 0) + 1

  const { data: created, error } = await supabase!
    .from('questions')
    .insert({ unit_id, legacy_id: nextId, ...en })
    .select('id')
    .single()

  if (error) {
    console.error('[admin/questions] insert failed:', error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  const newId = (created as { id: string }).id

  if (es && Object.keys(es).length) {
    const { error: esErr } = await supabase!
      .from('question_translations')
      .insert({ question_id: newId, ...es })
    if (esErr) console.error('[admin/questions] insert ES failed:', esErr)
  }

  return NextResponse.json({ ok: true, id: newId, legacy_id: nextId })
}
