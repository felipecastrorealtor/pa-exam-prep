import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Progress — PA Exam Prep' }
export const dynamic = 'force-dynamic'

const T = {
  title:      { en: 'Overall Stats',        es: 'Estadísticas Globales' },
  total:      { en: 'Total',                es: 'Total' },
  accuracy:   { en: 'Accuracy',             es: 'Precisión' },
  streak:     { en: 'Streak',               es: 'Racha' },
  mastery:    { en: 'Question Mastery',     es: 'Maestría de Preguntas' },
  m0:         { en: '🆕 New',               es: '🆕 Nueva' },
  m1:         { en: '📖 Learning',          es: '📖 Aprendiendo' },
  m2:         { en: '📈 Improving',         es: '📈 Mejorando' },
  m3:         { en: '⭐ Mastered',          es: '⭐ Dominada' },
  mastered:   { en: 'mastered',             es: 'dominadas' },
  byUnit:     { en: 'Performance by Unit',  es: 'Rendimiento por Unidad' },
  examHist:   { en: 'Mock Exam History',    es: 'Historial de Simulacros' },
  noExams:    { en: 'No mock exams yet',    es: 'Sin simulacros todavía' },
  correctOf:  { en: 'correct',              es: 'correctas' },
  weak:       { en: 'Weak Areas',           es: 'Áreas Débiles' },
  noWeak:     { en: 'No weak spots yet',    es: 'Sin puntos débiles todavía' },
  practice:   { en: 'Practice',             es: 'Practicar' },
}

