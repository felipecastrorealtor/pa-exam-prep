export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 16px', background: 'var(--bg)' }}>
      {/* Background radial glow */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(79,142,247,0.12) 0%, transparent 70%)',
      }} />

      <div style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}>
        {/* Logo / App identity */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          {/* App icon SVG */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="64" height="64" rx="16" fill="url(#authIconGrad)"/>
              {/* PA state shape (simplified outline) */}
              <path d="M10 22 L10 42 L30 42 L30 38 L54 38 L54 22 Z" fill="none" stroke="url(#goldGrad)" strokeWidth="1.5" strokeLinejoin="round" opacity="0.7"/>
              {/* House roof */}
              <path d="M20 36 L32 24 L44 36" fill="none" stroke="white" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"/>
              {/* House body */}
              <rect x="23" y="36" width="18" height="12" rx="1.5" fill="white" opacity="0.9"/>
              {/* Door */}
              <rect x="29" y="40" width="6" height="8" rx="1" fill="url(#authIconGrad)"/>
              {/* Open book (bottom) */}
              <path d="M19 52 Q32 49 32 49 Q32 49 45 52" stroke="url(#goldGrad)" strokeWidth="2" strokeLinecap="round" fill="none"/>
              <path d="M19 48 Q32 45 32 45 Q32 45 45 48" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
              <defs>
                <linearGradient id="authIconGrad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#1a3ba0"/>
                  <stop offset="100%" stopColor="#2d1b8c"/>
                </linearGradient>
                <linearGradient id="goldGrad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#f59e0b"/>
                  <stop offset="100%" stopColor="#d97706"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)', margin: 0 }}>
            Real Estate PA Exam
          </h1>
          <p style={{ color: 'var(--text3)', fontSize: '0.82rem', marginTop: 4 }}>
            PA Exam Prep · EN / ES
          </p>
        </div>

        {children}
      </div>
    </div>
  )
}
