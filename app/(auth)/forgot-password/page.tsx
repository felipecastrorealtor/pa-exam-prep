'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail]   = useState('')
  const [sent, setSent]     = useState(false)
  const [error, setError]   = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="card text-center space-y-4">
        <div className="text-5xl">📩</div>
        <h2 className="text-xl font-semibold text-slate-100">Check your email</h2>
        <p className="text-slate-400 text-sm">
          We sent a password reset link to{' '}
          <strong className="text-slate-200">{email}</strong>.
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
        <h2 className="text-xl font-semibold text-slate-100">Reset password</h2>
        <p className="text-slate-500 text-sm mt-1">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
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

        {error && (
          <p className="text-red-400 text-sm bg-red-950/50 border border-red-800 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Sending…' : 'Send reset link'}
        </button>
      </form>

      <p className="text-center text-sm text-slate-500">
        Remembered it?{' '}
        <Link href="/login" className="text-amber-500 hover:text-amber-400 font-medium">
          Sign in
        </Link>
      </p>
    </div>
  )
}
