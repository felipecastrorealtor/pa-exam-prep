import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import FlashcardSession, { type GlossaryCard } from '@/components/flashcards/FlashcardSession'

export const metadata: Metadata = { title: 'Flashcards — PA Exam Prep' }
export const dynamic = 'force-dynamic'

export default async function FlashcardsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: terms }, { data: profile }, { data: prog }] = await Promise.all([
    supabase.from('glossary_terms')
      .select('id, term_en, term_es, definition_en, definition_es, unit_ids')
      .eq('enabled', true).order('term_en'),
    supabase.from('profiles').select('preferred_lang').eq('id', user.id).single(),
    supabase.from('flashcard_progress')
      .select('term_id, interval_days, repetitions, due_at')
      .eq('user_id', user.id),
  ])

  const lang = (profile?.preferred_lang as 'en' | 'es') ?? 'en'

  const progressMap: Record<string, { interval: number; reps: number; due: string | null }> = {}
  for (const p of prog ?? []) {
    progressMap[p.term_id] = {
      interval: p.interval_days ?? 0,
      reps:     p.repetitions ?? 0,
      due:      p.due_at ?? null,
    }
  }

  const cards: GlossaryCard[] = (terms ?? []).map((t) => ({
    id:           t.id,
    termEn:       t.term_en,
    termEs:       t.term_es,
    definitionEn: t.definition_en,
    definitionEs: t.definition_es,
    unitIds:      (t.unit_ids as number[] | null) ?? [],
    interval:     progressMap[t.id]?.interval ?? 0,
    reps:         progressMap[t.id]?.reps ?? 0,
    due:          progressMap[t.id]?.due ?? null,
  }))

  return <FlashcardSession cards={cards} initialLang={lang} />
}
