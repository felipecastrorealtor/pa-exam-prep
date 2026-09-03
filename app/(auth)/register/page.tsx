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
      <div className="card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: 12 }}>📬</div>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Check your email</h2>
        <p style={{ color: 'var(--text2)', fontSize: '0.88rem', marginBottom: 16 }}>
          We sent a confirmation link to <strong style={{ color: 'var(--text)' }}>{email}</strong>.
          Click it to activate your account and start studying.
        </p>
        <Link href="/login" className="btn btn-ghost btn-full" style={{ fontSize: '0.88rem' }}>
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <div className="card">
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>Create your account</h2>
        <p style={{ color: 'var(--text3)', fontSize: '0.82rem', marginTop: 4 }}>
          7-day free trial · No credit card required to start.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label htmlFor="name" style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text2)', marginBottom: 6 }}>
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
          <label htmlFor="email" style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text2)', marginBottom: 6 }}>
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
          <label htmlFor="password" style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text2)', marginBottom: 6 }}>
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
          <label htmlFor="code" style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text2)', marginBottom: 6 }}>
            Access code{' '}
            <span style={{ color: 'var(--text3)', fontWeight: 400 }}>(optional)</span>
          </label>
          <input
            id="code"
            type="text"
            autoComplete="off"
            value={accessCode}
            onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
            className="input"
            style={{ fontFamily: 'monospace', letterSpacing: '0.15em' }}
            placeholder="XXXXXX"
            maxLength={20}
          />
        </div>

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)', border: '1px solid var(--danger)',
            borderRadius: 'var(--radius-xs)', padding: '10px 14px',
            fontSize: '0.82rem', color: 'var(--danger)',
          }}>
            {error}
          </div>
        )}

        <button type="submit" disabled={loading} className="btn btn-primary btn-full" style={{ opacity: loading ? 0.6 : 1 }}>
          {loading ? 'Creating account…' : 'Start free trial'}
        </button>
      </form>

      <div style={{
        marginTop: 16,
        background: 'var(--surface2)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xs)', padding: '12px 14px',
        fontSize: '0.78rem', color: 'var(--text3)',
      }}>
        <p style={{ marginBottom: 4 }}>✅ 7-day free trial — explore everything</p>
        <p style={{ marginBottom: 4 }}>💳 Then $20/month — cancel anytime</p>
        <p>🎟️ Have a promo code? Enter it at checkout for $15/month forever</p>
      </div>

      <p style={{ textAlign: 'center', fontSize: '0.82rem', color: 'var(--text3)', marginTop: 16 }}>
        Already have an account?{' '}
        <Link href="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>
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
