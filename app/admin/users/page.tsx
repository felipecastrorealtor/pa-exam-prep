import Link from 'next/link'
import clsx from 'clsx'
import { createAdminClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Users — Admin' }

export const dynamic = 'force-dynamic'

type ProfileRow = {
  id: string
  email: string
  role: string
  subscription_status: string | null
  subscription_expires_at: string | null
  created_at: string
}

type ProgressRow = {
  user_id: string
  total_questions: number | null
  total_correct: number | null
  total_sessions: number | null
  daily_streak: number | null
  level: number | null
  xp: number | null
  exam_date: string | null
  last_study_date: string | null
}

type ExamRow = {
  user_id: string
  score_pct: number | null
  completed_at: string | null
}

const PAID = new Set(['active', 'trialing', 'past_due'])

const PLAN_FILTERS = [
  { id: 'all',         label: 'All' },
  { id: 'active',      label: 'Paying' },
  { id: 'trialing',    label: 'Trialing' },
  { id: 'free_access', label: 'Free access' },
  { id: 'past_due',    label: 'Past due' },
  { id: 'canceled',    label: 'Cancelled' },
] as const

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { page?: string; plan?: string; q?: string }
}) {
  const supabase = await createAdminClient()
  const page    = Math.max(1, parseInt(searchParams.page ?? '1', 10) || 1)
  const perPage = 50
  const from    = (page - 1) * perPage
  const to      = from + perPage - 1

  const plan   = PLAN_FILTERS.some((p) => p.id === searchParams.plan) ? searchParams.plan! : 'all'
  const search = (searchParams.q ?? '').trim()

  let query = supabase
    .from('profiles')
    .select('id, email, role, subscription_status, subscription_expires_at, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (plan !== 'all')  query = query.eq('subscription_status', plan)
  // ilike with the term escaped for the pattern language, so a stray % from a
  // pasted address can't turn into a wildcard.
  if (search) query = query.ilike('email', `%${search.replace(/[%_]/g, '\\$&')}%`)

  const { data: profiles, count } = await query.range(from, to)

  const rows = (profiles ?? []) as ProfileRow[]
  const ids  = rows.map((p) => p.id)

  const [{ data: progressRows }, { data: examRows }] = await Promise.all([
    ids.length
      ? supabase
          .from('user_progress')
          .select('user_id, total_questions, total_correct, total_sessions, daily_streak, level, xp, exam_date, last_study_date')
          .in('user_id', ids)
      : Promise.resolve({ data: [] as ProgressRow[] }),
    ids.length
      ? supabase
          .from('study_sessions')
          .select('user_id, score_pct, completed_at')
          .eq('session_type', 'exam')
          .in('user_id', ids)
          .not('completed_at', 'is', null)
          .order('completed_at', { ascending: false })
      : Promise.resolve({ data: [] as ExamRow[] }),
  ])

  const progressBy = new Map<string, ProgressRow>()
  for (const r of (progressRows ?? []) as ProgressRow[]) progressBy.set(r.user_id, r)

  // Newest first, so the first entry per user is their most recent mock exam.
  const exams = new Map<string, { count: number; last: number | null; best: number | null }>()
  for (const r of (examRows ?? []) as ExamRow[]) {
    const pct = r.score_pct == null ? null : Number(r.score_pct)
    const e = exams.get(r.user_id) ?? { count: 0, last: pct, best: null }
    e.count += 1
    if (pct != null) e.best = e.best == null ? pct : Math.max(e.best, pct)
    exams.set(r.user_id, e)
  }

  const paidCount = rows.filter((p) => PAID.has(p.subscription_status ?? '')).length
  const freeCount = rows.filter((p) => p.subscription_status === 'free_access').length
  const active7   = rows.filter((p) => {
    const d = progressBy.get(p.id)?.last_study_date
    if (!d) return false
    return (Date.now() - new Date(d).getTime()) / 86_400_000 <= 7
  }).length

  const STATUS_COLOR: Record<string, string> = {
    active:      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    trialing:    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    free_access: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
    past_due:    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    canceled:    'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
  }

  const totalPages = Math.ceil((count ?? 0) / perPage)
  const qs = (over: Record<string, string | number>) => {
    const p = new URLSearchParams()
    if (plan !== 'all') p.set('plan', plan)
    if (search) p.set('q', search)
    for (const [k, v] of Object.entries(over)) {
      if (v === '' || v === 'all') p.delete(k)
      else p.set(k, String(v))
    }
    const s = p.toString()
    return s ? `/admin/users?${s}` : '/admin/users'
  }

  const pct = (n: number | null) => (n == null ? '—' : `${Math.round(n)}%`)
  const accColor = (n: number | null) =>
    n == null ? 'text-gray-400'
      : n >= 80 ? 'text-emerald-600 dark:text-emerald-400'
      : n >= 60 ? 'text-amber-600 dark:text-amber-400'
      : 'text-red-600 dark:text-red-400'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Subscribers &amp; performance</h1>
        <span className="text-sm text-gray-500">{count ?? 0} account{count === 1 ? '' : 's'}</span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <nav className="inline-flex flex-wrap rounded-xl border border-gray-200 dark:border-gray-700 p-1 bg-white dark:bg-gray-900">
          {PLAN_FILTERS.map((f) => (
            <Link
              key={f.id}
              href={qs({ plan: f.id, page: 1 })}
              aria-current={plan === f.id ? 'page' : undefined}
              className={clsx(
                'px-3 py-1.5 text-sm rounded-lg transition-colors',
                plan === f.id ? 'bg-blue-600 text-white font-medium' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white',
              )}
            >
              {f.label}
            </Link>
          ))}
        </nav>

        <form action="/admin/users" method="get" className="flex gap-2">
          {plan !== 'all' && <input type="hidden" name="plan" value={plan} />}
          <label className="sr-only" htmlFor="q">Search by email</label>
          <input
            id="q" name="q" type="search" defaultValue={search}
            placeholder="Search email" className="input text-sm w-56"
          />
          <button type="submit" className="btn-ghost text-sm px-3">Search</button>
          {search && (
            <Link href={qs({ q: '', page: 1 })} className="btn-ghost text-sm px-3">Clear</Link>
          )}
        </form>
      </div>

      {/* Summary for the accounts on this page */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 [&>*]:min-w-0">
        {[
          { label: 'Paying / trialing',   value: paidCount },
          { label: 'Free access codes',   value: freeCount },
          { label: 'Studied last 7 days', value: active7 },
          { label: 'Mock exams taken',    value: (examRows ?? []).length },
        ].map((s) => (
          <div key={s.label} className="card px-4 py-3">
            <div className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="card p-8 text-center text-sm text-gray-500">
          No accounts match this filter.
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                {['Email', 'Role', 'Status', 'Expires', 'Level', 'Answered', 'Accuracy', 'Streak', 'Exams', 'Last exam', 'Best exam', 'Exam date', 'Last study', 'Joined'].map((h) => (
                  <th key={h} className="px-3 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {rows.map((p) => {
                const pr  = progressBy.get(p.id)
                const ex  = exams.get(p.id)
                const answered = pr?.total_questions ?? 0
                const accuracy = answered > 0 ? ((pr?.total_correct ?? 0) / answered) * 100 : null

                return (
                  <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                    <td className="px-3 py-3 text-gray-900 dark:text-white font-medium max-w-[200px] truncate">
                      {p.email}
                    </td>
                    <td className="px-3 py-3">
                      {p.role === 'admin' ? (
                        <span className="text-xs bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 px-2 py-0.5 rounded-full font-semibold">
                          admin
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">user</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${STATUS_COLOR[p.subscription_status ?? ''] ?? 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}`}>
                        {p.subscription_status ?? 'none'}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {p.subscription_expires_at ? new Date(p.subscription_expires_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-3 py-3 text-gray-600 dark:text-gray-300 text-xs whitespace-nowrap tabular-nums">
                      {pr ? `${pr.level ?? 1} · ${pr.xp ?? 0} XP` : '—'}
                    </td>
                    <td className="px-3 py-3 text-gray-900 dark:text-white text-xs tabular-nums">
                      {answered || '—'}
                    </td>
                    <td className={`px-3 py-3 text-xs font-semibold tabular-nums ${accColor(accuracy)}`}>
                      {pct(accuracy)}
                    </td>
                    <td className="px-3 py-3 text-gray-600 dark:text-gray-300 text-xs tabular-nums">
                      {pr?.daily_streak ?? 0}
                    </td>
                    <td className="px-3 py-3 text-gray-600 dark:text-gray-300 text-xs tabular-nums">
                      {ex?.count ?? 0}
                    </td>
                    <td className={`px-3 py-3 text-xs font-semibold tabular-nums ${accColor(ex?.last ?? null)}`}>
                      {pct(ex?.last ?? null)}
                    </td>
                    <td className={`px-3 py-3 text-xs tabular-nums ${accColor(ex?.best ?? null)}`}>
                      {pct(ex?.best ?? null)}
                    </td>
                    <td className="px-3 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {pr?.exam_date ? new Date(pr.exam_date).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-3 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {pr?.last_study_date ? new Date(pr.last_study_date).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-3 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {page > 1 && (
            <Link href={qs({ page: page - 1 })} className="btn-ghost text-sm px-3 py-1.5">← Prev</Link>
          )}
          <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
          {page < totalPages && (
            <Link href={qs({ page: page + 1 })} className="btn-ghost text-sm px-3 py-1.5">Next →</Link>
          )}
        </div>
      )}
    </div>
  )
}
