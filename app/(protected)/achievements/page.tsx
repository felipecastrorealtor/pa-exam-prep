import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import AchievementIcon, { ACHIEVEMENT_KEYFRAMES } from '@/components/achievements/AchievementIcon'

export const metadata: Metadata = { title: 'Progress — Real Estate PA Exam' }

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
  const isEs = lang === 'es'

  const { data: allAchievements } = await supabase
    .from('achievements')
    .select('id, title_en, title_es, description_en, description_es, xp_reward')
    .order('xp_reward')

  const { data: unlocked } = await supabase
    .from('user_achievements')
    .select('achievement_id, unlocked_at')
    .eq('user_id', user.id)

  const { data: progress } = await supabase
    .from('user_progress')
    .select('xp, level, daily_streak, total_questions, total_correct')
    .eq('user_id', user.id)
    .single()

  const unlockedMap: Record<string, string> = {}
  for (const u of unlocked ?? []) {
    unlockedMap[u.achievement_id] = u.unlocked_at
  }

  const achievements  = allAchievements ?? []
  const unlockedCount = achievements.filter((a) => unlockedMap[a.id]).length
  const pct           = achievements.length > 0 ? (unlockedCount / achievements.length) * 100 : 0
  const totalQ  = progress?.total_questions ?? 0
  const totalC  = progress?.total_correct   ?? 0
  const accuracy = totalQ ? Math.round((totalC / totalQ) * 100) : null

  return (
    <div>
      {/* Inject achievement keyframes */}
      <style dangerouslySetInnerHTML={{ __html: ACHIEVEMENT_KEYFRAMES }} />

      {/* ── Overall stats ── */}
      <div className="card">
        <div className="card-title">
          {isEs ? 'Estadísticas Globales' : 'Overall Stats'}
        </div>
        <div className="stat-row">
          <div className="stat-pill">
            <div className="stat-num" style={{ color: 'var(--accent)' }}>{totalQ}</div>
            <div className="stat-label">{isEs ? 'Total' : 'Answered'}</div>
          </div>
          <div className="stat-pill">
            <div className="stat-num" style={{ color: 'var(--success)' }}>
              {accuracy !== null ? `${accuracy}%` : '—'}
            </div>
            <div className="stat-label">{isEs ? 'Precisión' : 'Accuracy'}</div>
          </div>
          <div className="stat-pill">
            <div className="stat-num" style={{ color: 'var(--warning)' }}>
              {progress?.daily_streak ?? 0}
            </div>
            <div className="stat-label">🔥 {isEs ? 'Racha' : 'Streak'}</div>
          </div>
        </div>

        {/* Level & XP */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'linear-gradient(135deg,var(--accent),var(--accent2))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.2rem',
          }}>
            {(progress?.level ?? 1) >= 10 ? '🏆' : (progress?.level ?? 1) >= 5 ? '⭐' : '🌱'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text)' }}>
              Level {progress?.level ?? 1} · {progress?.xp ?? 0} XP
            </div>
            <div className="xp-bar-wrap" style={{ marginTop: 4 }}>
              <div className="xp-bar-fill" style={{ width: `${Math.min(100, ((progress?.xp ?? 0) % 100))}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Achievements ── */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div className="card-title" style={{ marginBottom: 0 }}>
            🏆 {isEs ? 'Logros' : 'Achievements'}
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text3)', fontWeight: 600 }}>
            {unlockedCount} / {achievements.length}
          </span>
        </div>

        {/* Overall progress bar */}
        <div className="prog-bar" style={{ marginBottom: 20 }}>
          <div
            className="prog-fill"
            style={{ width: `${pct}%`, background: 'linear-gradient(90deg,var(--accent),var(--accent2))' }}
          />
        </div>

        {/* Badge grid — 4 columns */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 12,
        }}>
          {achievements.map((a) => {
            const isUnlocked = !!unlockedMap[a.id]
            const name = isEs ? (a.title_es ?? a.title_en) : a.title_en
            const desc = isEs ? (a.description_es ?? a.description_en) : a.description_en

            return (
              <div
                key={a.id}
                title={`${name}: ${desc} (+${a.xp_reward} XP)`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                  padding: '10px 4px',
                  borderRadius: 'var(--radius-sm)',
                  background: isUnlocked
                    ? 'linear-gradient(135deg,rgba(79,142,247,0.07),var(--surface2))'
                    : 'var(--surface2)',
                  border: `1px solid ${isUnlocked ? 'rgba(79,142,247,0.25)' : 'var(--border)'}`,
                  cursor: 'default',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
              >
                <AchievementIcon
                  achievementType={a.id}
                  unlocked={isUnlocked}
                  size={48}
                />
                <div style={{
                  fontSize: '0.6rem',
                  fontWeight: 700,
                  color: isUnlocked ? 'var(--text)' : 'var(--text3)',
                  textAlign: 'center',
                  lineHeight: 1.3,
                  wordBreak: 'break-word',
                }}>
                  {name}
                </div>
                <div style={{
                  fontSize: '0.58rem',
                  fontWeight: 700,
                  color: 'var(--accent)',
                  opacity: isUnlocked ? 1 : 0.4,
                }}>
                  +{a.xp_reward} XP
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
