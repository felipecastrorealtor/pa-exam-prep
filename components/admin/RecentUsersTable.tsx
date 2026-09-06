'use client'

import { useMemo, useState } from 'react'
import clsx from 'clsx'
import type { RecentUser } from '@/lib/admin/dashboard'

const PLAN_COLOR: Record<RecentUser['plan'], string> = {
  Paid:      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  Trial:     'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  Free:      'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  Expired:   'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  Cancelled: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
}

type SortKey = 'joined' | 'lastActivity' | 'answered' | 'accuracy' | 'streak'

const PAGE = 20

export default function RecentUsersTable({ users }: { users: RecentUser[] | null }) {
  const [q, setQ]           = useState('')
  const [plan, setPlan]     = useState<'all' | RecentUser['plan']>('all')
  const [sort, setSort]     = useState<SortKey>('joined')
  const [desc, setDesc]     = useState(true)
  const [page, setPage]     = useState(0)

  const filtered = useMemo(() => {
    if (!users) return []
    const needle = q.trim().toLowerCase()
    const rows = users.filter((u) => {
      if (plan !== 'all' && u.plan !== plan) return false
      if (!needle) return true
      return (u.email?.toLowerCase().includes(needle) || u.name?.toLowerCase().includes(needle)) ?? false
    })

    const val = (u: RecentUser): number => {
      switch (sort) {
        case 'joined':       return new Date(u.joined).getTime()
        case 'lastActivity': return u.lastActivity ? new Date(u.lastActivity).getTime() : 0
        case 'answered':     return u.answered
        case 'accuracy':     return u.accuracy ?? -1
        case 'streak':       return u.streak
      }
    }
    return [...rows].sort((a, b) => (desc ? val(b) - val(a) : val(a) - val(b)))
  }, [users, q, plan, sort, desc])

  const pages   = Math.max(1, Math.ceil(filtered.length / PAGE))
  const current = Math.min(page, pages - 1)
  const slice   = filtered.slice(current * PAGE, current * PAGE + PAGE)

  function header(key: SortKey, label: string) {
    const active = sort === key
    return (
      <th className="px-3 py-3 text-left">
        <button
          onClick={() => { active ? setDesc((d) => !d) : (setSort(key), setDesc(true)); setPage(0) }}
          className={clsx(
            'font-medium text-xs uppercase tracking-wide whitespace-nowrap',
            active ? 'text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300',
          )}
          aria-sort={active ? (desc ? 'descending' : 'ascending') : 'none'}
        >
          {label}{active ? (desc ? ' ↓' : ' ↑') : ''}
        </button>
      </th>
    )
  }

  if (!users) {
    return (
      <div className="card p-6">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-2">Recent Users</h2>
        <p className="text-sm text-amber-600 dark:text-amber-400">
          This section could not be loaded. Reload the page to try again.
        </p>
      </div>
    )
  }

  return (
    <div className="card p-0 overflow-hidden">
      <div className="p-5 pb-3 flex flex-wrap items-center gap-3 justify-between">
        <h2 className="font-semibold text-gray-900 dark:text-white">Recent Users</h2>
        <div className="flex flex-wrap gap-2">
          <label className="sr-only" htmlFor="user-search">Search users</label>
          <input
            id="user-search"
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(0) }}
            placeholder="Search name or email"
            className="input text-sm w-56"
            type="search"
          />
          <label className="sr-only" htmlFor="plan-filter">Filter by plan</label>
          <select
            id="plan-filter"
            value={plan}
            onChange={(e) => { setPlan(e.target.value as typeof plan); setPage(0) }}
            className="input text-sm"
          >
            <option value="all">All plans</option>
            {(['Paid', 'Trial', 'Free', 'Expired', 'Cancelled'] as const).map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-gray-400 px-5 pb-6">
          {users.length === 0 ? 'No users yet.' : 'No users match this filter.'}
        </p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-y border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-3 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wide">User</th>
                  <th className="px-3 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wide">Plan</th>
                  {header('lastActivity', 'Last activity')}
                  {header('answered', 'Answered')}
                  {header('accuracy', 'Avg score')}
                  {header('streak', 'Streak')}
                  {header('joined', 'Joined')}
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {slice.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                    <td className="px-3 py-3 max-w-[220px]">
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {u.name || u.email.split('@')[0]}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{u.email}</p>
                    </td>
                    <td className="px-3 py-3">
                      <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', PLAN_COLOR[u.plan])}>
                        {u.plan}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {u.lastActivity ? new Date(u.lastActivity).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-3 py-3 text-xs tabular-nums text-gray-900 dark:text-white">
                      {u.answered || '—'}
                    </td>
                    <td className={clsx(
                      'px-3 py-3 text-xs tabular-nums font-semibold',
                      u.accuracy == null ? 'text-gray-400'
                        : u.accuracy >= 80 ? 'text-emerald-600 dark:text-emerald-400'
                        : u.accuracy >= 60 ? 'text-amber-600 dark:text-amber-400'
                        : 'text-rose-600 dark:text-rose-400',
                    )}>
                      {u.accuracy == null ? '—' : `${u.accuracy}%`}
                    </td>
                    <td className="px-3 py-3 text-xs tabular-nums text-gray-600 dark:text-gray-300">{u.streak}</td>
                    <td className="px-3 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {new Date(u.joined).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-3 text-right whitespace-nowrap">
                      <a
                        href={`/admin/users?q=${encodeURIComponent(u.email)}`}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Open
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between gap-3 px-5 py-3 text-xs text-gray-500">
            <span>{filtered.length} user{filtered.length === 1 ? '' : 's'}</span>
            {pages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={current === 0}
                  className="btn-ghost px-2 py-1 disabled:opacity-40"
                >
                  ← Prev
                </button>
                <span>Page {current + 1} of {pages}</span>
                <button
                  onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}
                  disabled={current >= pages - 1}
                  className="btn-ghost px-2 py-1 disabled:opacity-40"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
