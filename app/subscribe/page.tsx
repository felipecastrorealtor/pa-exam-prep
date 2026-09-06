'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Icon from '@/components/ui/Icon'

interface SubInfo {
  isSubscribed: boolean
  status: string | null
  canManageBilling: boolean
  expiresAt: string | null
}

const STATUS_LABEL: Record<string, string> = {
  active:      'Active subscription',
  trialing:    'Free trial running',
  past_due:    'Payment past due',
  free_access: 'Free access (code)',
}

export default function SubscribePage() {
  const router = useRouter()
  const [promoCode, setPromoCode]   = useState('')
  const [accessCode, setAccessCode] = useState('')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [tab, setTab]               = useState<'sub' | 'code'>('sub')
  // null = not yet known; the page then offers both paths.
  const [trialUsed, setTrialUsed]   = useState<boolean | null>(null)
  // Which button is working, so only that one shows a spinner.
  const [pending, setPending]       = useState<'trial' | 'paid' | null>(null)
  // An account that already has access must never be shown a pay-again page.
  const [sub, setSub]               = useState<SubInfo | null>(null)
  const [portalBusy, setPortalBusy] = useState(false)

  // Ask the server for eligibility AND current access, so we never promise a
  // trial the account cannot have, nor sell a subscription it already holds.
  useEffect(() => {
    let alive = true
    fetch('/api/stripe/checkout')
      .then((r) => (r.ok ? r.json() : {}))
      .then((j) => {
        if (!alive) return
        setTrialUsed(j?.trialUsed ?? null)
        setSub({
          isSubscribed:     Boolean(j?.isSubscribed),
          status:           j?.status ?? null,
          canManageBilling: Boolean(j?.canManageBilling),
          expiresAt:        j?.expiresAt ?? null,
        })
      })
      .catch(() => { if (alive) { setTrialUsed(null); setSub(null) } })
    return () => { alive = false }
  }, [])

  async function startCheckout(requestTrial: boolean) {
    // Guard against double taps, but never leave the button stuck: every exit
    // path below clears the pending state.
    if (loading) return
    setLoading(true)
    setPending(requestTrial ? 'trial' : 'paid')
    setError(null)

    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promoCode: promoCode.trim() || undefined,
          requestTrial,
        }),
      })

      // A crashed route can answer with HTML, which would throw here and — in
      // the old code — leave the button spinning forever.
      let json: { url?: string; error?: string; trialUsed?: boolean } = {}
      try {
        json = await res.json()
      } catch {
        json = { error: 'The server sent an unexpected response. Please try again.' }
      }

      if (typeof json.trialUsed === 'boolean') setTrialUsed(json.trialUsed)

      if (res.ok && json.url) {
        // Same-tab navigation: not a popup, so iOS Safari and Chrome allow it
        // even though it happens after an await.
        window.location.assign(json.url)
        setTimeout(() => { setLoading(false); setPending(null) }, 8000)
        return
      }

      setError(
        json.error ??
        (res.status === 401
          ? 'Your session expired. Please sign in again.'
          : 'Could not start checkout. Please try again.')
      )
    } catch {
      setError('Network error. Check your connection and try again.')
    }

    setLoading(false)
    setPending(null)
  }

  async function openBillingPortal() {
    if (portalBusy) return
    setPortalBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const json = await res.json().catch(() => ({}))
      if (res.ok && json.url) {
        window.location.assign(json.url)
        setTimeout(() => setPortalBusy(false), 8000)
        return
      }
      setError(
        json.error === 'no_customer'
          ? 'This account has no billing record — it was activated with an access code, so there is nothing to cancel.'
          : 'Could not open the billing portal. Please try again.'
      )
    } catch {
      setError('Network error. Check your connection and try again.')
    }
    setPortalBusy(false)
  }

  async function handleAccessCode() {
    if (!accessCode.trim()) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/redeem-access-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: accessCode.trim() }),
      })
      const json = await res.json().catch(() => ({}))

      if (json.ok) {
        router.push('/study')
        router.refresh()
        return
      }
      const msgs: Record<string, string> = {
        invalid_code:  'That code is invalid.',
        inactive_code: 'That code is no longer active.',
        expired_code:  'That code has expired.',
        used_up:       'That code has reached its usage limit.',
      }
      setError(msgs[json.error] ?? 'Invalid access code.')
    } catch {
      setError('Network error. Check your connection and try again.')
    }
    setLoading(false)
  }

  const codePanel = (
    <div className="card space-y-5">
      <div>
        <h2 className="font-semibold text-slate-100">Enter your access code</h2>
        <p className="text-slate-500 text-sm mt-1">
          Have a 30-day free access code? No credit card required.
        </p>
      </div>

      <div>
        <label className="block text-sm text-slate-400 mb-1.5">Access code</label>
        <input
          type="text"
          value={accessCode}
          onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
          className="input font-mono tracking-widest text-center text-lg"
          placeholder="XXXXXXXXXX"
          maxLength={20}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          style={{ fontSize: 16 }}
        />
      </div>

      <button
        onClick={handleAccessCode}
        disabled={loading || !accessCode.trim()}
        className="btn-primary w-full"
      >
        {loading ? 'Verifying…' : 'Activate free access'}
      </button>
    </div>
  )

  const errorBox = error ? (
    <p className="text-red-400 text-sm bg-red-950/50 border border-red-800 rounded-lg px-3 py-2">
      {error}
    </p>
  ) : null

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16 bg-slate-950">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="flex justify-center mb-3">
            <Image src="/logo.png" alt="" width={56} height={56} priority />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Real Estate PA Exam</h1>
          <p className="text-slate-500 mt-2 text-sm">
            Master all 22 units with 440 practice questions, flashcards, and AI explanations.
          </p>
        </div>

        {/* ── Already has access ── */}
        {sub?.isSubscribed ? (
          <>
            <div className="card space-y-4">
              <div className="flex items-center gap-3">
                <Icon name="check" size={30} title="Subscribed" />
                <div>
                  <h2 className="font-semibold text-slate-100 leading-tight">
                    You&apos;re already subscribed
                  </h2>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {STATUS_LABEL[sub.status ?? ''] ?? 'Your account has full access'}
                    {sub.expiresAt ? (
                      <> · until {new Date(sub.expiresAt).toLocaleDateString()}</>
                    ) : null}
                  </p>
                </div>
              </div>

              <p className="text-sm text-slate-400 leading-relaxed">
                All 440 questions, flashcards, the glossary and the AI consultant are
                unlocked on this account. There is nothing more to buy.
              </p>

              {errorBox}

              <a href="/study" className="btn-primary w-full block text-center">
                Continue studying →
              </a>

              {sub.canManageBilling ? (
                <button
                  onClick={openBillingPortal}
                  disabled={portalBusy}
                  className="w-full text-center text-sm text-slate-400 hover:text-slate-200 border border-slate-700 hover:border-slate-500 rounded-xl px-4 py-3 transition-colors disabled:opacity-50"
                >
                  {portalBusy ? 'Opening billing…' : 'Manage or cancel my subscription'}
                </button>
              ) : (
                <p className="text-xs text-slate-500 text-center leading-relaxed">
                  This access came from a code, so there is no billing to cancel.
                </p>
              )}
            </div>

            {/* A subscribed member may still redeem a code, e.g. to extend access. */}
            {codePanel}
          </>
        ) : (
          <>
            {/* Tab switcher */}
            <div className="flex bg-slate-900 rounded-xl p-1 border border-slate-800">
              {[
                { id: 'sub',  label: 'Subscribe ($20/mo)' },
                { id: 'code', label: 'Access Code' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => { setTab(t.id as 'sub' | 'code'); setError(null) }}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                    tab === t.id
                      ? 'bg-amber-500 text-slate-950'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {tab === 'sub' && (
              <div className="card space-y-5">
                <div className="space-y-2">
                  <h2 className="font-semibold text-slate-100">Monthly Subscription</h2>
                  <div className="text-3xl font-bold text-amber-400">
                    $20 <span className="text-lg font-normal text-slate-500">/ month</span>
                  </div>
                  <ul className="text-sm text-slate-400 space-y-2 pt-1">
                    {([
                      trialUsed !== true ? '7-day free trial — no charge today' : null,
                      '440 practice questions across 22 units',
                      'Flashcards with spaced repetition',
                      'AI-powered explanations',
                      'Progress sync across all devices',
                      'Available in English & Spanish',
                      'Cancel anytime',
                    ].filter(Boolean) as string[]).map((line) => (
                      <li key={line} className="flex items-start gap-2">
                        <Icon name="check" size={16} style={{ marginTop: 2 }} />
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">Promo code</label>
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    className="input font-mono tracking-widest"
                    maxLength={30}
                    autoComplete="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                    style={{ fontSize: 16 }}
                  />
                </div>

                {errorBox}

                {trialUsed === true ? (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Your previous free trial has already been used. You can subscribe
                      immediately for $20/month.
                    </p>
                    <button
                      onClick={() => startCheckout(false)}
                      disabled={loading}
                      className="btn-primary w-full"
                    >
                      {pending === 'paid' ? 'Redirecting to checkout…' : 'Subscribe now — $20/month'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <button
                      onClick={() => startCheckout(true)}
                      disabled={loading}
                      className="btn-primary w-full"
                    >
                      {pending === 'trial' ? 'Redirecting to checkout…' : 'Start my 7-day free trial →'}
                    </button>

                    <button
                      onClick={() => startCheckout(false)}
                      disabled={loading}
                      className="w-full text-center text-sm text-slate-400 hover:text-slate-200 border border-slate-700 hover:border-slate-500 rounded-xl px-4 py-3 leading-snug transition-colors disabled:opacity-50"
                    >
                      {pending === 'paid'
                        ? 'Redirecting to checkout…'
                        : 'Already used your free trial? Subscribe now — $20/month'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {tab === 'code' && codePanel}
          </>
        )}
      </div>
    </div>
  )
}
