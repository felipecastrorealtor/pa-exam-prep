import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const TOTAL_QUESTIONS = 321

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: progress } = await supabase
    .from('user_progress')
    .select('xp, level, daily_streak, today_questions, total_questions, total_correct, daily_goal, exam_date')
    .eq('user_id', user.id)
    .single()

  const { data: profile } = await supabase
    .from('profiles')
    .select('preferred_lang')
    .eq('id', user.id)
    .single()

  const isEs = (profile?.preferred_lang ?? 'en') === 'es'

  // Distinct questions seen, for coverage
  const { count: seen } = await supabase
    .from('question_attempts')
    .select('question_id', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const total    = progress?.total_questions ?? 0
  const correct  = progress?.total_correct ?? 0
  const streak   = progress?.daily_streak ?? 0
  const today    = progress?.today_questions ?? 0
  const goal     = progress?.daily_goal ?? 20
  const xp       = progress?.xp ?? 0

  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0

  // Same weighting as the original app
  const acc      = total > 0 ? Math.min((correct / total) * 1.25, 1) : 0
  const coverage = Math.min((seen ?? 0) / TOTAL_QUESTIONS, 1)
  const strk     = Math.min(streak / 7, 1)
  const readiness = Math.round((acc * 0.45 + coverage * 0.4 + strk * 0.15) * 100)

  const ringColor = readiness >= 80 ? 'var(--success)' : readiness >= 50 ? 'var(--warning)' : 'var(--danger)'
  const CIRC = 188.5
  const dash = (readiness / 100) * CIRC

  const subtitle =
    readiness < 20 ? (isEs ? 'Comienza a practicar para medir tu preparación' : 'Start practicing to measure your readiness')
    : readiness < 50 ? (isEs ? 'Sigue estudiando — vas por buen camino' : 'Keep studying — you are on track')
    : readiness < 80 ? (isEs ? '¡Casi listo! Refuerza tus áreas débiles' : 'Almost there! Shore up your weak areas')
    : (isEs ? '¡Listo para el examen!' : 'Ready for the exam!')

  const goalPct = Math.min(Math.round((today / goal) * 100), 100)

  const daysLeft = progress?.exam_date
    ? Math.ceil((new Date(progress.exam_date).getTime() - Date.now()) / 86400000)
    : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Readiness */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 18 }}>
        <div style={{ position: 'relative', width: 72, height: 72, flexShrink: 0 }}>
          <svg width="72" height="72" viewBox="0 0 72 72" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="36" cy="36" r="30" fill="none" stroke="var(--border)" strokeWidth="6"/>
            <circle cx="36" cy="36" r="30" fill="none" stroke={ringColor} strokeWidth="6"
              strokeLinecap="round" strokeDasharray={`${dash} ${CIRC}`}/>
          </svg>
          <div style={{
            position: 'absolute', inset: 0, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: '1.05rem', fontWeight: 800, color: 'var(--text)',
          }}>
            {readiness}%
          </div>
        </div>
        <div style={{ minWidth: 0 }}>
          <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
            {isEs ? 'Preparación para el Examen' : 'Exam Readiness'}
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text3)', margin: '3px 0 0', lineHeight: 1.45 }}>
            {subtitle}
          </p>
          <p style={{ fontSize: '0.72rem', color: 'var(--text3)', margin: '6px 0 0' }}>
            {xp} XP
            {daysLeft !== null && daysLeft >= 0 && (
              <> · {daysLeft} {isEs ? 'días para el examen' : 'days to exam'}</>
            )}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
        {[
          { val: String(streak),      label: isEs ? 'Racha'     : 'Streak' },
          { val: `${accuracy}%`,      label: isEs ? 'Precisión' : 'Accuracy' },
          { val: String(total),       label: isEs ? 'Preguntas' : 'Questions' },
        ].map(({ val, label }) => (
          <div key={label} className="card" style={{ padding: '13px 10px', textAlign: 'center' }}>
            <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)', margin: 0, fontVariantNumeric: 'tabular-nums' }}>{val}</p>
            <p style={{ fontSize: '0.7rem', color: 'var(--text3)', margin: '2px 0 0' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Daily goal */}
      <div className="card" style={{ padding: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 9 }}>
          <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
            {isEs ? 'Meta de Hoy' : "Today's Goal"}
          </h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text3)', fontVariantNumeric: 'tabular-nums' }}>
            {today} / {goal}
          </span>
        </div>
        <div style={{ height: 7, background: 'var(--surface2)', borderRadius: 99, overflow: 'hidden', marginBottom: 14 }}>
          <div style={{
            width: `${goalPct}%`, height: '100%', borderRadius: 99,
            background: 'linear-gradient(90deg,var(--accent),var(--accent2))',
          }}/>
        </div>
        <Link href="/study" className="btn btn-primary btn-full" style={{ fontSize: '0.87rem' }}>
          {isEs ? 'Práctica Rápida' : 'Quick Practice'}
        </Link>
      </div>

      {/* Ley PA + Glosario — quick access */}
      <div style={{ display: 'flex', gap: 10 }}>
        <Link href="/pa" className="btn btn-ghost" style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 8, fontSize: '0.86rem', padding: '13px 10px',
        }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3v18M7 21h10M5 7h14M5 7l-3 6h6l-3-6zM19 7l-3 6h6l-3-6z"/>
          </svg>
          Ley PA
        </Link>
        <Link href="/glossary" className="btn btn-ghost" style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 8, fontSize: '0.86rem', padding: '13px 10px',
        }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
          {isEs ? 'Glosario' : 'Glossary'}
        </Link>
      </div>
    </div>
  )
}
