import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import AchievementIcon, { ACHIEVEMENT_KEYFRAMES } from '@/components/achievements/AchievementIcon'
import { achMeta, CAT_LABEL, CAT_ORDER, type AchCat } from '@/lib/achievements'
import { currentLevel, nextLevel, xpProgress, levelIndex, calcReadiness } from '@/lib/levels'

export const metadata: Metadata = { title: 'Home — PA Exam Prep' }
export const dynamic = 'force-dynamic'

const T = {
  readiness:  { en: 'Exam Readiness',      es: 'Preparación para el Examen' },
  r0:  { en: 'Start practicing to measure your readiness', es: 'Comienza a practicar para ver tu progreso' },
  r1:  { en: 'Keep studying — you are on track',           es: 'Sigue estudiando, vas por buen camino' },
  r2:  { en: 'Almost there! Shore up your weak areas',     es: '¡Casi listo! Refuerza tus áreas débiles' },
  r3:  { en: '✅ Ready for the exam!',                     es: '✅ ¡Listo para el examen!' },
  maxLevel:   { en: 'Max level',           es: 'Nivel máximo' },
  level:      { en: 'Level',               es: 'Nivel' },
  streak:     { en: 'Streak',              es: 'Racha' },
  accuracy:   { en: 'Accuracy',            es: 'Precisión' },
  questions:  { en: 'Questions',           es: 'Preguntas' },
  todayGoal:  { en: "Today's Goal",        es: 'Meta de Hoy' },
  quick:      { en: 'Quick Practice',      es: 'Práctica Rápida' },
  focus:      { en: 'Focus Areas',         es: 'Áreas de Enfoque' },
  seeAll:     { en: 'See all →',           es: 'Ver todo →' },
  focusEmpty: {
    en: 'Answer at least 5 questions per unit to see your weak areas.',
    es: 'Completa al menos 5 preguntas por unidad para ver tus áreas débiles.',
  },
  practice:   { en: 'Practice',            es: 'Practicar' },
  trend:      { en: 'Trend — Recent Sessions', es: 'Tendencia — Últimas Sesiones' },
  trendEmpty: { en: 'No history yet',      es: 'Sin historial todavía' },
  achieve:    { en: 'Achievements',        es: 'Logros' },
  unlocked:   { en: 'unlocked',            es: 'desbloqueados' },
  glossary:   { en: 'Glossary',            es: 'Glosario' },
  daysToExam: { en: 'days to exam',        es: 'días para el examen' },
}

