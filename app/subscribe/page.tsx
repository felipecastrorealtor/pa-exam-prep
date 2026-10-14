'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Icon from '@/components/ui/Icon'
import { track } from '@/lib/analytics'

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

// Every API this page calls needs a session, and answers 401 with
// {"error":"unauthenticated"} when there isn't one. That string used to reach
// the screen verbatim on the subscribe tab, and on the access-code tab it fell
// through to "Invalid access code." — telling someone their perfectly good code
// was bad when the only problem was that they were signed out.
const ERROR_MESSAGES: Record<string, string> = {
  unauthenticated: 'You need to be signed in before you can do this.',
  invalid_code:    'That code is invalid.',
  inactive_code:   'That code is no longer active.',
  expired_code:    'That code has expired.',
  used_up:         'That code has reached its usage limit.',
  no_customer:     'There is no billing account to manage yet.',
}

// The server sends two kinds of error: machine codes like `expired_code` and
// real sentences. Show the sentence, translate the code, and never print an
// untranslated code at a student.
function friendly(raw: unknown, fallback: string): string {
  if (typeof raw !== 'string' || !raw) return fallback
  if (ERROR_MESSAGES[raw]) return ERROR_MESSAGES[raw]
  return /^[a-z0-9_]+$/.test(raw) ? fallback : raw
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
  // A code typed at registration waits in the account metadata until the
  // person actually has a session — which, with email confirmation on, is the
  // first time they sign in. This is that moment.
  const [autoRedeem, setAutoRedeem] = useState<'idle' | 'working' | 'failed'>('idle')
  // null = not known yet. This page is public, so a signed-out person can reach
  // it — from a link shared in WhatsApp, say, whose in-app browser has its own
  // cookie store and therefore no session at all.
  const [authed, setAuthed] = useState<boolean | null>(null)

  // Ask the server for eligibility AND current access, so we never promise a
  // trial the account cannot have, nor sell a subscription it already holds.
  // The same call tells us whether there is a session: 401 means there isn't.
  useEffect(() => {
    let alive = true
    fetch('/api/stripe/checkout')
      .then(async (r) => {
        if (!alive) return null
        setAuthed(r.status !== 401)
        return r.ok ? await r.json().catch(() => ({})) : {}
      })
      .then((j) => {
        if (!alive || j === null) return
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

  // Someone sent here to sign in first comes back with their code in the URL,
  // so it is not lost between the two pages.
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('code')
    if (code?.trim()) {
      setAccessCode(code.trim().toUpperCase())
      setTab('code')
    }
  }, [])

  // Sign in, then come straight back here with whatever was typed.
  function goToLogin(target: 'login' | 'register') {
    const code = accessCode.trim().toUpperCase()
    const back = code ? `/subscribe?code=${encodeURIComponent(code)}` : '/subscribe'
    router.push(`/${target}?redirect=${encodeURIComponent(back)}`)
  }

  useEffect(() => {
    // Only once we know the account has no access — never against a person who
    // is already subscribed, whose code would be spent for nothing.
    if (!sub || sub.isSubscribed || autoRedeem !== 'idle') return

    let alive = true
    ;(async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const pending = (user?.user_metadata as Record<string, unknown> | undefined)?.pending_access_code

      if (!alive || !user || typeof pending !== 'string' || !pending.trim()) return
      setAutoRedeem('working')

      try {
        const res  = await fetch('/api/redeem-access-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: pending.trim() }),
        })
        const json = await res.json().catch(() => ({}))

        if (json.ok) {
          // Clear it only on success. A failed attempt consumes nothing, so
          // keeping the code lets the next visit try again; clearing it after
          // a success is what stops a reload spending a second seat.
          await supabase.auth.updateUser({ data: { pending_access_code: null } }).catch(() => {})
          if (!alive) return
          track('access_code_redeemed', { duration_days: json.duration_days })
          router.push('/study')
          router.refresh()
          return
        }

        if (!alive) return
        setAutoRedeem('failed')
        // Hand the code back in the field, so redeeming is one tap and not a
        // hunt through an old email.
        setAccessCode(pending.trim().toUpperCase())
        setTab('code')
        setError(friendly(
          json.error,
          'We could not apply your access code automatically. Try it once more below.',
        ))
      } catch {
        if (!alive) return
        setAutoRedeem('failed')
        setAccessCode(pending.trim().toUpperCase())
        setTab('code')
        setError('Network error while applying your access code. Try it once more below.')
      }
    })()

    return () => { alive = false }
  }, [sub, autoRedeem, router])

  async function startCheckout(requestTrial: boolean) {
    // Guard against double taps, but never leave the button stuck: every exit
    // path below clears the pending state.
    if (loading) return
    setLoading(true)
    setPending(requestTrial ? 'trial' : 'paid')
    setError(null)
    // Intent only. Whether money actually moved is decided by the Stripe
    // webhook, never by this browser.
    track('checkout_started', { requested_trial: requestTrial, has_promo: Boolean(promoCode.trim()) })

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

      // 401 is not a checkout failure, it is a missing session. Say so and
      // take them to sign in, instead of printing `unauthenticated` and
      // leaving them staring at a dead button.
      if (res.status === 401) {
        setAuthed(false)
        setError('Please sign in first — then we will bring you straight back here.')
        setLoading(false)
        setPending(null)
        goToLogin('login')
        return
      }

      setError(friendly(json.error, 'Could not start checkout. Please try again.'))
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
        track('access_code_redeemed', { duration_days: json.duration_days })
        router.push('/study')
        router.refresh()
        return
      }
      // The code may be perfectly good — a signed-out visitor got told it was
      // invalid, which sent at least one student hunting for a problem that
      // was never in the code.
      if (res.status === 401) {
        setAuthed(false)
        setError('Your code looks fine — you just need an account first. We will bring you right back.')
        setLoading(false)
        goToLogin('login')
        return
      }

      setError(friendly(json.error, 'Invalid access code.'))
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
          Enter the code exactly as you received it.
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
            {/* Signed out: say so before they tap anything. Both paths on this
                page need an account, and without this the only feedback was an
                error after the fact. */}
            {authed === false ? (
              <div className="card space-y-3">
                <h2 className="font-semibold text-slate-100">First, your account</h2>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Subscribing and redeeming an access code both need you signed in.
                  It takes a moment, and we will bring you straight back to this page.
                </p>
                <div className="flex gap-2">
                  <button onClick={() => goToLogin('login')} className="btn-primary flex-1">
                    Sign in
                  </button>
                  <button
                    onClick={() => goToLogin('register')}
                    className="flex-1 text-sm text-slate-300 hover:text-slate-100 border border-slate-700 hover:border-slate-500 rounded-xl px-4 py-3 transition-colors"
                  >
                    Create account
                  </button>
                </div>
              </div>
            ) : null}

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
