import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { ReactNode } from 'react'
import AdminNav from '@/components/admin/AdminNav'

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/')

  return (
    // min-h-screen is 100vh, which on iOS Safari is the address-bar-hidden
    // height — taller than the visible page, so there is always a dead strip
    // of background below the content to scroll into. dvh tracks the real
    // viewport.
    <div className="min-h-[100dvh] bg-gray-50 dark:bg-gray-950 overflow-x-hidden">
      <AdminNav email={user.email ?? ''} />
      <main className="max-w-6xl mx-auto px-4 py-8 w-full">
        {children}
      </main>
    </div>
  )
}
