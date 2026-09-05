import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import StudyLauncher, { type UnitRow } from '@/components/study/StudyLauncher'

export const metadata: Metadata = { title: 'Study — PA Real Estate Prep' }
export const dynamic = 'force-dynamic'

export default async function StudyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: units }, { data: progress }] = await Promise.all([
    supabase.from('profiles').select('preferred_lang').eq('id', user.id).single(),
    supabase.from('units')
      .select('id, title_en, title_es, is_pa_specific')
      .eq('enabled', true).order('sort_order'),
    supabase.from('user_progress').select('study_mode').eq('user_id', user.id).single(),
  ])

  const lang: 'en' | 'es' = (profile?.preferred_lang as 'en' | 'es') ?? 'en'

  // Question count per unit
  const { data: allQuestions } = await supabase
    .from('questions').select('id, unit_id').eq('enabled', true)

  const countByUnit: Record<number, number> = {}
  for (const q of allQuestions ?? []) {
    countByUnit[q.unit_id] = (countByUnit[q.unit_id] ?? 0) + 1
  }

  // The student's own answers per unit
  const { data: attempts } = await supabase
    .from('question_attempts')
    .select('attempts, correct, questions!inner(unit_id)')
    .eq('user_id', user.id)

  const statsByUnit: Record<number, { t: number; c: number }> = {}
  for (const a of (attempts ?? []) as any[]) {
    const uid = a.questions?.unit_id
    if (!uid) continue
    statsByUnit[uid] ??= { t: 0, c: 0 }
    statsByUnit[uid].t += a.attempts ?? 0
    statsByUnit[uid].c += a.correct ?? 0
  }

  const rows: UnitRow[] = (units ?? []).map((u) => ({
    id:            u.id,
    titleEn:       u.title_en,
    titleEs:       u.title_es,
    isPa:          Boolean((u as any).is_pa_specific),
    questionCount: countByUnit[u.id] ?? 0,
    answered:      statsByUnit[u.id]?.t ?? 0,
    correct:       statsByUnit[u.id]?.c ?? 0,
  }))

  return (
    <StudyLauncher
      units={rows}
      lang={lang}
      studyMode={((progress as any)?.study_mode as 'complete' | 'focus') ?? 'complete'}
    />
  )
}
