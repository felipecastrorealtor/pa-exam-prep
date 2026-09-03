import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Study — PA Real Estate Prep' }

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

  // Mastery counts per unit
  const { data: mastery } = await supabase
    .from('question_attempts')
    .select('question_id, mastery, questions!inner(unit_id)')
    .eq('user_id', user.id)
    .eq('mastery', 3)

  const masteredByUnit: Record<number, number> = {}
  for (const m of mastery ?? []) {
    const unitId = (m.questions as any)?.unit_id
    if (unitId) masteredByUnit[unitId] = (masteredByUnit[unitId] ?? 0) + 1
  }

  const todayQ   = progress?.today_questions  ?? 0
  const dailyGoal = progress?.daily_goal      ?? 20
  const pct       = Math.min(100, (todayQ / dailyGoal) * 100)
  const streak    = progress?.daily_streak     ?? 0
  const totalQ    = progress?.total_questions  ?? 0
  const totalC    = progress?.total_correct    ?? 0
  const accuracy  = totalQ ? Math.round((totalC / totalQ) * 100) : null

  return (
    <div>
      {/* ── Readiness / XP card ── */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '4px 0' }}>
          {/* Readiness circle */}
          <div style={{ position: 'relative', width: 72, height: 72, flexShrink: 0 }}>
            <svg width="72" height="72" viewBox="0 0 72 72" style={{ transform: 'rotate(-90deg)' }}>
              <circle
                cx="36" cy="36" r="30"
                fill="none" stroke="var(--border)" strokeWidth="6"
              />
              <circle
                cx="36" cy="36" r="30"
                fill="none"
                stroke="var(--success)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray="188.5"
                strokeDashoffset={188.5 - (188.5 * pct) / 100}
                style={{ transition: 'stroke-dashoffset 0.8s ease' }}
              />
            </svg>
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1rem', fontWeight: 800, color: 'var(--text)',
            }}>
              {Math.round(pct)}%
            </div>
          </div>

          {/* Info */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>
              Exam Readiness
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text2)', marginBottom: 8 }}>
              Level {progress?.level ?? 1} · {progress?.xp ?? 0} XP
            </div>
            <div className="xp-bar-wrap">
              <div
                className="xp-bar-fill"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text3)', marginTop: 2 }}>
              <span>{todayQ} / {dailyGoal} today</span>
              <span>🔥 {streak} day streak</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stat pills ── */}
      <div className="stat-row">
        <div className="stat-pill" style={{ borderColor: 'rgba(245,158,11,0.3)' }}>
          <div className="stat-num" style={{ color: 'var(--warning)' }}>{streak}</div>
          <div className="stat-label">🔥 Streak</div>
        </div>
        <div className="stat-pill" style={{ borderColor: 'rgba(34,197,94,0.3)' }}>
          <div className="stat-num" style={{ color: 'var(--success)' }}>
            {accuracy !== null ? `${accuracy}%` : '—'}
          </div>
          <div className="stat-label">✅ Accuracy</div>
        </div>
        <div className="stat-pill" style={{ borderColor: 'rgba(79,142,247,0.3)' }}>
          <div className="stat-num" style={{ color: 'var(--accent)' }}>{totalQ}</div>
          <div className="stat-label">📄 Questions</div>
        </div>
      </div>

      {/* ── Today card ── */}
      <div className="today-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>
            📅 {progress?.preferred_lang === 'es' ? 'Meta de Hoy' : "Today's Goal"}
          </div>
          <div style={{ fontSize: '1.2rem' }}>{streak > 0 ? '🔥' : '⭐'}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div style={{ flex: 1, background: 'rgba(255,255,255,0.1)', borderRadius: 99, height: 8, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              background: 'var(--accent)',
              borderRadius: 99,
              width: `${pct}%`,
              transition: 'width 0.4s',
            }} />
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text2)', whiteSpace: 'nowrap' }}>
            {todayQ} / {dailyGoal} Q
          </div>
        </div>
        <Link href="/study/quick" className="btn btn-primary btn-full">
          ⚡ Quick Practice
        </Link>
      </div>

      {/* ── Units grid ── */}
      <div className="section-header">
        <div className="section-title">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
          Study by Unit
        </div>
      </div>

      <div className="unit-grid">
        {(units ?? []).map((unit) => {
          const mastered = masteredByUnit[unit.id] ?? 0
          const mastPct  = Math.min(100, (mastered / 15) * 100)
          return (
            <Link
              key={unit.id}
              href={`/study/${unit.id}`}
              className="unit-card"
            >
              <div style={{ fontSize: '0.62rem', color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Unit {unit.id}
              </div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, margin: '4px 0', lineHeight: 1.3, color: 'var(--text)' }}>
                {unit.title_en}
              </div>
              <div className="prog-bar" style={{ marginTop: 6 }}>
                <div
                  className="prog-fill"
                  style={{ width: `${mastPct}%`, background: 'var(--accent)' }}
                />
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text3)' }}>
                {mastered} mastered
              </div>
            </Link>
          )
        })}
      </div>

      {/* ── Overall stats ── */}
      <div className="card" style={{ marginTop: 4 }}>
        <div className="card-title">Overall Progress</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, textAlign: 'center' }}>
          {[
            { label: 'Answered',   value: totalQ },
            { label: 'Correct',    value: totalC },
            { label: 'Accuracy',   value: accuracy !== null ? `${accuracy}%` : '—' },
            { label: 'Streak',     value: `${streak}d` },
          ].map((stat) => (
            <div key={stat.label}>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text)' }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text3)', marginTop: 2 }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
