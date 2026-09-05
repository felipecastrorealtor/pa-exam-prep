import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import QuizSession from '@/components/study/QuizSession'

interface Props {
  params: { unitId: string }
  searchParams: { mode?: 'review' | 'exam'; scope?: 'complete' | 'focus' }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: `Unit ${params.unitId} — Study` }
}

export default async function UnitStudyPage({ params, searchParams }: Props) {
  const unitId = parseInt(params.unitId, 10)
  if (isNaN(unitId)) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Load unit metadata
  const { data: unit } = await supabase
    .from('units')
    .select('id, title_en, title_es, enabled')
    .eq('id', unitId)
    .single()

  if (!unit || !unit.enabled) notFound()

  // Load questions for this unit (both EN + ES)
  // Focus mode draws only from the questions teachers marked essential.
  // An explicit ?scope= wins (the exam offers its own choice); otherwise the
  // student's saved preference applies.
  const { data: prog } = await supabase
    .from('user_progress')
    .select('study_mode')
    .eq('user_id', user.id)
    .single()

  const savedMode = (prog as { study_mode?: string } | null)?.study_mode ?? 'complete'
  const focusOnly = (searchParams.scope ?? savedMode) === 'focus'

  let query = supabase
    .from('questions')
    .select(`
      id, legacy_id, question_en, option_a_en, option_b_en, option_c_en, option_d_en,
      correct, explanation_en, page_ref, is_essential,
      question_translations (
        question_es, option_a_es, option_b_es, option_c_es, option_d_es, explanation_es
      )
    `)
    .eq('unit_id', unitId)
    .eq('enabled', true)

  if (focusOnly) query = query.eq('is_essential', true)

  let { data: questions } = await query.order('legacy_id')

  // Never leave a student staring at an empty unit because nothing in it has
  // been marked essential yet — fall back to the full set.
  if (focusOnly && (!questions || questions.length === 0)) {
    const fallback = await supabase
      .from('questions')
      .select(`
        id, legacy_id, question_en, option_a_en, option_b_en, option_c_en, option_d_en,
        correct, explanation_en, page_ref, is_essential,
        question_translations (
          question_es, option_a_es, option_b_es, option_c_es, option_d_es, explanation_es
        )
      `)
      .eq('unit_id', unitId)
      .eq('enabled', true)
      .order('legacy_id')
    questions = fallback.data
  }

  if (!questions || questions.length === 0) notFound()

  // Load existing attempts for this user (to show mastery state)
  const questionIds = questions.map((q) => q.id)
  const { data: attempts } = await supabase
    .from('question_attempts')
    .select('question_id, attempts, correct, mastery')
    .eq('user_id', user.id)
    .in('question_id', questionIds)

  const attemptMap: Record<string, { attempts: number; correct: number; mastery: number }> = {}
  for (const a of attempts ?? []) {
    attemptMap[a.question_id] = { attempts: a.attempts, correct: a.correct, mastery: a.mastery }
  }

  // User preferences
  const { data: profile } = await supabase
    .from('profiles')
    .select('preferred_lang')
    .eq('id', user.id)
    .single()

  const lang = (profile?.preferred_lang as 'en' | 'es') ?? 'en'
  const mode = searchParams.mode ?? 'quiz'

  // Serialize for client component
  const serializedQuestions = questions.map((q) => ({
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
      unitId={unitId}
      unitTitleEn={unit.title_en}
      unitTitleEs={unit.title_es}
      questions={serializedQuestions}
      initialLang={lang}
      mode={mode as 'quiz' | 'review' | 'exam'}
    />
  )
}
