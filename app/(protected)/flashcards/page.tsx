import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import FlashcardSession from '@/components/flashcards/FlashcardSession'

export const metadata: Metadata = { title: 'Flashcards — PA Exam Prep' }

export default async function FlashcardsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Load all enabled questions (both EN + ES)
  // Focus mode narrows the deck to the questions teachers marked essential.
  const { data: prog } = await supabase
    .from('user_progress')
    .select('study_mode')
    .eq('user_id', user.id)
    .single()

  const focusOnly = ((prog as { study_mode?: string } | null)?.study_mode ?? 'complete') === 'focus'

  const SELECT = `
      id, legacy_id, question_en, option_a_en, option_b_en, option_c_en, option_d_en,
      correct, explanation_en, page_ref, unit_id, is_essential,
      question_translations (
        question_es, option_a_es, option_b_es, option_c_es, option_d_es, explanation_es
      )
    `

  let q = supabase.from('questions').select(SELECT).eq('enabled', true)
  if (focusOnly) q = q.eq('is_essential', true)

  let { data: questions } = await q.order('unit_id').order('legacy_id')

  // Nothing marked essential yet — don't hand the student an empty deck.
  if (focusOnly && (!questions || questions.length === 0)) {
    const all = await supabase.from('questions').select(SELECT)
      .eq('enabled', true).order('unit_id').order('legacy_id')
    questions = all.data
  }

  if (!questions || questions.length === 0) notFound()

  const questionIds = questions.map((q) => q.id)

  // Load flashcard progress
  const { data: progressRows } = await supabase
    .from('flashcard_progress')
    .select('question_id, box, next_review_at')
    .eq('user_id', user.id)
    .in('question_id', questionIds)

  const progressMap: Record<string, { box: number; nextReview: string | null }> = {}
  for (const p of progressRows ?? []) {
    progressMap[p.question_id] = { box: p.box, nextReview: p.next_review_at }
  }

  // User lang preference
  const { data: profile } = await supabase
    .from('profiles')
    .select('preferred_lang')
    .eq('id', user.id)
    .single()

  const lang = (profile?.preferred_lang as 'en' | 'es') ?? 'en'

  const serialized = questions.map((q) => ({
    id:           q.id,
    legacyId:     q.legacy_id,
    unitId:       q.unit_id,
    questionEn:   q.question_en,
    optionAEn:    q.option_a_en,
    optionBEn:    q.option_b_en,
    optionCEn:    q.option_c_en,
    optionDEn:    q.option_d_en,
    correct:      q.correct as 'A' | 'B' | 'C' | 'D',
    explanationEn: q.explanation_en ?? '',
    pageRef:      q.page_ref ?? null,
    questionEs:   (q.question_translations as any)?.question_es ?? null,
    optionAEs:    (q.question_translations as any)?.option_a_es ?? null,
    optionBEs:    (q.question_translations as any)?.option_b_es ?? null,
    optionCEs:    (q.question_translations as any)?.option_c_es ?? null,
    optionDEs:    (q.question_translations as any)?.option_d_es ?? null,
    explanationEs: (q.question_translations as any)?.explanation_es ?? null,
    box:          progressMap[q.id]?.box ?? 1,
    nextReview:   progressMap[q.id]?.nextReview ?? null,
  }))

  return <FlashcardSession questions={serialized} initialLang={lang} />
}
