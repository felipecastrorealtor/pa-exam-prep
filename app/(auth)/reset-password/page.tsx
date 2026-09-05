'use client'

import { Suspense, useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export const dynamic = 'force-dynamic'

function ResetPasswordForm() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [showPwd, setShowPwd]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)
  const [ready, setReady]       = useState(false)
  const [fatal, setFatal]       = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    let settled = false

    const markReady = () => {
      if (!settled) { settled = true; setReady(true) }
    }
    const markFatal = (msg: string) => {
      if (!settled) { settled = true; setFatal(msg) }
    }

    // Backup path: the client may establish the session on its own.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN' || session) markReady()
    })

    ;(async () => {
      const hash  = new URLSearchParams(window.location.hash.replace(/^#/, ''))
      const query = new URLSearchParams(window.location.search)

      // Supabase reported a problem with the link itself (expired, already used…)
      const errDesc = hash.get('error_description') ?? query.get('error_description')
      if (errDesc) return markFatal(decodeURIComponent(errDesc.replace(/\+/g, ' ')))

      // Server-generated recovery links come back with tokens in the fragment.
      // Setting the session explicitly avoids depending on auto-detection timing.
      const access_token  = hash.get('access_token')
      const refresh_token = hash.get('refresh_token')
      if (access_token && refresh_token) {
        const { error } = await supabase.auth.setSession({ access_token, refresh_token })
        if (error) return markFatal(error.message)
        window.history.replaceState({}, '', window.location.pathname)
        return markReady()
      }

      // PKCE flow
      const code = query.get('code')
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) return markFatal(error.message)
        window.history.replaceState({}, '', window.location.pathname)
        return markReady()
      }

      // Session already established (event fired before this ran)
      const { data: { session } } = await supabase.auth.getSession()
      if (session) return markReady()
    })()

    const timer = setTimeout(() => {
      markFatal('This reset link is invalid or has expired.')
    }, 8000)

    return () => { subscription.unsubscribe(); clearTimeout(timer) }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/study')
    router.refresh()
  }

  if (fatal) {
    return (
      <div className="card" style={{ textAlign: 'center' }}>
        <div style={{
          width: 52, height: 52, borderRadius: '50%',
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px',
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
            stroke="var(--danger)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
          Link no longer valid
        </h2>
        <p style={{ color: 'var(--text2)', fontSize: '0.88rem', marginBottom: 16 }}>
          {fatal} Reset links expire after one hour and can only be used once.
        </p>
        <Link href="/forgot-password" className="btn btn-primary btn-full" style={{ fontSize: '0.88rem' }}>
          Request a new link
        </Link>
      </div>
    )
  }

  if (!ready) {
    return (
      <div className="card" style={{ textAlign: 'center' }}>
        <p style={{ color: 'var(--text3)', fontSize: '0.88rem' }}>Verifying your reset link…</p>
      </div>
    )
  }

  return (
    <div className="card">
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>Set new password</h2>
        <p style={{ color: 'var(--text3)', fontSize: '0.82rem', marginTop: 4 }}>Choose a strong password.</p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label htmlFor="password" style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text2)', marginBottom: 6 }}>
            New password
          </label>
          <div style={{ position: 'relative' }}>
            <input
              id="password"
              type={showPwd ? 'text' : 'password'}
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              placeholder="At least 8 characters"
              style={{ paddingRight: 44 }}
            />
            <button
              type="button"
              onClick={() => setShowPwd(v => !v)}
              style={{
                position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer',
                padding: 4, color: 'var(--text3)', display: 'flex', alignItems: 'center',
              }}
              aria-label={showPwd ? 'Hide password' : 'Show password'}
            >
              {showPwd ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
                  <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="confirm" style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text2)', marginBottom: 6 }}>
            Confirm password
          </label>
          <input
            id="confirm"
            type={showPwd ? 'text' : 'password'}
            required
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="input"
            placeholder="Same password again"
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
          {loading ? 'Saving…' : 'Save new password'}
        </button>
      </form>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  )
}