export default async function ProgressPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('preferred_lang').eq('id', user.id).single()
  const lang: 'en' | 'es' = (profile?.preferred_lang as 'en' | 'es') ?? 'en'
  const t = (k: keyof typeof T) => T[k][lang]

  const [{ data: progress }, { data: units }, { data: attempts }, { data: examSessions }] =
    await Promise.all([
      supabase.from('user_progress')
        .select('daily_streak, total_questions, total_correct')
        .eq('user_id', user.id).single(),
      supabase.from('units')
        .select('id, title_en, title_es').eq('enabled', true).order('sort_order'),
      supabase.from('question_attempts')
        .select('question_id, attempts, correct, mastery, questions!inner(unit_id, legacy_id, question_en)')
        .eq('user_id', user.id),
      supabase.from('study_sessions')
        .select('id, questions_answered, correct, duration_sec, score_pct, completed_at')
        .eq('user_id', user.id).eq('session_type', 'exam')
        .order('completed_at', { ascending: false }).limit(5),
    ])

  const { count: totalQuestions } = await supabase
    .from('questions').select('id', { count: 'exact', head: true }).eq('enabled', true)

  const rows = (attempts ?? []) as any[]

  const total    = progress?.total_questions ?? 0
  const correct  = progress?.total_correct   ?? 0
  const streak   = progress?.daily_streak    ?? 0
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : null

  // ── Mastery buckets. Anything never attempted counts as "new". ──
  const bank = totalQuestions ?? 0
  const m: [number, number, number, number] = [0, 0, 0, 0]
  for (const r of rows) m[Math.min(3, Math.max(0, r.mastery ?? 0))]++
  m[0] += Math.max(0, bank - rows.length)
  const bankTotal = m[0] + m[1] + m[2] + m[3]

  const masteryRows = [
    { label: t('m0'), cls: 'mastery-0', n: m[0], color: 'var(--text3)' },
    { label: t('m1'), cls: 'mastery-1', n: m[1], color: 'var(--danger)' },
    { label: t('m2'), cls: 'mastery-2', n: m[2], color: 'var(--warning)' },
    { label: t('m3'), cls: 'mastery-3', n: m[3], color: 'var(--success)' },
  ]

  // ── Per-unit accuracy ──
  const byUnit: Record<number, { t: number; c: number }> = {}
  for (const r of rows) {
    const uid = r.questions?.unit_id
    if (!uid) continue
    byUnit[uid] ??= { t: 0, c: 0 }
    byUnit[uid].t += r.attempts ?? 0
    byUnit[uid].c += r.correct ?? 0
  }

  // ── Weak areas: questions missed at least twice, worst first ──
  const weak = rows
    .map((r) => ({
      unitId:  r.questions?.unit_id as number,
      qid:     r.question_id as string,
      legacy:  r.questions?.legacy_id as number,
      text:    (r.questions?.question_en ?? '') as string,
      misses:  (r.attempts ?? 0) - (r.correct ?? 0),
    }))
    .filter((w) => w.misses >= 2 && w.unitId)
    .sort((a, b) => b.misses - a.misses)
    .slice(0, 15)

  const unitTitle = (id: number) => {
    const u = (units ?? []).find((x) => x.id === id)
    if (!u) return `Unit ${id}`
    return (lang === 'es' ? u.title_es : u.title_en) ?? u.title_en
  }

  const gradeColor = (p: number) =>
    p >= 80 ? 'var(--success)' : p >= 50 ? 'var(--warning)' : 'var(--danger)'

  return (
    <div>
      {/* ── Overall stats ── */}
      <div className="card">
        <div className="card-title">{t('title')}</div>
        <div className="stat-row" style={{ marginBottom: 0 }}>
          <div className="stat-pill">
            <div className="stat-num" style={{ color: 'var(--accent)' }}>{total}</div>
            <div className="stat-label">{t('total')}</div>
          </div>
          <div className="stat-pill">
            <div className="stat-num" style={{ color: 'var(--success)' }}>
              {accuracy !== null ? `${accuracy}%` : '—'}
            </div>
            <div className="stat-label">{t('accuracy')}</div>
          </div>
          <div className="stat-pill">
            <div className="stat-num" style={{ color: 'var(--warning)' }}>{streak}</div>
            <div className="stat-label">🔥 {t('streak')}</div>
          </div>
        </div>
      </div>

      {/* ── Mastery breakdown ── */}
      <div className="card">
        <div className="card-title">{t('mastery')}</div>
        <div className="mastery-legend">
          {masteryRows.map((r) => (
            <span key={r.cls} className={`mastery-badge ${r.cls}`}>{r.label}</span>
          ))}
        </div>
        {masteryRows.map((r) => (
          <div className="mastery-row" key={r.cls}>
            <span className={`mastery-badge ${r.cls}`} style={{ minWidth: 96 }}>{r.label}</span>
            <div className="prog-bar" style={{ flex: 1 }}>
              <div className="prog-fill" style={{
                width: `${bankTotal ? (r.n / bankTotal) * 100 : 0}%`, background: r.color,
              }}/>
            </div>
            <span className="mastery-count">{r.n}</span>
          </div>
        ))}
        <div className="prog-bar" style={{ height: 10, marginTop: 10 }}>
          <div className="prog-fill" style={{
            background: 'var(--success)',
            width: `${bankTotal ? (m[3] / bankTotal) * 100 : 0}%`,
          }}/>
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text3)', marginTop: 5 }}>
          {m[3]} / {bankTotal} {t('mastered')}
        </div>
      </div>

      {/* ── Performance by unit ── */}
      <div className="card">
        <div className="card-title">{t('byUnit')}</div>
        {(units ?? []).map((u) => {
          const ud = byUnit[u.id] ?? { t: 0, c: 0 }
          const p  = ud.t > 0 ? Math.round((ud.c / ud.t) * 100) : 0
          const c  = gradeColor(p)
          return (
            <div className="upl-row" key={u.id}>
              <div className="upl-name" title={(lang === 'es' ? u.title_es : u.title_en) ?? ''}>
                U{u.id} {(lang === 'es' ? u.title_es : u.title_en) ?? u.title_en}
              </div>
              <div className="upl-bar">
                <div className="upl-bar-fill" style={{ width: `${p}%`, background: c }}/>
              </div>
              <div className="upl-pct" style={{ color: ud.t ? c : 'var(--text3)' }}>
                {ud.t ? `${p}%` : '—'}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Mock exam history ── */}
      <div className="card">
        <div className="card-title">{t('examHist')}</div>
        {(examSessions ?? []).length === 0 ? (
          <div className="empty-state"><div className="empty-msg">{t('noExams')}</div></div>
        ) : (
          (examSessions ?? []).map((e) => {
            const p    = e.questions_answered > 0
              ? Math.round((e.correct / e.questions_answered) * 100) : 0
            const pass = p >= 75
            const col  = pass ? 'var(--success)' : 'var(--danger)'
            const secs = e.duration_sec ?? 0
            const when = e.completed_at
              ? new Date(e.completed_at).toLocaleDateString(lang === 'es' ? 'es' : 'en') : ''
            return (
              <div className="exam-hist-item" key={e.id}>
                <div className="exam-hist-score" style={{
                  background: pass ? 'rgba(34,197,94,0.13)' : 'rgba(239,68,68,0.13)',
                  color: col,
                  border: `1px solid ${pass ? 'rgba(34,197,94,0.28)' : 'rgba(239,68,68,0.28)'}`,
                }}>{p}%</div>
                <div className="exam-hist-info">
                  <div className="exam-hist-detail">
                    {e.correct}/{e.questions_answered} {t('correctOf')}
                  </div>
                  <div className="exam-hist-date">
                    {when}
                    {secs > 0 && ` · ${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* ── Weak areas ── */}
      <div className="card">
        <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m10.29 3.86-8.17 14.15a2 2 0 0 0 1.71 3h16.34a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          {t('weak')}
        </div>
        {weak.length === 0 ? (
          <div className="empty-state"><div className="empty-msg">{t('noWeak')}</div></div>
        ) : (
          weak.map((w) => (
            <div className="weak-item" key={w.qid}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="wi-unit">U{w.unitId} — {unitTitle(w.unitId)}</div>
                <div className="wi-q">
                  {w.text.length > 80 ? `${w.text.slice(0, 80)}…` : w.text}
                </div>
              </div>
              <div className="wi-attempts">{w.misses}x</div>
              <Link href={`/study/${w.unitId}`} className="btn btn-ghost btn-sm">
                {t('practice')}
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
