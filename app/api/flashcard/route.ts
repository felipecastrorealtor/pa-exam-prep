/**
 * POST /api/flashcard
 * Record one glossary flashcard review and schedule the next one.
 *
 * Body: { termId: string, rating: 'hard' | 'good' | 'easy' }
 *
 * Scheduling is SM-2 shaped and matches the columns the schema actually has
 * (ease_factor / interval_days / repetitions / due_at). The previous version
 * wrote question_id/box/next_review_at, which do not exist on this table —
 * every write silently failed, which is why no flashcard progress was ever saved.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const MAX_INTERVAL = 180

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

    const body = await req.json().catch(() => null)
    const termId = body?.termId
    const rating = body?.rating as 'hard' | 'good' | 'easy' | undefined

    if (!termId || !rating || !['hard', 'good', 'easy'].includes(rating)) {
      return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
    }

    const { data: prev } = await supabase
      .from('flashcard_progress')
      .select('ease_factor, interval_days, repetitions')
      .eq('user_id', user.id)
      .eq('term_id', termId)
      .maybeSingle()

    const prevEase = Number(prev?.ease_factor ?? 2.5)
    const prevInt  = Number(prev?.interval_days ?? 0)
    const prevReps = Number(prev?.repetitions ?? 0)

    let ease = prevEase
    let interval: number
    let reps: number

    if (rating === 'hard') {
      ease     = Math.max(1.3, prevEase - 0.2)
      interval = 1
      reps     = 0
    } else {
      ease = rating === 'easy' ? Math.min(3.0, prevEase + 0.15) : prevEase
      reps = prevReps + 1
      if (reps === 1)      interval = rating === 'easy' ? 3 : 1
      else if (reps === 2) interval = rating === 'easy' ? 7 : 4
      else                 interval = Math.round(prevInt * ease) || 4
      interval = Math.min(MAX_INTERVAL, Math.max(1, interval))
    }

    const due = new Date()
    due.setDate(due.getDate() + interval)

    const { error } = await supabase
      .from('flashcard_progress')
      .upsert(
        {
          user_id:       user.id,
          term_id:       termId,
          ease_factor:   ease,
          interval_days: interval,
          repetitions:   reps,
          due_at:        due.toISOString(),
          last_review:   new Date().toISOString(),
          updated_at:    new Date().toISOString(),
        },
        { onConflict: 'user_id,term_id' }
      )

    if (error) {
      console.error('[flashcard] upsert error:', error.message)
      return NextResponse.json({ error: 'db_error' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, interval, reps })
  } catch (err) {
    console.error('[flashcard] unexpected:', err)
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}
