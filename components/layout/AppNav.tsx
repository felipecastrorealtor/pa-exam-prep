'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
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
    href: '/home',
    labelEn: 'Home',
    labelEs: 'Inicio',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 11l9-7 9 7v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 14 15 14 15 22"/>
      </svg>
    ),
  },
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
    href: '/progress',
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
  {
    href: '/ai',
    labelEn: 'AI',
    labelEs: 'Consultor',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z"/>
        <path d="M19 15l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/>
      </svg>
    ),
  },
]

function AppIconLogo() {
  return (
    <Image src="/logo.png" alt="" width={30} height={30} priority style={{ flexShrink: 0 }} />
  )
}

export default function AppNav({ userEmail, displayName, lang, subscriptionStatus }: AppNavProps) {
  const pathname = usePathname()
  const router   = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const supabase = createClient()

  const isEs = lang === 'es'
  const [switching, setSwitching] = useState(false)

  async function toggleLang() {
    if (switching) return
    setSwitching(true)
    const next = isEs ? 'en' : 'es'
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('profiles').update({ preferred_lang: next }).eq('id', user.id)
      router.refresh()
    }
    setSwitching(false)
  }

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
        <Link href="/home" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
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

        {/* Right side: language toggle + subscription badge + user menu */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={toggleLang}
            disabled={switching}
            title="Switch language / Cambiar idioma"
            style={{
              display: 'flex', alignItems: 'center', gap: 3,
              background: 'rgba(79,142,247,.08)',
              border: '1px solid rgba(79,142,247,.25)',
              borderRadius: 8, padding: '4px 9px',
              fontSize: '0.68rem', fontWeight: 800,
              cursor: switching ? 'wait' : 'pointer',
              color: 'var(--accent)', letterSpacing: '0.05em',
              opacity: switching ? 0.5 : 1,
            }}
          >
            <span style={{ opacity: isEs ? 0.38 : 1 }}>EN</span>
            <span style={{ opacity: 0.35 }}>|</span>
            <span style={{ opacity: isEs ? 1 : 0.38 }}>ES</span>
          </button>
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
                padding: '7px 4px', borderRadius: 'var(--radius-sm)',
                color: active ? 'var(--accent)' : 'var(--text3)',
                textDecoration: 'none',
                transition: 'color 0.2s',
                minWidth: 0, flex: 1,
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
                fontSize: '0.58rem',
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
