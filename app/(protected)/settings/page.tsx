import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import SettingsForm from '@/components/settings/SettingsForm'

export const metadata: Metadata = { title: 'Profile — PA Real Estate Prep' }

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, preferred_lang, subscription_status, subscription_expires_at')
    .eq('id', user.id)
    .single()

  const { data: progress } = await supabase
    .from('user_progress')
    .select('daily_goal, exam_date, xp, level, daily_streak, total_questions, total_correct, study_mode')
    .eq('user_id', user.id)
    .single()

  const isEs = profile?.preferred_lang === 'es'

  const subStatus = profile?.subscription_status ?? 'canceled'
  const subExpires = profile?.subscription_expires_at ?? null

  return (
    <div>
      {/* ── Profile card ── */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Avatar */}
          <div style={{
            width: 60, height: 60, borderRadius: '50%',
            background: 'linear-gradient(135deg,var(--accent),var(--accent2))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.5rem', fontWeight: 800, color: '#fff',
            flexShrink: 0,
          }}>
            {(profile?.display_name || user.email || '?')[0].toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>
              {profile?.display_name || (isEs ? 'Mi Perfil' : 'My Profile')}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.email}
            </div>
            {/* Subscription badge */}
            <div style={{ marginTop: 6 }}>
              <span style={{
                fontSize: '0.65rem', fontWeight: 700,
                padding: '2px 8px', borderRadius: 99,
                background:
                  subStatus === 'active'      ? 'rgba(34,197,94,0.15)'  :
                  subStatus === 'trialing'     ? 'rgba(79,142,247,0.15)' :
                  subStatus === 'free_access'  ? 'rgba(245,158,11,0.15)' :
                  'rgba(92,99,128,0.2)',
                color:
                  subStatus === 'active'      ? 'var(--success)'  :
                  subStatus === 'trialing'     ? 'var(--accent)'   :
                  subStatus === 'free_access'  ? 'var(--warning)'  :
                  'var(--text3)',
                border: '1px solid currentColor',
              }}>
                {subStatus === 'active'      ? (isEs ? 'Activo' : 'Active')        :
                 subStatus === 'trialing'    ? (isEs ? 'Prueba' : 'Trial')          :
                 subStatus === 'free_access' ? '30d Free'                           :
                 (isEs ? 'Cancelado' : 'Canceled')}
              </span>
              {subExpires && (
                <span style={{ fontSize: '0.68rem', color: 'var(--text3)', marginLeft: 8 }}>
                  {isEs ? 'Vence' : 'Expires'}: {new Date(subExpires).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Level / XP ── */}
      <div className="card">
        <div className="card-title">{isEs ? 'Nivel & XP' : 'Level & XP'}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: 'linear-gradient(135deg,var(--accent),var(--accent2))',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem',
          }}>
            {(progress?.level ?? 1) >= 10 ? '🏆' : (progress?.level ?? 1) >= 5 ? '⭐' : '🌱'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text)' }}>
              Level {progress?.level ?? 1} · {progress?.xp ?? 0} XP
            </div>
            <div className="xp-bar-wrap">
              <div className="xp-bar-fill" style={{ width: '40%' }} />
            </div>
          </div>
        </div>

        <div className="stat-row" style={{ marginTop: 14 }}>
          <div className="stat-pill">
            <div className="stat-num" style={{ color: 'var(--accent)' }}>{progress?.total_questions ?? 0}</div>
            <div className="stat-label">{isEs ? 'Respondidas' : 'Answered'}</div>
          </div>
          <div className="stat-pill">
            <div className="stat-num" style={{ color: 'var(--success)' }}>
              {progress?.total_questions
                ? `${Math.round(((progress.total_correct ?? 0) / progress.total_questions) * 100)}%`
                : '—'}
            </div>
            <div className="stat-label">{isEs ? 'Precisión' : 'Accuracy'}</div>
          </div>
          <div className="stat-pill">
            <div className="stat-num" style={{ color: 'var(--warning)' }}>{progress?.daily_streak ?? 0}</div>
            <div className="stat-label">🔥 {isEs ? 'Racha' : 'Streak'}</div>
          </div>
        </div>
      </div>

      {/* ── Settings form ── */}
      <SettingsForm
        initialStudyMode={(progress?.study_mode as 'complete' | 'focus') ?? 'complete'}
        initialLang={(profile?.preferred_lang as 'en' | 'es') ?? 'en'}
        initialDailyGoal={progress?.daily_goal ?? 20}
        initialExamDate={(progress as any)?.exam_date ?? null}
        subscriptionStatus={subStatus}
        subscriptionExpires={subExpires}
      />

      {/* ── Subscription management ── */}
      <div className="card">
        <div className="card-title">
          {isEs ? 'Suscripción' : 'Subscription'}
        </div>
        <a
          href="/subscribe"
          className="btn btn-ghost btn-full"
          style={{ marginBottom: 8 }}
        >
          💳 {isEs ? 'Administrar suscripción' : 'Manage subscription'}
        </a>
      </div>
    </div>
  )
}
