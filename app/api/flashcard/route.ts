/**
 * POST /api/flashcard
 * Upsert flashcard_progress after a flip review.
 *
 * Body: { questionId: string, knew: boolean, newBox: number, nextReview: string }
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body?.questionId || typeof body.knew !== 'boolean') {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  const { questionId, newBox, nextReview } = body

  // Upsert (user_id + question_id is unique)
  const { error } = await supabase
    .from('flashcard_progress')
    .upsert(
      {
        user_id:        user.id,
        question_id:    questionId,
        box:            newBox ?? 1,
        next_review_at: nextReview,
        last_reviewed_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,question_id' }
    )

  if (error) {
    console.error('flashcard upsert error:', error)
    return NextResponse.json({ error: 'db_error' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
