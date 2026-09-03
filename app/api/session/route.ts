/**
 * POST /api/session
 * Create a new study session record (called at end of quiz).
 *
 * Body: {
 *   unitId?: number
 *   sessionType: 'quiz'|'flashcard'|'review'|'exam'
 *   questionsAnswered: number
 *   correct: number
 *   durationSec: number
 *   lang: 'en'|'es'
 * }
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'invalid_body' }, { status: 400 })

  const {
    unitId,
    sessionType = 'quiz',
    questionsAnswered = 0,
    correct = 0,
    durationSec,
    lang = 'en',
  } = body

  const scorePct = questionsAnswered > 0
    ? Math.round((correct / questionsAnswered) * 100 * 100) / 100
    : null

  const { data: session, error } = await supabase
    .from('study_sessions')
    .insert({
      user_id:            user.id,
      session_type:       sessionType,
      unit_id:            unitId ?? null,
      questions_answered: questionsAnswered,
      correct,
      duration_sec:       durationSec ?? null,
      score_pct:          scorePct,
      lang,
      completed_at:       new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error) {
    console.error('session insert error:', error)
    return NextResponse.json({ error: 'db_error' }, { status: 500 })
  }

  // Atomic increment via RPC (avoids race conditions)
  await supabase.rpc('increment_sessions' as any, { p_user_id: user.id })

  return NextResponse.json({ sessionId: session?.id })
}
