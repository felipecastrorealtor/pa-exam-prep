'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export const dynamic = 'force-dynamic'

function RegisterForm() {
  const router = useRouter()

  const [email, setEmail]             = useState('')
  const [password, setPassword]       = useState('')
  const [displayName, setDisplayName] = useState('')
  const [accessCode, setAccessCode]   = useState('')
  const [error, setError]             = useState<string | null>(null)
  const [loading, setLoading]         = useState(false)
  const [success, setSuccess]         = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      setLoading(false)
      return
    }

    const supabase = createClient()

    // 1. Create Supabase auth user
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName || email.split('@')[0] },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    // 2. If access code provided, redeem it via server action
    if (accessCode.trim() && signUpData.user) {
      const res = await fetch('/api/redeem-access-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: accessCode.trim() }),
      })
      const json = await res.json()
      if (!json.ok) {
        setError(
          `Account created! But access code "${accessCode}" is invalid or already used. ` +
          'You can enter a valid code in Settings after signing in.'
        )
        setSuccess(true)
        setLoading(false)
        return
      }
    }

    setSuccess(true)
    setLoading(false)

    if (!signUpData.session) {
      // Email confirmation required — stay on page
    } else {
      router.push('/study')
      router.refresh()
    }
  }

  if (success && !error) {
    return (
      <div className="card text-center space-y-4">
        <div className="text-5xl">📬</div>
        <h2 className="text-xl font-semibold text-slate-100">Check your email</h2>
        <p className="text-slate-400 text-sm">
          We sent a confirmation link to <strong className="text-slate-200">{email}</strong>.
          Click it to activate your account and start studying.
        </p>
        <Link href="/login" className="btn-ghost inline-block text-sm">
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <div className="card space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-100">Create your account</h2>
        <p className="text-slate-500 text-sm mt-1">
          7-day free trial · No credit card required to start.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-slate-400 mb-1.5">
            Name (optional)
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="input"
            placeholder="Your name"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-400 mb-1.5">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-400 mb-1.5">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
            placeholder="At least 8 characters"
          />
        </div>

        <div>
          <label htmlFor="code" className="block text-sm font-medium text-slate-400 mb-1.5">
            Access code{' '}
            <span className="text-slate-600 font-normal">(optional — 30 days free)</span>
          </label>
          <input
            id="code"
            type="text"
            autoComplete="off"
            value={accessCode}
            onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
            className="input font-mono tracking-widest"
            placeholder="XXXXXX"
            maxLength={20}
          />
        </div>

        {error && (
          <p className="text-red-400 text-sm bg-red-950/50 border border-red-800 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Creating account…' : 'Start free trial'}
        </button>
      </form>

      <div className="rounded-lg bg-slate-800/50 border border-slate-700 px-4 py-3 text-xs text-slate-400 space-y-1">
        <p>✅ 7-day free trial — explore everything</p>
        <p>💳 Then $20/month — cancel anytime</p>
        <p>🎟️ Have a promo code? Enter it at checkout for $15/month forever</p>
      </div>

      <p className="text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link href="/login" className="text-amber-500 hover:text-amber-400 font-medium">
          Sign in
        </Link>
      </p>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  )
}
