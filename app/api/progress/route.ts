/**
 * POST /api/progress
 * Record a single question attempt and update user_progress.
 * Called by the quiz client after each answer.
 *
 * Body: {
 *   questionId: string (UUID)
 *   unitId: number
 *   correct: boolean
 *   answer: 'A'|'B'|'C'|'D'
 *   lang: 'en'|'es'
 * }
 *
 * Returns: { xp: number, newAchievements: string[], streakUpdated: boolean }
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

const XP_CORRECT   = 10
const XP_INCORRECT = 2
const XP_MASTERED  = 25  // bonus when a question reaches mastery=3

// Mastery thresholds: consecutive correct needed to advance
const MASTERY_THRESHOLDS = [0, 1, 2, 3] // attempts to reach each level

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body?.questionId || typeof body.correct !== 'boolean') {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  const { questionId, unitId, correct, answer, lang = 'en' } = body
  const supabaseAdmin = await createAdminClient()

  // ── 1. Upsert question_attempts ──────────────────────────────────────────
  const { data: existing } = await supabase
    .from('question_attempts')
    .select('id, attempts, correct, mastery, last_answer')
    .eq('user_id', user.id)
    .eq('question_id', questionId)
    .single()

  const prevAttempts = existing?.attempts ?? 0
  const prevCorrect  = existing?.correct ?? 0
  const prevMastery  = existing?.mastery ?? 0

  // New mastery: advance if correct, reset if wrong (unless already mastered)
  let newMastery = prevMastery
  if (correct) {
    if (prevMastery < 3) newMastery = Math.min(3, prevMastery + 1)
  } else {
    if (prevMastery > 0) newMastery = Math.max(0, prevMastery - 1)
  }

  const justMastered = prevMastery < 3 && newMastery === 3

  if (existing) {
    await supabase
      .from('question_attempts')
      .update({
        attempts:       prevAttempts + 1,
        correct:        prevCorrect + (correct ? 1 : 0),
        mastery:        newMastery,
        last_answer:    answer,
        last_attempt_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
  } else {
    await supabase
      .from('question_attempts')
      .insert({
        user_id:        user.id,
        question_id:    questionId,
        attempts:       1,
        correct:        correct ? 1 : 0,
        mastery:        newMastery,
        last_answer:    answer,
        last_attempt_at: new Date().toISOString(),
      })
  }

  // ── 2. Update user_progress ───────────────────────────────────────────────
  const { data: progress } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const today = new Date().toISOString().split('T')[0]
  const lastStudy = progress?.last_study_date
  const isNewDay  = lastStudy !== today
  const streak    = isNewDay
    ? (lastStudy === getPrevDay(today) ? (progress?.daily_streak ?? 0) + 1 : 1)
    : (progress?.daily_streak ?? 1)

  const earnedXP = (correct ? XP_CORRECT : XP_INCORRECT) + (justMastered ? XP_MASTERED : 0)
  const newXP    = (progress?.xp ?? 0) + earnedXP
  const newLevel = Math.floor(newXP / 500) + 1

  await supabase
    .from('user_progress')
    .update({
      xp:               newXP,
      level:            newLevel,
      daily_streak:     streak,
      longest_streak:   Math.max(streak, progress?.longest_streak ?? 0),
      last_study_date:  today,
      today_questions:  isNewDay ? 1 : (progress?.today_questions ?? 0) + 1,
      total_questions:  (progress?.total_questions ?? 0) + 1,
      total_correct:    (progress?.total_correct ?? 0) + (correct ? 1 : 0),
    })
    .eq('user_id', user.id)

  // ── 3. Log analytics event ────────────────────────────────────────────────
  await supabase.from('auth_events').insert({
    user_id:    user.id,
    event:      'question_answered',
    properties: { questionId, unitId, correct, lang, mastery: newMastery },
  })

  // ── 4. Check achievements ─────────────────────────────────────────────────
  const newAchievements = await checkAchievements(user.id, supabase, supabaseAdmin, {
    totalQuestions:    (progress?.total_questions ?? 0) + 1,
    totalCorrect:      (progress?.total_correct ?? 0) + (correct ? 1 : 0),
    streak,
    totalSessions:     progress?.total_sessions ?? 0,
    lang,
  })

  return NextResponse.json({
    xp:              earnedXP,
    totalXP:         newXP,
    level:           newLevel,
    streak,
    newAchievements,
    justMastered,
    newMastery,
  })
}

function getPrevDay(dateStr: string): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() - 1)
  return d.toISOString().split('T')[0]
}

async function checkAchievements(
  userId: string,
  supabase: Awaited<ReturnType<typeof createClient>>,
  supabaseAdmin: Awaited<ReturnType<typeof createAdminClient>>,
  stats: {
    totalQuestions: number
    totalCorrect: number
    streak: number
    totalSessions: number
    lang: string
  }
): Promise<string[]> {
  // Already unlocked
  const { data: unlocked } = await supabase
    .from('user_achievements')
    .select('achievement_id')
    .eq('user_id', userId)
  const unlockedSet = new Set((unlocked ?? []).map((u) => u.achievement_id))

  const toUnlock: string[] = []

  // Check simple threshold achievements
  const checks: Array<{ id: string; pass: boolean }> = [
    { id: 'first_question', pass: stats.totalQuestions >= 1 },
    { id: 'q50',            pass: stats.totalQuestions >= 50 },
    { id: 'q100',           pass: stats.totalQuestions >= 100 },
    { id: 'q250',           pass: stats.totalQuestions >= 250 },
    { id: 'q500',           pass: stats.totalQuestions >= 500 },
    { id: 'streak_3',       pass: stats.streak >= 3 },
    { id: 'streak_7',       pass: stats.streak >= 7 },
    { id: 'streak_30',      pass: stats.streak >= 30 },
    { id: 'session_10',     pass: stats.totalSessions >= 10 },
    { id: 'session_50',     pass: stats.totalSessions >= 50 },
  ]

  for (const { id, pass } of checks) {
    if (pass && !unlockedSet.has(id)) toUnlock.push(id)
  }

  if (toUnlock.length === 0) return []

  // Grant achievements
  await supabase.from('user_achievements').insert(
    toUnlock.map((achievement_id) => ({ user_id: userId, achievement_id }))
  )

  // Award XP for each achievement
  const { data: achData } = await supabase
    .from('achievements')
    .select('id, xp_reward')
    .in('id', toUnlock)

  const bonusXP = (achData ?? []).reduce((sum, a) => sum + (a.xp_reward ?? 0), 0)
  if (bonusXP > 0) {
    await supabase.rpc('increment_xp' as any, { p_user_id: userId, p_xp: bonusXP })
  }

  return toUnlock
}
