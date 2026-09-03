import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Admin Dashboard' }

export default async function AdminDashboard() {
  const supabase = await createClient()

  // Aggregate stats via RPC
  const { data: stats } = await supabase.rpc('admin_get_stats' as any)

  const s = stats as {
    total_users:   number
    active_today:  number
    active_7d:     number
    active_30d:    number
    active_subs:   number
    avg_score_30d: number
    avg_streak:    number
  } | null

  const cards = [
    { label: 'Total users',      value: s?.total_users   ?? '—', color: 'text-blue-600 dark:text-blue-400' },
    { label: 'Active today',     value: s?.active_today  ?? '—', color: 'text-emerald-600 dark:text-emerald-400' },
    { label: 'Active 7 days',    value: s?.active_7d     ?? '—', color: 'text-violet-600 dark:text-violet-400' },
    { label: 'Active 30 days',   value: s?.active_30d    ?? '—', color: 'text-indigo-600 dark:text-indigo-400' },
    { label: 'Active subs',      value: s?.active_subs   ?? '—', color: 'text-amber-600 dark:text-amber-400' },
    { label: 'Avg score (30d)',  value: s?.avg_score_30d != null ? `${s.avg_score_30d}%` : '—', color: 'text-teal-600 dark:text-teal-400' },
    { label: 'Avg streak',       value: s?.avg_streak != null ? `${s.avg_streak}d` : '—',       color: 'text-orange-600 dark:text-orange-400' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map(({ label, value, color }) => (
          <div key={label} className="card p-4 space-y-1">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
            <p className={`text-3xl font-bold tabular-nums ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Quick links */}
        <div className="card p-5 space-y-3">
          <h2 className="font-semibold text-gray-900 dark:text-white">Quick actions</h2>
          <div className="space-y-2">
            <a href="/admin/units" className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline">
              → Manage units (enable / disable)
            </a>
            <a href="/admin/codes" className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline">
              → Generate access codes
            </a>
            <a href="/admin/users" className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline">
              → View all users
            </a>
          </div>
        </div>

        {/* Notes */}
        <div className="card p-5 space-y-2">
          <h2 className="font-semibold text-gray-900 dark:text-white">Notes</h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            Stats refresh on page load. Active = at least one event logged that day/period.
            Avg score is calculated from completed study sessions in the last 30 days.
          </p>
        </div>
      </div>
    </div>
  )
}
