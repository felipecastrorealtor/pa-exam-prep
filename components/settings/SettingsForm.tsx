'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Icon from '@/components/ui/Icon'
import Flag from '@/components/ui/Flag'

interface Props {
  initialStudyMode?: 'complete' | 'focus'
  initialLang: 'en' | 'es'
  initialDailyGoal: number
  initialExamDate: string | null
  subscriptionStatus: string
  subscriptionExpires: string | null
}

export default function SettingsForm({
  initialStudyMode = 'complete',
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
  const [studyMode, setStudyMode] = useState<'complete' | 'focus'>(initialStudyMode)
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
          study_mode: studyMode,
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
    setError(null)
    try {
      const res  = await fetch('/api/stripe/portal', { method: 'POST' })
      const json = await res.json()

      if (json.url) {
        window.location.href = json.url
        return
      }

      // No Stripe customer yet — access-code and trial users land here.
      if (json.error === 'no_customer') {
        setError(isEs
          ? 'Todavía no tienes una suscripción de pago. Suscríbete para administrar la facturación.'
          : "You don't have a paid subscription yet. Subscribe to manage billing.")
        return
      }

      setError(isEs ? 'No se pudo abrir el portal de facturación' : 'Could not open billing portal')
    } catch {
      setError(isEs ? 'No se pudo abrir el portal de facturación' : 'Could not open billing portal')
    }
  }

  return (
    <div>
      {/* ── Study Plan ── */}
      <div className="card">
        <div className="card-title">
          <Icon name="calendar" size={16} style={{ verticalAlign: '-3px', marginRight: 7 }} />
          {isEs ? 'Plan de Estudio' : 'Study Plan'}
        </div>

        {/* Study mode — the first thing a student should decide */}
        <div style={{ marginBottom: 20 }}>
          <p className="text-sm font-medium text-slate-300 mb-1">
            {isEs ? 'Modo de estudio' : 'Study mode'}
          </p>
          <p className="text-xs text-slate-500 mb-2.5 leading-relaxed">
            {isEs
              ? 'El modo Enfoque usa solo las preguntas que los profesores marcaron como esenciales — cubren cerca del 95% de lo más recurrente en el examen.'
              : 'Focus mode uses only the questions teachers marked as essential — they cover about 95% of what recurs on the exam.'}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {([
              { v: 'complete', en: 'Complete', es: 'Completo',
                subEn: 'Every question', subEs: 'Todas las preguntas' },
              { v: 'focus', en: 'Focus', es: 'Enfoque',
                subEn: 'Essentials only', subEs: 'Solo las esenciales' },
            ] as const).map((o) => (
              <button
                key={o.v}
                type="button"
                onClick={() => setStudyMode(o.v)}
                className={
                  'rounded-xl border px-3 py-2.5 text-left transition-colors ' +
                  (studyMode === o.v
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-slate-700 hover:border-slate-500')
                }
              >
                <span className="block text-sm font-semibold text-slate-100">
                  {o.v === 'focus' ? '★ ' : ''}{isEs ? o.es : o.en}
                </span>
                <span className="block text-xs text-slate-500 mt-0.5">
                  {isEs ? o.subEs : o.subEn}
                </span>
              </button>
            ))}
          </div>
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
            className="date-input"
            style={{
              width: '100%', padding: '9px 12px',
              background: 'var(--bg)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-xs)', color: 'var(--text)',
              /* 16px stops iOS Safari zooming the page when the field is tapped */
              fontSize: 16, textAlign: 'center',
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
          <Icon name="globe" size={16} style={{ verticalAlign: '-3px', marginRight: 7 }} />
          {isEs ? 'Idioma' : 'Language'}
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
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <Flag code={l === 'en' ? 'us' : 'es'} width={22} />
                {l === 'en' ? 'English' : 'Español'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Subscription management ── */}
      {(subscriptionStatus === 'active' || subscriptionStatus === 'trialing' || subscriptionStatus === 'past_due') && (
        <div className="card">
          <div className="card-title">
          <Icon name="card" size={16} style={{ verticalAlign: '-3px', marginRight: 7 }} />
          {isEs ? 'Facturación' : 'Billing'}
        </div>
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

    </div>
  )
}
