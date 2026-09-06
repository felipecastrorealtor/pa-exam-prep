import { createAdminClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import AccessCodeManager from '@/components/admin/AccessCodeManager'

export const metadata: Metadata = { title: 'Access Codes — Admin' }

export const dynamic = 'force-dynamic'

export default async function AdminCodesPage() {
  // access_codes carries no RLS policy at all — only the service role can read
  // it. The admin layout has already verified the role before we get here.
  const supabase = await createAdminClient()

  const { data: codes, error } = await supabase
    .from('access_codes')
    .select('id, code, type, duration_days, max_uses, uses_count, active, expires_at, notes, batch_label, created_at')
    .order('created_at', { ascending: false })

  // batch_label only exists after migration 011; fall back so the page still
  // lists the codes that are already there.
  let rows = codes
  if (error) {
    const { data } = await supabase
      .from('access_codes')
      .select('id, code, type, duration_days, max_uses, uses_count, active, expires_at, notes, created_at')
      .order('created_at', { ascending: false })
    rows = data
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Access Codes</h1>
        <p className="text-sm text-gray-500 mt-1">
          Codes grant free access directly — no card is asked for at any point.
        </p>
      </div>
      <AccessCodeManager codes={(rows ?? []) as never} />
    </div>
  )
}
