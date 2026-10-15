import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AppNav from '@/components/layout/AppNav'
import { hasAccess, planLabel } from '@/lib/access'
import { Suspense } from 'react'
import AnalyticsProvider from '@/components/analytics/AnalyticsProvider'

// This layout wraps all subscription-gated pages.
// Auth + subscription checks are done in middleware.ts — this is a second guard.
export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch profile for nav
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, preferred_lang, subscription_status, subscription_expires_at, role')
    .eq('id', user.id)
    .single()

  // Belt-and-suspenders after middleware — same rules, same file, so the two
  // can no longer disagree about who gets in.
  if (!hasAccess(profile)) redirect('/subscribe')

  // No min-height here: <body> already fills the viewport, and a second
  // full-height box stacks into extra scroll on iOS.
  return (
    <div style={{ background: 'var(--bg)' }}>
      {/* useSearchParams needs a Suspense boundary; the provider renders
          nothing, so the fallback is nothing too. */}
      <Suspense fallback={null}>
        <AnalyticsProvider
          userId={user.id}
          plan={planLabel(profile)}
          language={(profile?.preferred_lang as 'en' | 'es') ?? 'en'}
        />
      </Suspense>
      <AppNav
        userEmail={user.email ?? ''}
        displayName={profile?.display_name ?? ''}
        lang={profile?.preferred_lang ?? 'en'}
        subscriptionStatus={profile?.subscription_status ?? null}
        subscriptionExpiresAt={profile?.subscription_expires_at ?? null}
      />
      {/* top padding = topbar height, bottom padding = bottom nav height */}
      <main style={{
        maxWidth: 680,
        margin: '0 auto',
        padding: 'calc(var(--top-h) + 16px) 16px calc(var(--nav-h) + 24px + env(safe-area-inset-bottom))',
      }}>
        {children}
      </main>
    </div>
  )
}
