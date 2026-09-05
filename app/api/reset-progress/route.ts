/**
 * POST /api/reset-progress
 * Wipes everything the signed-in user has accumulated: answered questions,
 * study sessions, flashcard scheduling and unlocked achievements, then puts
 * user_progress back to its starting values.
 *
 * Body: { confirm: 'RESET' }  — a deliberate second step, since this is
 * irreversible and there is no undo.
 *
 * Runs the deletes through the service-role client because the schema grants
 * select/insert/update on these tables but no DELETE policy — under the user's
 * own client every delete would match zero rows and report success, so the
 * reset would look like it worked while leaving the data in place.
 *
 * The identity always comes from the verified session below, never from the
 * request body, so this can only ever erase the caller's own rows.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

    const body = await req.json().catch(() => null)
    if (body?.confirm !== 'RESET') {
      return NextResponse.json({ error: 'confirmation_required' }, { status: 400 })
    }

    const admin = await createAdminClient()
    const failures: string[] = []

    for (const table of [
      'question_attempts',
      'study_sessions',
      'flashcard_progress',
      'user_achievements',
    ] as const) {
      const { error } = await admin.from(table).delete().eq('user_id', user.id)
      if (error) {
        console.error(`[reset-progress] ${table}:`, error.message)
        failures.push(table)
      }
    }

    const { error: progErr } = await admin
      .from('user_progress')
      .update({
        xp: 0,
        level: 1,
        daily_streak: 0,
        longest_streak: 0,
        last_study_date: null,
        today_questions: 0,
        total_questions: 0,
        total_correct: 0,
        total_sessions: 0,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)

    if (progErr) {
      console.error('[reset-progress] user_progress:', progErr.message)
      failures.push('user_progress')
    }

    if (failures.length > 0) {
      return NextResponse.json(
        { error: 'partial_failure', tables: failures },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[reset-progress] unexpected:', err)
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}
