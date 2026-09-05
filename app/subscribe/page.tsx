'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SubscribePage() {
  const router = useRouter()
  const [promoCode, setPromoCode] = useState('')
  const [accessCode, setAccessCode] = useState('')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [tab, setTab]               = useState<'sub'|'code'>('sub')
  // null = not yet known; the page then offers both paths.
  const [trialUsed, setTrialUsed]   = useState<boolean | null>(null)
  // Which button is working, so only that one shows a spinner.
  const [pending, setPending]       = useState<'trial' | 'paid' | null>(null)

  // Ask the server whether this account still has a trial, so we never promise
  // one it cannot have.
  useEffect(() => {
    let alive = true
    fetch('/api/stripe/checkout')
      .then((r) => (r.ok ? r.json() : { trialUsed: null }))
      .then((j) => { if (alive) setTrialUsed(j?.trialUsed ?? null) })
      .catch(() => { if (alive) setTrialUsed(null) })
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
        // Leave the button disabled while the browser navigates away, but arm a
        // fallback in case navigation is blocked or the page stays put.
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

  const handleSubscribe = () => startCheckout(true)

  async function handleAccessCode() {
    if (!accessCode.trim()) return
    setLoading(true)
    setError(null)

    const res = await fetch('/api/redeem-access-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: accessCode.trim() }),
    })
    const json = await res.json()

    if (json.ok) {
      router.push('/study')
      router.refresh()
    } else {
      const msgs: Record<string, string> = {
        invalid_code: 'That code is invalid.',
        inactive_code: 'That code is no longer active.',
        expired_code:  'That code has expired.',
        used_up:       'That code has reached its usage limit.',
      }
      setError(msgs[json.error] ?? 'Invalid access code.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16 bg-slate-950">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="flex justify-center mb-3">
            <Image src="/logo.png" alt="" width={56} height={56} priority />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">PA Real Estate Exam Prep</h1>
          <p className="text-slate-500 mt-2 text-sm">
            Master all 22 units with 321 practice questions, flashcards, and AI explanations.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-slate-900 rounded-xl p-1 border border-slate-800">
          {[
            { id: 'sub', label: 'Subscribe ($20/mo)' },
            { id: 'code', label: 'Access Code' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id as any); setError(null) }}
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
              <ul className="text-sm text-slate-400 space-y-1.5 pt-1">
                {trialUsed !== true && <li>✅ 7-day free trial — no charge today</li>}
                <li>✅ 321 practice questions across 22 units</li>
                <li>✅ Flashcards with spaced repetition</li>
                <li>✅ AI-powered explanations</li>
                <li>✅ Progress sync across all devices</li>
                <li>✅ Available in English &amp; Spanish</li>
                <li>✅ Cancel anytime</li>
              </ul>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1.5">
                Promo code
              </label>
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                className="input font-mono tracking-widest"
                placeholder=""
                maxLength={30}
              />
            </div>

            {error && tab === 'sub' && (
              <p className="text-red-400 text-sm bg-red-950/50 border border-red-800 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

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

        {tab === 'code' && (
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
              />
            </div>

            {error && tab === 'code' && (
              <p className="text-red-400 text-sm bg-red-950/50 border border-red-800 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              onClick={handleAccessCode}
              disabled={loading || !accessCode.trim()}
              className="btn-primary w-full"
            >
              {loading ? 'Verifying…' : 'Activate free access'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