const LOCK = (
  <div className="ach-lock">
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="4" y="7" width="8" height="7" rx="1.5"/>
      <path d="M6 7V5a2 2 0 0 1 4 0v2"/>
    </svg>
  </div>
)

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: progress }, { data: profile }, { data: units }] = await Promise.all([
    supabase.from('user_progress')
      .select('xp, daily_streak, today_questions, total_questions, total_correct, daily_goal, exam_date')
      .eq('user_id', user.id).single(),
    supabase.from('profiles').select('preferred_lang').eq('id', user.id).single(),
    supabase.from('units').select('id, title_en, title_es').eq('enabled', true).order('sort_order'),
  ])

  const lang: 'en' | 'es' = (profile?.preferred_lang as 'en' | 'es') ?? 'en'
  const isEs = lang === 'es'
  const t = (k: keyof typeof T) => T[k][lang]

  const [{ data: attempts }, { data: sessions }, { data: allAch }, { data: unlockedRows }] =
    await Promise.all([
      supabase.from('question_attempts')
        .select('attempts, correct, questions!inner(unit_id)').eq('user_id', user.id),
      supabase.from('study_sessions')
        .select('id, questions_answered, correct, completed_at, started_at')
        .eq('user_id', user.id).order('started_at', { ascending: false }).limit(7),
      supabase.from('achievements')
        .select('id, title_en, title_es, description_en, description_es, xp_reward')
        .order('sort_order'),
      supabase.from('user_achievements').select('achievement_id').eq('user_id', user.id),
    ])

  const { count: bank } = await supabase
    .from('questions').select('id', { count: 'exact', head: true }).eq('enabled', true)

  const rows     = (attempts ?? []) as any[]
  const total    = progress?.total_questions ?? 0
  const correct  = progress?.total_correct   ?? 0
  const streak   = progress?.daily_streak    ?? 0
  const today    = progress?.today_questions ?? 0
  const goal     = progress?.daily_goal      ?? 20
  const xp       = progress?.xp              ?? 0
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0

  const readiness = calcReadiness({
    total, correct, seen: rows.length, totalQuestions: bank ?? 0, streak,
  })
  const ringColor = readiness >= 80 ? 'var(--success)' : readiness >= 50 ? 'var(--warning)' : 'var(--danger)'
  const CIRC = 188.5
  const subtitle = readiness < 20 ? t('r0') : readiness < 50 ? t('r1') : readiness < 80 ? t('r2') : t('r3')

  const lvl  = currentLevel(xp)
  const nxt  = nextLevel(xp)
  const xpP  = xpProgress(xp)

  const daysLeft = progress?.exam_date
    ? Math.ceil((new Date(progress.exam_date).getTime() - Date.now()) / 86400000)
    : null

  // ── Focus areas: three weakest units with at least 5 answers ──
  const byUnit: Record<number, { t: number; c: number }> = {}
  for (const r of rows) {
    const uid = r.questions?.unit_id
    if (!uid) continue
    byUnit[uid] ??= { t: 0, c: 0 }
    byUnit[uid].t += r.attempts ?? 0
    byUnit[uid].c += r.correct ?? 0
  }
  const weakUnits = (units ?? [])
    .map((u) => ({ u, d: byUnit[u.id] ?? { t: 0, c: 0 } }))
    .filter(({ d }) => d.t >= 5)
    .map(({ u, d }) => ({ u, pct: Math.round((d.c / d.t) * 100) }))
    .sort((a, b) => a.pct - b.pct)
    .slice(0, 3)

  // ── Trend: last 7 sessions, oldest first ──
  const trend = (sessions ?? []).slice().reverse().map((s) => ({
    id:   s.id,
    pct:  s.questions_answered > 0 ? Math.round((s.correct / s.questions_answered) * 100) : 0,
    date: (s.completed_at ?? s.started_at ?? '').slice(5, 10),
  }))
  const maxPct = Math.max(...trend.map((s) => s.pct), 10)

  // ── Achievements grouped the way the original app grouped them ──
  const unlocked = new Set((unlockedRows ?? []).map((u) => u.achievement_id))
  const achievements = allAch ?? []
  const grouped = CAT_ORDER
    .map((cat) => ({
      cat,
      items: achievements.filter((a) => achMeta(a.id, a.xp_reward).cat === cat),
    }))
    .filter((g) => g.items.length > 0)

  const goalPct = Math.min(Math.round((today / goal) * 100), 100)

  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: ACHIEVEMENT_KEYFRAMES }} />

      {/* ── Readiness + level ── */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ position: 'relative', width: 72, height: 72, flexShrink: 0 }}>
            <svg width="72" height="72" viewBox="0 0 72 72" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="36" cy="36" r="30" fill="none" stroke="var(--border)" strokeWidth="6"/>
              <circle cx="36" cy="36" r="30" fill="none" stroke={ringColor} strokeWidth="6"
                strokeLinecap="round" strokeDasharray={`${(readiness / 100) * CIRC} ${CIRC}`}/>
            </svg>
            <div style={{
              position: 'absolute', inset: 0, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: '1.05rem', fontWeight: 800, color: 'var(--text)',
            }}>{readiness}%</div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text)' }}>
              {t('readiness')}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text3)', marginTop: 2, lineHeight: 1.4 }}>
              {subtitle}
            </div>
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text2)' }}>
                {lvl.icon} {isEs ? lvl.es : lvl.en} · {t('level')} {levelIndex(lvl)}
              </div>
              <div className="xp-bar-wrap" style={{ marginTop: 4 }}>
                <div className="xp-bar-fill" style={{ width: `${xpP.pct}%` }}/>
              </div>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                fontSize: '0.68rem', color: 'var(--text3)', marginTop: 3,
              }}>
                <span>{xp} XP</span>
                <span>{nxt ? `${xpP.curr}/${xpP.needed} XP` : t('maxLevel')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stat pills ── */}
      <div className="stat-row">
        <div className="stat-pill">
          <div className="stat-num" style={{ color: 'var(--warning)' }}>{streak}</div>
          <div className="stat-label">🔥 {t('streak')}</div>
        </div>
        <div className="stat-pill">
          <div className="stat-num" style={{ color: 'var(--success)' }}>
            {total > 0 ? `${accuracy}%` : '—'}
          </div>
          <div className="stat-label">✅ {t('accuracy')}</div>
        </div>
        <div className="stat-pill">
          <div className="stat-num" style={{ color: 'var(--accent)' }}>{total}</div>
          <div className="stat-label">📄 {t('questions')}</div>
        </div>
      </div>

      {/* ── Today's goal ── */}
      <div className="today-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text)' }}>
            📅 {t('todayGoal')}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text3)' }}>
            {streak > 0 && '🔥'.repeat(Math.min(streak, 5))}
            {daysLeft !== null && daysLeft >= 0 && ` · ${daysLeft} ${t('daysToExam')}`}
          </div>
        </div>
        <div style={{ height: 8, background: 'var(--surface2)', borderRadius: 99, overflow: 'hidden', marginBottom: 6 }}>
          <div style={{
            width: `${goalPct}%`, height: '100%', borderRadius: 99,
            background: 'linear-gradient(90deg,var(--accent),var(--accent2))', transition: 'width 0.4s',
          }}/>
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text3)', marginBottom: 12 }}>
          {today} / {goal} {isEs ? 'preguntas' : 'questions'}
        </div>
        <Link href="/study" className="btn btn-primary btn-full">⚡ {t('quick')}</Link>
      </div>

      {/* ── Focus areas ── */}
      <div className="card">
        <div className="section-header">
          <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.95rem' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
            </svg>
            {t('focus')}
          </div>
          <Link href="/progress" className="section-link" style={{ textDecoration: 'none' }}>
            {t('seeAll')}
          </Link>
        </div>

        {weakUnits.length === 0 ? (
          <div className="empty-state" style={{ padding: '20px 8px' }}>
            <div className="empty-msg">{t('focusEmpty')}</div>
          </div>
        ) : (
          weakUnits.map((item, i) => (
            <div className="focus-item" key={item.u.id}>
              <div className="focus-rank">{i + 1}</div>
              <div className="focus-name">
                U{item.u.id} — {(isEs ? item.u.title_es : item.u.title_en) ?? item.u.title_en}
              </div>
              <div className="focus-pct">{item.pct}%</div>
              <Link href={`/study/${item.u.id}`} className="btn btn-ghost btn-sm">
                {t('practice')}
              </Link>
            </div>
          ))
        )}
      </div>

      {/* ── Trend ── */}
      <div className="card">
        <div className="card-title">{t('trend')}</div>
        {trend.length === 0 ? (
          <div className="empty-state" style={{ padding: 16 }}>
            <div className="empty-msg">{t('trendEmpty')}</div>
          </div>
        ) : (
          <div className="trend-bars">
            {trend.map((s) => (
              <div className="trend-bar-wrap" key={s.id}>
                <div className="trend-bar" style={{
                  height: Math.max(Math.round((s.pct / maxPct) * 44), 2),
                  background: s.pct >= 80 ? 'var(--success)' : s.pct >= 60 ? 'var(--warning)' : 'var(--danger)',
                }}/>
                <div className="trend-date">{s.date}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Achievements ── */}
      <div className="card">
        <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
            <path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
            <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
            <path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>
          </svg>
          {t('achieve')}
        </div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text2)', marginBottom: 12 }}>
          {unlocked.size} / {achievements.length} {t('unlocked')}
        </div>

        <div className="achievement-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
          {grouped.map(({ cat, items }) => (
            <div key={cat} style={{ display: 'contents' }}>
              <div className="ach-cat-header">
                <span>{CAT_LABEL[cat as AchCat][lang]}</span>
              </div>
              {items.map((a) => {
                const isUnlocked = unlocked.has(a.id)
                const meta = achMeta(a.id, a.xp_reward)
                const name = (isEs ? a.title_es : a.title_en) ?? a.title_en
                const desc = (isEs ? a.description_es : a.description_en) ?? a.description_en
                return (
                  <div
                    key={a.id}
                    className={`ach-card ${isUnlocked ? 'unlocked' : 'locked'}`}
                    data-tier={meta.tier}
                    title={`${name} — ${desc} (+${a.xp_reward} XP)`}
                    style={{ ['--ach-color' as any]: meta.color }}
                  >
                    <div className="ach-aura" />
                    <div className="ach-icon-wrap">
                      <AchievementIcon achievementType={a.id} unlocked={isUnlocked} size={44} />
                      {!isUnlocked && LOCK}
                    </div>
                    <div className="ach-name">{name}</div>
                    <div className="ach-desc">{desc}</div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* ── Quick access ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <Link href="/pa" className="btn btn-ghost btn-full" style={{ flex: 1, gap: 7 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/>
            <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/>
            <path d="M7 21h10"/><line x1="12" y1="3" x2="12" y2="21"/>
            <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>
          </svg>
          Ley PA
        </Link>
        <Link href="/glossary" className="btn btn-ghost btn-full" style={{ flex: 1, gap: 7 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
          {t('glossary')}
        </Link>
      </div>
    </div>
  )
}
