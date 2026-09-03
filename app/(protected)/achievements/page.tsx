import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import clsx from 'clsx'

export const metadata: Metadata = { title: 'Achievements — PA Exam Prep' }

const ACHIEVEMENT_ICONS: Record<string, string> = {
  first_question: '🌱',
  q50:            '📚',
  q100:           '🎯',
  q250:           '⭐',
  q500:           '🏆',
  streak_3:       '🔥',
  streak_7:       '💥',
  streak_30:      '🌟',
  session_10:     '🎓',
  session_50:     '🦅',
}

export default async function AchievementsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('preferred_lang')
    .eq('id', user.id)
    .single()
  const lang = (profile?.preferred_lang as 'en' | 'es') ?? 'en'

  // All achievements (definition table)
  const { data: allAchievements } = await supabase
    .from('achievements')
    .select('id, name_en, name_es, description_en, description_es, xp_reward')
    .order('xp_reward')

  // User's unlocked achievements
  const { data: unlocked } = await supabase
    .from('user_achievements')
    .select('achievement_id, unlocked_at')
    .eq('user_id', user.id)

  const unlockedMap: Record<string, string> = {}
  for (const u of unlocked ?? []) {
    unlockedMap[u.achievement_id] = u.unlocked_at
  }

  const achievements = allAchievements ?? []
  const unlockedCount = achievements.filter((a) => unlockedMap[a.id]).length

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {lang === 'es' ? 'Logros' : 'Achievements'}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {unlockedCount} / {achievements.length}{' '}
          {lang === 'es' ? 'desbloqueados' : 'unlocked'}
        </p>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-amber-500 rounded-full transition-all duration-700"
          style={{ width: `${achievements.length > 0 ? (unlockedCount / achievements.length) * 100 : 0}%` }}
        />
      </div>

      {/* Grid */}
      <div className="grid sm:grid-cols-2 gap-3">
        {achievements.map((a) => {
          const isUnlocked = !!unlockedMap[a.id]
          const icon = ACHIEVEMENT_ICONS[a.id] ?? '🏅'
          const name = lang === 'es' ? (a.name_es ?? a.name_en) : a.name_en
          const desc = lang === 'es' ? (a.description_es ?? a.description_en) : a.description_en

          return (
            <div
              key={a.id}
              className={clsx(
                'card p-4 flex items-start gap-3 transition-all',
                isUnlocked
                  ? 'border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10'
                  : 'opacity-50 grayscale'
              )}
            >
              <div className={clsx(
                'text-3xl flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center',
                isUnlocked ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-gray-100 dark:bg-gray-800'
              )}>
                {isUnlocked ? icon : '🔒'}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {name}
                  </p>
                  <span className="flex-shrink-0 text-xs text-amber-600 dark:text-amber-400 font-medium">
                    +{a.xp_reward} XP
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{desc}</p>
                {isUnlocked && unlockedMap[a.id] && (
                  <p className="text-xs text-amber-500 mt-1">
                    {new Date(unlockedMap[a.id]).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
