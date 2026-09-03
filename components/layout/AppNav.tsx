'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface AppNavProps {
  userEmail:          string
  displayName:        string
  lang:               string
  subscriptionStatus: string | null
}

// Bottom nav items matching the original app
const navItems = [
  {
    href: '/study',
    labelEn: 'Study',
    labelEs: 'Estudiar',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 0 3-3h7z"/>
      </svg>
    ),
  },
  {
    href: '/flashcards',
    labelEn: 'Flashcards',
    labelEs: 'Tarjetas',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 2 7 12 12 22 7 12 2"/>
        <polyline points="2 17 12 22 22 17"/>
        <polyline points="2 12 12 17 22 12"/>
      </svg>
    ),
  },
  {
    href: '/glossary',
    labelEn: 'Glossary',
    labelEs: 'Glosario',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
      </svg>
    ),
  },
  {
    href: '/achievements',
    labelEn: 'Progress',
    labelEs: 'Progreso',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/>
        <line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
  },
  {
    href: '/settings',
    labelEn: 'Profile',
    labelEs: 'Perfil',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
  },
]

// App icon SVG for topbar (compact version)
function AppIconLogo() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      <rect width="28" height="28" rx="7" fill="url(#navIconGrad)"/>
      {/* House roof */}
      <path d="M7 14 L14 8 L21 14" fill="none" stroke="white" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round"/>
      {/* House body */}
      <rect x="9.5" y="14" width="9" height="7" rx="1" fill="white" opacity="0.92"/>
      {/* Door */}
      <rect x="12" y="17" width="4" height="4" rx="0.8" fill="url(#navIconGrad)"/>
      {/* Book curve */}
      <path d="M6 24 Q14 21.5 22 24" stroke="url(#goldNavGrad)" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <defs>
        <linearGradient id="navIconGrad" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1a3ba0"/>
          <stop offset="100%" stopColor="#2d1b8c"/>
        </linearGradient>
        <linearGradient id="goldNavGrad" x1="0" y1="0" x2="28" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f59e0b"/>
          <stop offset="100%" stopColor="#d97706"/>
        </linearGradient>
      </defs>
    </svg>
  )
}

export default function AppNav({ userEmail, displayName, lang, subscriptionStatus }: AppNavProps) {
  const pathname = usePathname()
  const router   = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const supabase = createClient()

  const isEs = lang === 'es'

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const initials = (displayName || userEmail || '?')[0].toUpperCase()

  return (
    <>
      {/* ── TOPBAR ── */}
      <header
        style={{
          position: 'fixed', top: 0, left: 0, right: 0,
          height: 'var(--top-h)',
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 16px', zIndex: 100, gap: 10,
        }}
      >
        {/* Logo */}
        <Link href="/study" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
          <AppIconLogo />
          <span style={{
            fontWeight: 800,
            fontSize: '0.9rem',
            background: 'linear-gradient(135deg,var(--accent),var(--accent2))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            lineHeight: 1.2,
          }}>
            Real Estate<br/>
            <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>PA Exam</span>
          </span>
        </Link>

        {/* Right side: subscription badge + user menu */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {subscriptionStatus && (
            <span style={{
              fontSize: '0.65rem',
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: 99,
              background:
                subscriptionStatus === 'active'      ? 'rgba(34,197,94,0.15)'  :
                subscriptionStatus === 'trialing'     ? 'rgba(79,142,247,0.15)' :
                subscriptionStatus === 'free_access'  ? 'rgba(245,158,11,0.15)' :
                'rgba(92,99,128,0.2)',
              color:
                subscriptionStatus === 'active'      ? 'var(--success)'  :
                subscriptionStatus === 'trialing'     ? 'var(--accent)'   :
                subscriptionStatus === 'free_access'  ? 'var(--warning)'  :
                'var(--text3)',
              border: '1px solid currentColor',
              letterSpacing: '0.04em',
            }}>
              {subscriptionStatus === 'active'     ? 'Active'   :
               subscriptionStatus === 'trialing'   ? 'Trial'    :
               subscriptionStatus === 'free_access'? '30d Free' : subscriptionStatus}
            </span>
          )}

          {/* Avatar / menu */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'linear-gradient(135deg,var(--accent),var(--accent2))',
                border: 'none', cursor: 'pointer',
                color: '#fff', fontWeight: 800, fontSize: '0.9rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {initials}
            </button>

            {menuOpen && (
              <>
                <div
                  style={{ position: 'fixed', inset: 0, zIndex: 10 }}
                  onClick={() => setMenuOpen(false)}
                />
                <div style={{
                  position: 'absolute', right: 0, top: 44, zIndex: 20,
                  width: 200,
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  boxShadow: 'var(--card-shadow)',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    padding: '10px 14px',
                    borderBottom: '1px solid var(--border)',
                    marginBottom: 4,
                  }}>
                    <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {displayName || userEmail}
                    </p>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {userEmail}
                    </p>
                  </div>
                  <Link href="/settings" onClick={() => setMenuOpen(false)}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', fontSize: '0.85rem', color: 'var(--text2)', textDecoration: 'none' }}>
                    ⚙️ {isEs ? 'Configuración' : 'Settings'}
                  </Link>
                  <Link href="/subscribe" onClick={() => setMenuOpen(false)}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', fontSize: '0.85rem', color: 'var(--text2)', textDecoration: 'none' }}>
                    💳 {isEs ? 'Suscripción' : 'Subscription'}
                  </Link>
                  <button
                    onClick={handleSignOut}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                      padding: '9px 14px', fontSize: '0.85rem',
                      color: 'var(--danger)', background: 'transparent',
                      border: 'none', cursor: 'pointer', textAlign: 'left',
                      borderTop: '1px solid var(--border)', marginTop: 4,
                    }}
                  >
                    🚪 {isEs ? 'Cerrar sesión' : 'Sign out'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── BOTTOM NAV ── */}
      <nav
        style={{
          position: 'fixed',
          bottom: 0, left: 0, right: 0,
          height: 'var(--nav-h)',
          background: 'rgba(26,29,39,0.92)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderTop: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-around',
          zIndex: 100,
          padding: '0 4px',
        }}
      >
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                padding: '8px 12px', borderRadius: 'var(--radius-sm)',
                color: active ? 'var(--accent)' : 'var(--text3)',
                textDecoration: 'none',
                transition: 'color 0.2s',
                minWidth: 56, flex: 1,
                background: active
                  ? 'linear-gradient(135deg,rgba(79,142,247,0.18),rgba(124,92,252,0.12))'
                  : 'transparent',
              }}
            >
              <span style={{
                display: 'flex',
                transform: active ? 'scale(1.15)' : 'scale(1)',
                transition: 'transform 0.2s',
              }}>
                {item.icon}
              </span>
              <span style={{
                fontSize: '0.62rem',
                fontWeight: 700,
                letterSpacing: '0.03em',
              }}>
                {isEs ? item.labelEs : item.labelEn}
              </span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
