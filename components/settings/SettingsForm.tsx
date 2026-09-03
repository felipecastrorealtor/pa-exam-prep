'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import clsx from 'clsx'

interface Props {
  initialLang: 'en' | 'es'
  initialDailyGoal: number
  initialExamDate: string | null
  subscriptionStatus: string
  subscriptionExpires: string | null
}

const STATUS_LABEL: Record<string, string> = {
  active:      'Active',
  trialing:    'Trial',
  free_access: 'Free Access',
  past_due:    'Past Due',
  canceled:    'Canceled',
  incomplete:  'Incomplete',
  paused:      'Paused',
}

const STATUS_COLOR: Record<string, string> = {
  active:      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  trialing:    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  free_access: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  past_due:    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  canceled:    'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
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
      setError('Could not open billing portal')
    }
  }

  return (
    <div className="space-y-8">

      {/* Subscription card */}
      <section className="card p-5 space-y-3">
        <h2 className="font-semibold text-gray-900 dark:text-white">Subscription</h2>
        <div className="flex items-center gap-3">
          <span className={clsx(
            'text-xs font-semibold px-2.5 py-1 rounded-full',
            STATUS_COLOR[subscriptionStatus] ?? STATUS_COLOR.canceled
          )}>
            {STATUS_LABEL[subscriptionStatus] ?? subscriptionStatus}
          </span>
          {subscriptionExpires && (
            <span className="text-xs text-gray-500">
              {subscriptionStatus === 'free_access' ? 'Expires' : 'Renews'}{' '}
              {new Date(subscriptionExpires).toLocaleDateString()}
            </span>
          )}
        </div>
        {(subscriptionStatus === 'active' || subscriptionStatus === 'trialing' || subscriptionStatus === 'past_due') && (
          <button onClick={manageSubscription} className="btn-ghost text-sm">
            Manage billing →
          </button>
        )}
        {(subscriptionStatus === 'canceled' || subscriptionStatus === 'incomplete') && (
          <a href="/subscribe" className="btn-primary text-sm inline-block">
            Subscribe — $20/mo
          </a>
        )}
      </section>

      {/* Preferences */}
      <section className="card p-5 space-y-5">
        <h2 className="font-semibold text-gray-900 dark:text-white">Preferences</h2>

        {/* Language */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Study language
          </label>
          <div className="flex gap-3">
            {(['en', 'es'] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={clsx(
                  'flex-1 py-2 rounded-lg border-2 text-sm font-semibold transition-colors',
                  lang === l
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                )}
              >
                {l === 'en' ? '🇺🇸 English' : '🇪🇸 Español'}
              </button>
            ))}
          </div>
        </div>

        {/* Daily goal */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Daily goal
            </label>
            <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
              {dailyGoal} questions
            </span>
          </div>
          <input
            type="range"
            min={5}
            max={100}
            step={5}
            value={dailyGoal}
            onChange={(e) => setDailyGoal(Number(e.target.value))}
            className="w-full accent-blue-500"
          />
          <div className="flex justify-between text-xs text-gray-400">
            <span>5</span>
            <span>100</span>
          </div>
        </div>

        {/* Exam date */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Exam date (optional)
          </label>
          <input
            type="date"
            value={examDate}
            onChange={(e) => setExamDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="input w-full"
          />
          {examDate && (
            <p className="text-xs text-gray-500">
              {Math.max(0, Math.ceil((new Date(examDate).getTime() - Date.now()) / 86400000))} days until your exam
            </p>
          )}
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          onClick={save}
          disabled={saving}
          className={clsx(
            'btn-primary w-full',
            saving && 'opacity-60 cursor-wait'
          )}
        >
          {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save changes'}
        </button>
      </section>

      {/* Danger zone */}
      <section className="card p-5 border-red-200 dark:border-red-900/50 space-y-3">
        <h2 className="font-semibold text-red-600 dark:text-red-400">Account</h2>
        <p className="text-sm text-gray-500">
          To delete your account or reset all progress, contact support.
        </p>
        <a
          href="mailto:support@yourapp.com"
          className="text-sm text-red-500 hover:text-red-600 underline"
        >
          Contact support →
        </a>
      </section>
    </div>
  )
}
