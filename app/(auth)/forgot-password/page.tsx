'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export const dynamic = 'force-dynamic'

function ForgotPasswordForm() {
  const [email, setEmail]     = useState('')
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) {
      // Show full error detail to help diagnose
      setError(`${error.message} [status: ${(error as any).status ?? '?'}, code: ${(error as any).code ?? '?'}]`)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: 12 }}>📩</div>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Check your email</h2>
        <p style={{ color: 'var(--text2)', fontSize: '0.88rem', marginBottom: 16 }}>
          We sent a password reset link to <strong style={{ color: 'var(--text)' }}>{email}</strong>.
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
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>Reset password</h2>
        <p style={{ color: 'var(--text3)', fontSize: '0.82rem', marginTop: 4 }}>
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)', border: '1px solid var(--danger)',
            borderRadius: 'var(--radius-xs)', padding: '10px 14px',
            fontSize: '0.78rem', color: 'var(--danger)', fontFamily: 'monospace',
            wordBreak: 'break-all',
          }}>
            {error}
          </div>
        )}

        <button type="submit" disabled={loading} className="btn btn-primary btn-full" style={{ opacity: loading ? 0.6 : 1 }}>
          {loading ? 'Sending…' : 'Send reset link'}
        </button>
      </form>

      <p style={{ textAlign: 'center', fontSize: '0.82rem', color: 'var(--text3)', marginTop: 16 }}>
        Remembered it?{' '}
        <Link href="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>
          Sign in
        </Link>
      </p>
    </div>
  )
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ForgotPasswordForm />
    </Suspense>
  )
}
