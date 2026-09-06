import type { SupabaseClient } from '@supabase/supabase-js'
import type { AdminUnit } from '@/components/admin/UnitToggleList'

/**
 * Every unit, with its question count and how many of those are marked
 * essential — the two numbers that decide whether a unit is worth keeping in
 * Focus mode. Shared by the Units page and the Focus Mode Setup page.
 *
 * Pass a service-role client: the `units` select policy only exposes enabled
 * rows, and an admin needs to see the disabled ones too.
 */
export async function loadAdminUnits(
  supabase: SupabaseClient<any, any, any>,
): Promise<AdminUnit[]> {
  const [{ data: units }, { data: questions }] = await Promise.all([
    supabase.from('units').select('id, title_en, title_es, enabled, focus_enabled, sort_order').order('sort_order'),
    supabase.from('questions').select('unit_id, is_essential').eq('enabled', true),
  ])

  const total: Record<number, number> = {}
  const essential: Record<number, number> = {}
  for (const q of (questions ?? []) as { unit_id: number; is_essential: boolean | null }[]) {
    total[q.unit_id] = (total[q.unit_id] ?? 0) + 1
    if (q.is_essential) essential[q.unit_id] = (essential[q.unit_id] ?? 0) + 1
  }

  return ((units ?? []) as Record<string, any>[]).map((u) => ({
    id:             u.id,
    titleEn:        u.title_en,
    titleEs:        u.title_es ?? null,
    enabled:        Boolean(u.enabled),
    // Defaults to true so the page still works before migration 011 is run.
    focusEnabled:   u.focus_enabled ?? true,
    questionCount:  total[u.id] ?? 0,
    essentialCount: essential[u.id] ?? 0,
  }))
}
