import { createAdminClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import UnitToggleList, { type AdminUnit } from '@/components/admin/UnitToggleList'
import { loadAdminUnits } from '@/lib/admin/units'

export const metadata: Metadata = { title: 'Units — Admin' }
export const dynamic = 'force-dynamic'

export default async function AdminUnitsPage() {
  // The service-role client: the `units` read policy only exposes enabled
  // units, so the anon client can't even see the ones an admin needs to switch
  // back on.
  const supabase = await createAdminClient()
  const units: AdminUnit[] = await loadAdminUnits(supabase)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Units</h1>
        <p className="text-sm text-gray-500 mt-1">
          <strong>In app</strong> hides a unit from students entirely.{' '}
          <strong>In Focus</strong> only takes it out of Focus mode.
        </p>
      </div>
      <UnitToggleList units={units} />
    </div>
  )
}
