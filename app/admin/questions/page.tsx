import { createClient } from '@/lib/supabase/server'
import QuestionEditor, { type AdminQuestion } from '@/components/admin/QuestionEditor'

export const dynamic = 'force-dynamic'

export default async function AdminQuestionsPage() {
  const supabase = await createClient()

  const { data: units } = await supabase
    .from('units')
    .select('id, title_en')
    .order('id')

  const { data: questions } = await supabase
    .from('questions')
    .select(`
      id, unit_id, legacy_id,
      question_en, option_a_en, option_b_en, option_c_en, option_d_en,
      correct, explanation_en, page_ref, enabled, is_essential,
      question_translations (
        question_es, option_a_es, option_b_es, option_c_es, option_d_es, explanation_es
      )
    `)
    .order('unit_id')
    .order('legacy_id')
    .limit(1000)

  const rows: AdminQuestion[] = (questions ?? []).map((q: Record<string, any>) => {
    const t = (Array.isArray(q.question_translations)
      ? q.question_translations[0]
      : q.question_translations) ?? {}
    return {
      id: q.id,
      unit_id: q.unit_id,
      legacy_id: q.legacy_id,
      question_en: q.question_en ?? '',
      option_a_en: q.option_a_en ?? '',
      option_b_en: q.option_b_en ?? '',
      option_c_en: q.option_c_en ?? '',
      option_d_en: q.option_d_en ?? '',
      correct: q.correct ?? 'A',
      explanation_en: q.explanation_en ?? '',
      page_ref: q.page_ref ?? null,
      enabled: q.enabled ?? true,
      is_essential: q.is_essential ?? false,
      question_es: t.question_es ?? '',
      option_a_es: t.option_a_es ?? '',
      option_b_es: t.option_b_es ?? '',
      option_c_es: t.option_c_es ?? '',
      option_d_es: t.option_d_es ?? '',
      explanation_es: t.explanation_es ?? '',
    }
  })

  const missingEs  = rows.filter((r) => !r.explanation_es?.trim()).length
  const essentials = rows.filter((r) => r.is_essential).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Questions</h1>
        <p className="text-sm text-gray-500 mt-1">
          {rows.length} questions across {units?.length ?? 0} units.{' '}
          <strong className="text-amber-600 dark:text-amber-400">{essentials} marked essential</strong>{' '}
          for Focus mode. Edit the text, the options, the correct answer, and both
          explanations.
        </p>
        {missingEs > 0 && (
          <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">
            {missingEs} questions have no Spanish explanation — the Spanish text currently
            sits in the English field, so students see Spanish in both languages.
          </p>
        )}
      </div>

      <QuestionEditor questions={rows} units={units ?? []} />
    </div>
  )
}
