import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import AccessCodeManager from '@/components/admin/AccessCodeManager'

export const metadata: Metadata = { title: 'Access Codes — Admin' }

export const dynamic = 'force-dynamic'

export default async function AdminCodesPage() {
  const supabase = await createClient()

  const { data: codes } = await supabase
    .from('access_codes')
    .select('id, code, type, duration_days, max_uses, uses_count, active, expires_at, notes, created_at')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Access Codes</h1>
      <AccessCodeManager codes={codes ?? []} />
    </div>
  )
}
