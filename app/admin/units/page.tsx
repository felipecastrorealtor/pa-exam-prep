import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import UnitToggleList from '@/components/admin/UnitToggleList'

export const metadata: Metadata = { title: 'Units — Admin' }

export default async function AdminUnitsPage() {
  const supabase = await createClient()

  const { data: units } = await supabase
    .from('units')
    .select('id, title_en, title_es, enabled, display_order')
    .order('display_order')

  // Question counts per unit
  const { data: counts } = await supabase
    .from('questions')
    .select('unit_id')
    .eq('enabled', true)

  const countMap: Record<number, number> = {}
  for (const c of counts ?? []) {
    countMap[c.unit_id] = (countMap[c.unit_id] ?? 0) + 1
  }

  const serialized = (units ?? []).map((u) => ({
    id:           u.id,
    titleEn:      u.title_en,
    titleEs:      u.title_es,
    enabled:      u.enabled,
    displayOrder: u.display_order,
    questionCount: countMap[u.id] ?? 0,
  }))

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Units</h1>
      <UnitToggleList units={serialized} />
    </div>
  )
}
