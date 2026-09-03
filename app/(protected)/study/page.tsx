import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Study' }

export default async function StudyPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Load units (enabled only)
  const { data: units } = await supabase
    .from('units')
    .select('id, title_en, title_es')
    .eq('enabled', true)
    .order('sort_order')

  // Load user progress
  const { data: progress } = await supabase
    .from('user_progress')
    .select('xp, level, daily_streak, today_questions, daily_goal, total_questions, total_correct')
    .eq('user_id', user.id)
    .single()

  // Mastery counts per unit (for progress bars)
  const { data: mastery } = await supabase
    .from('question_attempts')
    .select('question_id, mastery, questions!inner(unit_id)')
    .eq('user_id', user.id)
    .eq('mastery', 3) // mastered only

  const masteredByUnit: Record<number, number> = {}
  for (const m of mastery ?? []) {
    const unitId = (m.questions as any)?.unit_id
    if (unitId) masteredByUnit[unitId] = (masteredByUnit[unitId] ?? 0) + 1
  }

  return (
    <div className="space-y-8">
      {/* XP Bar */}
      <section className="card">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-amber-400 font-bold text-lg">Level {progress?.level ?? 1}</span>
            <span className="text-slate-500 text-sm ml-2">· {progress?.xp ?? 0} XP</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-400">
            <span>🔥 {progress?.daily_streak ?? 0} day streak</span>
            <span>·</span>
            <span>{progress?.today_questions ?? 0} / {progress?.daily_goal ?? 20} today</span>
          </div>
        </div>
        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-500 rounded-full transition-all"
            style={{ width: `${Math.min(100, ((progress?.today_questions ?? 0) / (progress?.daily_goal ?? 20)) * 100)}%` }}
          />
        </div>
      </section>

      {/* Units grid */}
      <section>
        <h2 className="text-lg font-semibold text-slate-200 mb-4">Choose a Unit</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(units ?? []).map((unit) => (
            <a
              key={unit.id}
              href={`/study/${unit.id}`}
              className="card hover:border-amber-500/50 hover:bg-slate-800/80 transition-all group cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-mono text-slate-500 mb-1 block">
                    Unit {unit.id}
                  </span>
                  <h3 className="text-sm font-medium text-slate-200 group-hover:text-amber-400 transition-colors leading-snug">
                    {unit.title_en}
                  </h3>
                </div>
                <span className="text-slate-600 group-hover:text-amber-500 transition-colors ml-2 mt-0.5">
                  →
                </span>
              </div>
              {masteredByUnit[unit.id] !== undefined && (
                <div className="mt-3">
                  <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{
                        width: `${Math.min(100, ((masteredByUnit[unit.id] ?? 0) / 20) * 100)}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    {masteredByUnit[unit.id]} mastered
                  </p>
                </div>
              )}
            </a>
          ))}
        </div>
      </section>

      {/* Overall stats */}
      <section className="card">
        <h2 className="text-sm font-medium text-slate-400 mb-4 uppercase tracking-wider">
          Overall Progress
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Questions Answered', value: progress?.total_questions ?? 0 },
            { label: 'Correct', value: progress?.total_correct ?? 0 },
            {
              label: 'Accuracy',
              value: progress?.total_questions
                ? `${Math.round(((progress.total_correct ?? 0) / progress.total_questions) * 100)}%`
                : '—',
            },
            { label: 'Streak', value: `${progress?.daily_streak ?? 0}d` },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl font-bold text-slate-100 tabular-nums">
                {stat.value}
              </div>
              <div className="text-xs text-slate-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
