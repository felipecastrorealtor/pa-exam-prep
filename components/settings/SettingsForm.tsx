'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  initialLang: 'en' | 'es'
  initialDailyGoal: number
  initialExamDate: string | null
  subscriptionStatus: string
  subscriptionExpires: string | null
}

export default function SettingsForm({
  initialLang,
  initialDailyGoal,
  initialExamDate,
  subscriptionStatus,
  subscriptionExpires,
}: Props) {
  const supabase = createClient()

  const [lang, setLang]           = useState<'en' | 'es'>(initialLang)
  const [dailyGoal, setDailyGoal] = useState(initialDailyGoal)
  const [examDate, setExamDate]   = useState(initialExamDate ?? '')
  const [saving, setSaving]       = useState(false)
  const [saved, setSaved]         = useState(false)
  const [error, setError]         = useState('')

  const isEs = lang === 'es'

  const daysUntilExam = examDate
    ? Math.max(0, Math.ceil((new Date(examDate).getTime() - Date.now()) / 86400000))
    : null

  const save = async () => {
    setSaving(true)
    setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const [{ error: pe }, { error: ue }] = await Promise.all([
        supabase.from('profiles').update({ preferred_lang: lang }).eq('id', user.id),
        supabase.from('user_progress').update({
          daily_goal: dailyGoal,
          exam_date:  examDate || null,
        }).eq('user_id', user.id),
      ])

      if (pe || ue) throw new Error(pe?.message ?? ue?.message ?? 'Save failed')
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const manageSubscription = async () => {
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const { url } = await res.json()
      if (url) window.location.href = url
    } catch {
      setError(isEs ? 'No se pudo abrir el portal de facturación' : 'Could not open billing portal')
    }
  }

  return (
    <div>
      {/* ── Study Plan ── */}
      <div className="card">
        <div className="card-title">
          📅 {isEs ? 'Plan de Estudio' : 'Study Plan'}
        </div>

        {/* Exam date */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: '0.82rem', color: 'var(--text2)', display: 'block', marginBottom: 6 }}>
            {isEs ? 'Fecha del examen:' : 'Exam date:'}
          </label>
          <input
            type="date"
            value={examDate}
            onChange={(e) => setExamDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            style={{
              width: '100%', padding: '9px 12px',
              background: 'var(--bg)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-xs)', color: 'var(--text)',
              fontSize: '0.9rem',
            }}
          />
          {daysUntilExam !== null && (
            <div style={{
              marginTop: 10, textAlign: 'center',
              fontSize: '2rem', fontWeight: 800, color: 'var(--accent)',
            }}>
              {daysUntilExam}
              <div style={{ fontSize: '0.75rem', color: 'var(--text3)', fontWeight: 600, marginTop: 2 }}>
                {isEs ? 'días para el examen' : 'days until exam'}
              </div>
            </div>
          )}
        </div>

        {/* Daily goal */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <label style={{ fontSize: '0.82rem', color: 'var(--text2)' }}>
              {isEs ? 'Meta diaria:' : 'Daily goal:'}
            </label>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent)' }}>
              {dailyGoal} Q
            </span>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[10, 20, 30, 50].map((g) => (
              <button
                key={g}
                onClick={() => setDailyGoal(g)}
                className="qcount-btn"
                style={{
                  background: dailyGoal === g ? 'var(--accent)' : 'var(--surface2)',
                  borderColor: dailyGoal === g ? 'var(--accent)' : 'var(--border)',
                  color: dailyGoal === g ? '#fff' : 'var(--text2)',
                }}
              >
                {g} Q
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Language ── */}
      <div className="card">
        <div className="card-title">
          🌐 {isEs ? 'Idioma' : 'Language'}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['en', 'es'] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              style={{
                flex: 1, padding: '10px', borderRadius: 'var(--radius-sm)',
                background: lang === l
                  ? 'linear-gradient(135deg,var(--accent),var(--accent2))'
                  : 'var(--surface2)',
                border: `1px solid ${lang === l ? 'transparent' : 'var(--border)'}`,
                color: lang === l ? '#fff' : 'var(--text2)',
                fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {l === 'en' ? '🇺🇸 English' : '🇪🇸 Español'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Subscription management ── */}
      {(subscriptionStatus === 'active' || subscriptionStatus === 'trialing' || subscriptionStatus === 'past_due') && (
        <div className="card">
          <div className="card-title">💳 {isEs ? 'Facturación' : 'Billing'}</div>
          <button
            onClick={manageSubscription}
            className="btn btn-ghost btn-full"
          >
            {isEs ? 'Administrar facturación →' : 'Manage billing →'}
          </button>
        </div>
      )}

      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.1)', border: '1px solid var(--danger)',
          borderRadius: 'var(--radius-sm)', padding: '10px 14px',
          fontSize: '0.82rem', color: 'var(--danger)', marginBottom: 8,
        }}>
          {error}
        </div>
      )}

      {/* Save */}
      <button
        onClick={save}
        disabled={saving}
        className="btn btn-primary btn-full"
        style={{ opacity: saving ? 0.6 : 1 }}
      >
        {saving ? (isEs ? 'Guardando…' : 'Saving…') : saved ? '✓ Saved!' : (isEs ? 'Guardar cambios' : 'Save changes')}
      </button>

      {/* Account */}
      <div className="card" style={{ marginTop: 12, borderColor: 'rgba(239,68,68,0.2)' }}>
        <div className="card-title" style={{ color: 'var(--danger)' }}>
          {isEs ? 'Cuenta' : 'Account'}
        </div>
        <p style={{ fontSize: '0.82rem', color: 'var(--text3)', marginBottom: 10 }}>
          {isEs
            ? 'Para eliminar tu cuenta o reiniciar el progreso, contacta soporte.'
            : 'To delete your account or reset all progress, contact support.'}
        </p>
        <a
          href="mailto:support@repaexam.com"
          style={{ fontSize: '0.82rem', color: 'var(--danger)', textDecoration: 'underline' }}
        >
          {isEs ? 'Contactar soporte →' : 'Contact support →'}
        </a>
      </div>
    </div>
  )
}
