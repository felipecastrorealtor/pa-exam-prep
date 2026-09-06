import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import SettingsForm from '@/components/settings/SettingsForm'
import ResetProgress from '@/components/settings/ResetProgress'
import AvatarPicker from '@/components/ui/AvatarPicker'
import Icon from '@/components/ui/Icon'

export const metadata: Metadata = { title: 'Profile — Real Estate PA Exam' }

const SUPPORT_EMAIL = 'castrovisualstudio@gmail.com'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, preferred_lang, role, subscription_status, subscription_expires_at')
    .eq('id', user.id)
    .single()

  // Separate query so the page still renders if migration 010 has not been run.
  const { data: avatarRow } = await supabase
    .from('profiles')
    .select('avatar_url')
    .eq('id', user.id)
    .maybeSingle()

  const { data: progress } = await supabase
    .from('user_progress')
    .select('daily_goal, exam_date, xp, level, daily_streak, total_questions, total_correct, study_mode')
    .eq('user_id', user.id)
    .single()

  const isEs    = profile?.preferred_lang === 'es'
  const isAdmin = profile?.role === 'admin'

  const subStatus  = profile?.subscription_status ?? 'canceled'
  const subExpires = profile?.subscription_expires_at ?? null

  const level = progress?.level ?? 1
  const levelIcon = level >= 10 ? 'trophy' : level >= 5 ? 'star' : 'seedling'

  const supportSubject = encodeURIComponent(
    isEs ? 'Soporte — Real Estate PA Exam' : 'Support — Real Estate PA Exam',
  )

  return (
    <div>
      {/* ── Profile card ── */}
      <div className="card">
        <AvatarPicker
          initial={(avatarRow as { avatar_url?: string | null } | null)?.avatar_url ?? null}
          fallback={profile?.display_name || user.email || '?'}
          lang={isEs ? 'es' : 'en'}
        >
          <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text)', marginBottom: 3, lineHeight: 1.25 }}>
            {profile?.display_name || (isEs ? 'Mi Perfil' : 'My Profile')}
          </div>
          <div style={{
            fontSize: '0.78rem', color: 'var(--text3)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {user.email}
          </div>
          <div style={{ marginTop: 7 }}>
            <span style={{
              display: 'inline-block',
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
               subStatus === 'free_access' ? (isEs ? 'Acceso libre' : 'Free access') :
               (isEs ? 'Cancelado' : 'Canceled')}
            </span>
            {subExpires && (
              <span style={{ fontSize: '0.68rem', color: 'var(--text3)', marginLeft: 8 }}>
                {isEs ? 'Vence' : 'Expires'}: {new Date(subExpires).toLocaleDateString()}
              </span>
            )}
          </div>
        </AvatarPicker>
      </div>

      {/* ── Level / XP ── */}
      <div className="card">
        <div className="card-title">{isEs ? 'Nivel & XP' : 'Level & XP'}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: 'linear-gradient(135deg,rgba(79,142,247,0.18),rgba(124,92,252,0.18))',
            border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name={levelIcon} size={26} title={`Level ${level}`} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text)' }}>
              Level {level} · {progress?.xp ?? 0} XP
            </div>
            <div className="xp-bar-wrap">
              <div className="xp-bar-fill" style={{ width: '40%' }} />
            </div>
          </div>
        </div>

        <div className="stat-row" style={{ marginTop: 14 }}>
          <div className="stat-pill">
            <div className="stat-num" style={{ color: 'var(--accent)' }}>{progress?.total_questions ?? 0}</div>
            <div className="stat-label">
              <Icon name="document" size={13} style={{ verticalAlign: '-2px', marginRight: 4 }} />
              {isEs ? 'Respondidas' : 'Answered'}
            </div>
          </div>
          <div className="stat-pill">
            <div className="stat-num" style={{ color: 'var(--success)' }}>
              {progress?.total_questions
                ? `${Math.round(((progress.total_correct ?? 0) / progress.total_questions) * 100)}%`
                : '—'}
            </div>
            <div className="stat-label">
              <Icon name="target" size={13} style={{ verticalAlign: '-2px', marginRight: 4 }} />
              {isEs ? 'Precisión' : 'Accuracy'}
            </div>
          </div>
          <div className="stat-pill">
            <div className="stat-num" style={{ color: 'var(--warning)' }}>{progress?.daily_streak ?? 0}</div>
            <div className="stat-label">
              <Icon name="flame" size={13} style={{ verticalAlign: '-2px', marginRight: 4 }} />
              {isEs ? 'Racha' : 'Streak'}
            </div>
          </div>
        </div>
      </div>

      {/* ── Settings form ── */}
      <SettingsForm
        initialStudyMode={(progress?.study_mode as 'complete' | 'focus') ?? 'complete'}
        initialLang={(profile?.preferred_lang as 'en' | 'es') ?? 'en'}
        initialDailyGoal={progress?.daily_goal ?? 20}
        initialExamDate={(progress as { exam_date?: string | null } | null)?.exam_date ?? null}
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
          <Icon name="card" size={16} interactive style={{ marginRight: 8, verticalAlign: '-3px' }} />
          {isEs ? 'Administrar suscripción' : 'Manage subscription'}
        </a>
      </div>

      {/* ── Admin entry (only rendered for admin accounts) ── */}
      {isAdmin && (
        <div className="card">
          <div className="card-title">
            <Icon name="shield" size={16} style={{ marginRight: 8, verticalAlign: '-3px' }} />
            {isEs ? 'Administración' : 'Administration'}
          </div>
          <div style={{ display: 'grid', gap: 8 }}>
            <Link href="/admin" className="btn btn-ghost btn-full">
              <Icon name="chart" size={16} interactive style={{ marginRight: 8, verticalAlign: '-3px' }} />
              {isEs ? 'Panel principal' : 'Dashboard'}
            </Link>
            <Link href="/admin/questions" className="btn btn-ghost btn-full">
              <Icon name="target" size={16} interactive style={{ marginRight: 8, verticalAlign: '-3px' }} />
              Focus Mode Setup
            </Link>
            <Link href="/admin/users" className="btn btn-ghost btn-full">
              <Icon name="user" size={16} interactive style={{ marginRight: 8, verticalAlign: '-3px' }} />
              {isEs ? 'Suscriptores y rendimiento' : 'Subscribers & performance'}
            </Link>
          </div>
        </div>
      )}

      {/* ── Reset progress ── */}
      <ResetProgress lang={isEs ? 'es' : 'en'} />

      {/* ── Support ── */}
      <div style={{ textAlign: 'center', padding: '4px 0 8px' }}>
        <a
          href={`mailto:${SUPPORT_EMAIL}?subject=${supportSubject}`}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            fontSize: '0.82rem', color: 'var(--text2)', textDecoration: 'none',
          }}
        >
          <Icon name="document" size={15} interactive />
          {isEs ? 'Contactar soporte' : 'Contact Support'}
        </a>
      </div>
    </div>
  )
}
