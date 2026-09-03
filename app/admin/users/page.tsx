import { createAdminClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Users — Admin' }

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { page?: string }
}) {
  const supabase = await createAdminClient()
  const page    = parseInt(searchParams.page ?? '1', 10)
  const perPage = 50
  const from    = (page - 1) * perPage
  const to      = from + perPage - 1

  const { data: profiles, count } = await supabase
    .from('profiles')
    .select('id, email, role, subscription_status, subscription_expires_at, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  const STATUS_COLOR: Record<string, string> = {
    active:      'bg-emerald-100 text-emerald-700',
    trialing:    'bg-blue-100 text-blue-700',
    free_access: 'bg-violet-100 text-violet-700',
    past_due:    'bg-amber-100 text-amber-700',
    canceled:    'bg-gray-100 text-gray-500',
  }

  const totalPages = Math.ceil((count ?? 0) / perPage)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Users</h1>
        <span className="text-sm text-gray-500">{count ?? 0} total</span>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
            <tr>
              {['Email', 'Role', 'Status', 'Expires', 'Joined'].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wide whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {(profiles ?? []).map((p) => (
              <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                <td className="px-4 py-3 text-gray-900 dark:text-white font-medium max-w-[200px] truncate">
                  {p.email}
                </td>
                <td className="px-4 py-3">
                  {p.role === 'admin' ? (
                    <span className="text-xs bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 px-2 py-0.5 rounded-full font-semibold">
                      admin
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">user</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[p.subscription_status] ?? 'bg-gray-100 text-gray-500'}`}>
                    {p.subscription_status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                  {p.subscription_expires_at
                    ? new Date(p.subscription_expires_at).toLocaleDateString()
                    : '—'}
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                  {new Date(p.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {page > 1 && (
            <a href={`/admin/users?page=${page - 1}`} className="btn-ghost text-sm px-3 py-1.5">
              ← Prev
            </a>
          )}
          <span className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <a href={`/admin/users?page=${page + 1}`} className="btn-ghost text-sm px-3 py-1.5">
              Next →
            </a>
          )}
        </div>
      )}
    </div>
  )
}
