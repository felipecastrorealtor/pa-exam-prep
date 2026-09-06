import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import QuizSession from '@/components/study/QuizSession'

interface Props {
  params: { unitId: string }
  searchParams: {
    mode?:  'review' | 'exam'
    scope?: 'complete' | 'focus'
    /** 'all' | number — cap the queue length (mock exam, quick practice) */
    limit?: string
    /** adaptive (default) | weak | new | random */
    pick?:  string
  }
}

const SELECT = `
  id, legacy_id, unit_id, question_en, option_a_en, option_b_en, option_c_en, option_d_en,
  correct, explanation_en, page_ref, is_essential,
  question_translations (
    question_es, option_a_es, option_b_es, option_c_es, option_d_es, explanation_es
  )
`

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    title: params.unitId === 'all' ? 'All units — Study' : `Unit ${params.unitId} — Study`,
  }
}

export default async function UnitStudyPage({ params, searchParams }: Props) {
  const isAll  = params.unitId === 'all'
  const unitId = isAll ? 0 : parseInt(params.unitId, 10)
  if (!isAll && isNaN(unitId)) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('preferred_lang').eq('id', user.id).single()
  const lang = (profile?.preferred_lang as 'en' | 'es') ?? 'en'
  const isEs = lang === 'es'

  // ── Unit label ──
  let titleEn = isEs ? 'Todas las unidades' : 'All units'
  let titleEs: string | null = 'Todas las unidades'

  if (!isAll) {
    const { data: unit } = await supabase
      .from('units').select('id, title_en, title_es, enabled').eq('id', unitId).single()
    if (!unit || !unit.enabled) notFound()
    titleEn = unit.title_en
    titleEs = unit.title_es
  }

  // ── Scope: an explicit ?scope= wins; otherwise the saved preference. ──
  const { data: prog } = await supabase
    .from('user_progress').select('study_mode').eq('user_id', user.id).single()
  const savedMode = (prog as { study_mode?: string } | null)?.study_mode ?? 'complete'
  const focusOnly = (searchParams.scope ?? savedMode) === 'focus'

  // Units the admin has taken out of Focus mode. They stay fully available in
  // Complete mode; Focus simply never draws from them.
  const { data: skipRows } = await supabase
    .from('units').select('id').eq('focus_enabled', false)
  const focusSkip = (skipRows ?? []).map((u: { id: number }) => u.id)

  // Opening an excluded unit directly is a deliberate act, so serve its whole
  // set rather than an empty screen.
  const unitExcluded = !isAll && focusSkip.includes(unitId)

  async function load(focus: boolean) {
    let q = supabase.from('questions').select(SELECT).eq('enabled', true)
    if (!isAll) q = q.eq('unit_id', unitId)
    if (focus) {
      q = q.eq('is_essential', true)
      if (isAll && focusSkip.length) q = q.not('unit_id', 'in', `(${focusSkip.join(',')})`)
    }
    const { data } = await q.order('unit_id').order('legacy_id')
    return data
  }

  let questions = await load(focusOnly && !unitExcluded)

  // Never strand a student on an empty set because nothing is marked essential.
  if (focusOnly && (!questions || questions.length === 0)) questions = await load(false)
  if (!questions || questions.length === 0) notFound()

  // ── Prior attempts drive both the mastery dots and the adaptive ordering ──
  const { data: attempts } = await supabase
    .from('question_attempts')
    .select('question_id, attempts, correct, mastery')
    .eq('user_id', user.id)
    .in('question_id', questions.map((q) => q.id))

  const attemptMap: Record<string, { attempts: number; correct: number; mastery: number }> = {}
  for (const a of attempts ?? []) {
    attemptMap[a.question_id] = { attempts: a.attempts, correct: a.correct, mastery: a.mastery }
  }

  // ── Selection: same four modes the original app offered ──
  const pick = searchParams.pick ?? 'adaptive'
  let pool = questions.slice()

  if (pick === 'weak') {
    pool = pool.filter((q) => {
      const a = attemptMap[q.id]
      return a && a.attempts > a.correct
    })
    if (pool.length === 0) pool = questions.slice()
  } else if (pick === 'new') {
    pool = pool.filter((q) => !attemptMap[q.id])
    if (pool.length === 0) pool = questions.slice()
  }

  if (pick === 'random' || searchParams.mode === 'exam') {
    // Deterministic per-request shuffle — Fisher-Yates.
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[pool[i], pool[j]] = [pool[j], pool[i]]
    }
  } else if (pick === 'adaptive') {
    // Least-mastered first, unseen ahead of mastered.
    pool.sort((a, b) => {
      const ma = attemptMap[a.id]?.mastery ?? 0
      const mb = attemptMap[b.id]?.mastery ?? 0
      if (ma !== mb) return ma - mb
      return (a.unit_id - b.unit_id) || (a.legacy_id - b.legacy_id)
    })
  }

  const limitRaw = searchParams.limit
  const limit = limitRaw && limitRaw !== 'all' ? parseInt(limitRaw, 10) : null
  if (limit && limit > 0) pool = pool.slice(0, limit)

  const serializedQuestions = pool.map((q) => ({
    id:            q.id,
    legacyId:      q.legacy_id,
    questionEn:    q.question_en,
    optionAEn:     q.option_a_en,
    optionBEn:     q.option_b_en,
    optionCEn:     q.option_c_en,
    optionDEn:     q.option_d_en,
    correct:       q.correct as 'A' | 'B' | 'C' | 'D',
    explanationEn: q.explanation_en ?? '',
    pageRef:       q.page_ref ?? null,
    questionEs:    (q.question_translations as any)?.question_es ?? null,
    optionAEs:     (q.question_translations as any)?.option_a_es ?? null,
    optionBEs:     (q.question_translations as any)?.option_b_es ?? null,
    optionCEs:     (q.question_translations as any)?.option_c_es ?? null,
    optionDEs:     (q.question_translations as any)?.option_d_es ?? null,
    explanationEs: (q.question_translations as any)?.explanation_es ?? null,
    mastery:       attemptMap[q.id]?.mastery ?? 0,
    attempts:      attemptMap[q.id]?.attempts ?? 0,
  }))

  return (
    <QuizSession
      unitId={isAll ? 0 : unitId}
      unitTitleEn={titleEn}
      unitTitleEs={titleEs}
      questions={serializedQuestions}
      initialLang={lang}
      mode={(searchParams.mode ?? 'quiz') as 'quiz' | 'review' | 'exam'}
    />
  )
}
