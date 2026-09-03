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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <AdminNav email={user.email ?? ''} />
      <main className="max-w-6xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
