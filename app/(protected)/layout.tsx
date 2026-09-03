import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AppNav from '@/components/layout/AppNav'

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
    .select('display_name, preferred_lang, subscription_status, subscription_expires_at')
    .eq('id', user.id)
    .single()

  // Subscription check (belt-and-suspenders after middleware)
  const isActive =
    profile?.subscription_status === 'active' ||
    profile?.subscription_status === 'trialing' ||
    (profile?.subscription_status === 'free_access' &&
      profile.subscription_expires_at &&
      new Date(profile.subscription_expires_at) > new Date())

  if (!isActive) redirect('/subscribe')

  return (
    <div className="min-h-screen flex flex-col">
      <AppNav
        userEmail={user.email ?? ''}
        displayName={profile?.display_name ?? ''}
        lang={profile?.preferred_lang ?? 'en'}
        subscriptionStatus={profile?.subscription_status ?? null}
      />
      <main className="flex-1 container mx-auto px-4 py-6 max-w-5xl">
        {children}
      </main>
    </div>
  )
}
