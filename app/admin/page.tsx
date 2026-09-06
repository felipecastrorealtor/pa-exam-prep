import Link from 'next/link'
import clsx from 'clsx'
import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/server'
import { loadDashboard, PASS_SCORE, type Period } from '@/lib/admin/dashboard'
import StatCard from '@/components/admin/StatCard'
import TrendChart from '@/components/admin/TrendChart'
import RecentUsersTable from '@/components/admin/RecentUsersTable'

export const metadata: Metadata = { title: 'Admin Dashboard' }
export const dynamic = 'force-dynamic'

const PERIODS: { days: Period; label: string }[] = [
  { days: 7,  label: 'Last 7 days' },
  { days: 30, label: 'Last 30 days' },
  { days: 90, label: 'Last 90 days' },
]

function money(cents: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: currency.toUpperCase(), maximumFractionDigits: 0,
  }).format(cents / 100)
}

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: { days?: string }
}) {
  const raw    = Number(searchParams.days)
  const period: Period = raw === 7 || raw === 90 ? raw : 30

  const supabase = await createAdminClient()
  const d = await loadDashboard(supabase, period)

  const u = d.users
  const a = d.activity
  const l = d.learning

  const attentionItems = d.attention ? [
    { n: d.attention.openReports,       label: 'Reported questions',        href: '/admin/reports', tone: 'rose' as const },
    { n: d.attention.pastDue,           label: 'Payments past due',         href: '/admin/users?plan=past_due', tone: 'rose' as const },
    { n: d.attention.trialsEndingSoon ?? 0, label: 'Free access ending in 7 days', href: '/admin/users?plan=free_access', tone: 'amber' as const },
    { n: d.attention.canceledRecently,  label: 'Cancelled in last 30 days', href: '/admin/users?plan=canceled', tone: 'amber' as const },
    { n: d.attention.idle7d,            label: 'No study in 7+ days',       href: '/admin/users', tone: 'amber' as const },
    { n: d.attention.codesExpiringSoon, label: 'Access codes expiring',     href: '/admin/codes', tone: 'amber' as const },
    { n: d.attention.codesNeverUsed,    label: 'Codes never redeemed',      href: '/admin/codes', tone: 'gray' as const },
    { n: d.attention.abandonedExams,    label: 'Abandoned mock exams',      href: '/admin/users', tone: 'gray' as const },
  ] : []

  const needsAttention = attentionItems.filter((i) => i.n > 0)

  return (
    <div className="space-y-8">
      {/* ── Header + period filter ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Money comes from Stripe, everything else from the app database.
          </p>
        </div>

        <nav aria-label="Period" className="inline-flex rounded-xl border border-gray-200 dark:border-gray-700 p-1 bg-white dark:bg-gray-900">
          {PERIODS.map((p) => (
            <Link
              key={p.days}
              href={`/admin?days=${p.days}`}
              aria-current={period === p.days ? 'page' : undefined}
              className={clsx(
                'px-3 py-1.5 text-sm rounded-lg transition-colors',
                period === p.days
                  ? 'bg-blue-600 text-white font-medium'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white',
              )}
            >
              {p.label}
            </Link>
          ))}
        </nav>
      </div>

      {d.failed.length > 0 && (
        <p className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded-lg px-4 py-3">
          Could not load: {d.failed.join(', ')}. The rest of the page is current.
        </p>
      )}

      {/* ── Row 1: who is here and what they pay ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 [&>*]:min-w-0">
        <StatCard
          label="Total users" accent="blue"
          value={u ? String(u.total) : '—'}
          hint="Every account that has ever registered."
          trend={u ? { pct: u.newInPeriod.pct } : undefined}
          empty={u ? `${u.newInPeriod.current} new in this period` : 'Not available'}
        />
        <StatCard
          label="Paid subscribers" accent="emerald"
          value={u ? String(u.paid) : '—'}
          hint="Accounts with a Stripe subscription in active or past_due state — a card is on file."
          empty={u ? `${u.freeAccess} on free access codes` : 'Not available'}
        />
        <StatCard
          label="Active trials" accent="violet"
          value={u ? String(u.trialing) : '—'}
          hint="Accounts inside the 7-day Stripe trial right now."
          empty={u && u.trialing === 0 ? 'No trials running' : null}
        />
        <StatCard
          label="MRR" accent="teal"
          value={d.billing?.mrrCents != null ? money(d.billing.mrrCents, d.billing.currency) : '—'}
          hint="Monthly recurring revenue, summed from active Stripe subscriptions. Yearly prices are divided by 12."
          empty={d.billing?.note ?? (d.billing?.activeSubs === 0 ? 'No active subscriptions' : null)}
        />
      </div>

      {/* ── Row 2: are they using it, and is it working ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 [&>*]:min-w-0">
        <StatCard
          label="Active today" accent="emerald"
          value={a ? String(a.activeToday) : '—'}
          hint="Distinct users who started at least one study session today. Page views do not count."
          empty={a && a.activeToday === 0 ? 'Nobody studied yet today' : null}
        />
        <StatCard
          label="Active 7 days" accent="blue"
          value={a ? String(a.active7d) : '—'}
          hint="Distinct users who started at least one study session in the last 7 days."
          trend={a ? { pct: a.activeInPeriod.pct } : undefined}
          empty={a && a.active7d === 0 ? 'No sessions this week' : null}
        />
        <StatCard
          label="Trial → paid" accent="violet"
          value={d.conversion?.rate != null ? `${d.conversion.rate}%` : '—'}
          hint="Accounts that started a trial and are now paying, over all accounts that ever started a trial."
          empty={d.conversion && d.conversion.trialsStarted === 0
            ? 'No trials started yet'
            : d.conversion ? `${d.conversion.converted} of ${d.conversion.trialsStarted} trials` : null}
        />
        <StatCard
          label="Exam pass rate" accent="amber"
          value={d.exams?.passRate != null ? `${d.exams.passRate}%` : '—'}
          hint={`Completed mock exams scoring ${PASS_SCORE}% or higher, over all completed mock exams in this period.`}
          empty={d.exams && d.exams.completed === 0 ? 'No completed exams' : null}
        />
      </div>

      {/* ── Charts ── */}
      <div className="grid xl:grid-cols-2 gap-6 [&>*]:min-w-0">
        {d.growth ? (
          <TrendChart
            title="User growth"
            days={d.growth.days}
            series={[
              { label: 'New users',     color: '#3b82f6', values: d.growth.newUsers },
              { label: 'Trials',        color: '#8b5cf6', values: d.growth.trialsStarted },
              { label: 'Subscriptions', color: '#10b981', values: d.growth.subscriptions },
              { label: 'Cancellations', color: '#f43f5e', values: d.growth.cancellations },
            ]}
          />
        ) : (
          <div className="card p-6 text-sm text-amber-600 dark:text-amber-400">
            User growth could not be loaded.
          </div>
        )}

        {d.engagement ? (
          <TrendChart
            title="Engagement"
            days={d.engagement.days}
            series={[
              { label: 'Active users', color: '#06b6d4', values: d.engagement.activeUsers },
              { label: 'Sessions',     color: '#3b82f6', values: d.engagement.sessions },
              { label: 'Answers',      color: '#f59e0b', values: d.engagement.answers },
              { label: 'Exams',        color: '#10b981', values: d.engagement.exams },
            ]}
          />
        ) : (
          <div className="card p-6 text-sm text-amber-600 dark:text-amber-400">
            Engagement could not be loaded.
          </div>
        )}
      </div>

      {/* ── Needs attention + quick actions ── */}
      <div className="grid lg:grid-cols-3 gap-6 [&>*]:min-w-0">
        <div className="card p-5 space-y-3 lg:col-span-2">
          <h2 className="font-semibold text-gray-900 dark:text-white">Needs attention</h2>

          {!d.attention ? (
            <p className="text-sm text-amber-600 dark:text-amber-400">This section could not be loaded.</p>
          ) : needsAttention.length === 0 ? (
            <p className="text-sm text-gray-500">Nothing is waiting on you right now.</p>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {needsAttention.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="flex items-center justify-between gap-3 py-2.5 group"
                  >
                    <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                      {item.label}
                    </span>
                    <span className={clsx(
                      'text-sm font-bold tabular-nums px-2 py-0.5 rounded-full',
                      item.tone === 'rose'  ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' :
                      item.tone === 'amber' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                      'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
                    )}>
                      {item.n}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card p-5 space-y-3">
          <h2 className="font-semibold text-gray-900 dark:text-white">Quick actions</h2>
          <div className="grid gap-2">
            {[
              { href: '/admin/questions', label: 'Focus Mode Setup' },
              { href: '/admin/units',     label: 'Manage units' },
              { href: '/admin/codes',     label: 'Generate access codes' },
              { href: '/admin/users',     label: 'View all users' },
              { href: '/admin/reports',   label: 'Review reported questions' },
            ].map((x) => (
              <Link
                key={x.href}
                href={x.href}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                → {x.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Learning analytics ── */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Learning analytics</h2>

        {!l ? (
          <p className="text-sm text-amber-600 dark:text-amber-400">This section could not be loaded.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 [&>*]:min-w-0">
              <StatCard label="Average score" accent="emerald"
                value={l.avgAccuracy != null ? `${l.avgAccuracy}%` : '—'}
                hint="Mean of every student's own accuracy across all their answers."
                empty="Nobody has answered yet" />
              <StatCard label="Exam readiness" accent="blue"
                value={l.avgReadiness != null ? `${l.avgReadiness}%` : '—'}
                hint="The same readiness score students see on Inicio (accuracy 45%, coverage 40%, streak 15%), averaged."
                empty="Not enough data" />
              <StatCard label="Pass rate" accent="amber"
                value={d.exams?.passRate != null ? `${d.exams.passRate}%` : '—'}
                hint={`Mock exams at or above ${PASS_SCORE}%.`}
                empty="No completed exams" />
              <StatCard label="Questions answered" accent="violet"
                value={l.answers ? l.answers.toLocaleString() : '—'}
                hint="Every recorded answer, all time."
                empty="No answers yet" />
              <StatCard label="Avg study time" accent="teal"
                value={l.avgStudyMin != null ? `${l.avgStudyMin} min` : '—'}
                hint="Mean duration of a study session in this period."
                empty="No timed sessions" />
              <StatCard label="Avg streak" accent="rose"
                value={l.avgStreak != null ? `${l.avgStreak}d` : '—'}
                hint="Mean current daily streak across all accounts."
                empty="No streaks yet" />
            </div>

            <div className="grid lg:grid-cols-2 gap-6 [&>*]:min-w-0">
              {/* Hardest units */}
              <div className="card p-5 space-y-3">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Hardest units</h3>
                  {l.overallCorrectPct != null && (
                    <span className="text-xs text-gray-500">Overall {l.overallCorrectPct}% correct</span>
                  )}
                </div>
                {l.hardestUnits.length === 0 ? (
                  <p className="text-sm text-gray-400">
                    No unit has 30+ answers yet — not enough data to rank them.
                  </p>
                ) : (
                  <ul className="space-y-2.5">
                    {l.hardestUnits.map((h) => {
                      const diff = l.overallCorrectPct != null ? h.correctPct - l.overallCorrectPct : null
                      return (
                        <li key={h.unitId} className="space-y-1">
                          <div className="flex items-baseline justify-between gap-3 text-sm">
                            <span className="text-gray-800 dark:text-gray-200 truncate">
                              <span className="text-gray-400 font-mono text-xs mr-1.5">U{h.unitId}</span>
                              {h.title}
                            </span>
                            <span className="tabular-nums font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                              {h.correctPct}%
                              {diff != null && (
                                <span className={clsx('ml-1.5 text-xs font-normal',
                                  diff < 0 ? 'text-rose-500' : 'text-emerald-500')}>
                                  {diff >= 0 ? '+' : ''}{diff}
                                </span>
                              )}
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                            <div
                              className={clsx('h-full rounded-full',
                                h.correctPct >= 75 ? 'bg-emerald-500' : h.correctPct >= 60 ? 'bg-amber-500' : 'bg-rose-500')}
                              style={{ width: `${h.correctPct}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-400">{h.answers} answers</p>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>

              {/* Most missed questions */}
              <div className="card p-5 space-y-3">
                <h3 className="font-semibold text-gray-900 dark:text-white">Most missed questions</h3>
                {l.mostMissed.length === 0 ? (
                  <p className="text-sm text-gray-400">
                    No question has 10+ answers yet — too small a sample to call any of them hard.
                  </p>
                ) : (
                  <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                    {l.mostMissed.map((m) => (
                      <li key={m.id} className="py-2.5 space-y-1">
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="text-xs font-mono text-gray-400">U{m.unitId} · #{m.legacyId}</span>
                          <span className="text-sm font-semibold tabular-nums text-rose-600 dark:text-rose-400">
                            {m.wrongPct}% wrong
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-snug">{m.text}</p>
                        <div className="flex items-center gap-3 text-xs text-gray-400">
                          <span>{m.answers} answers</span>
                          {m.reports > 0 && (
                            <span className="text-amber-600 dark:text-amber-400">{m.reports} report{m.reports === 1 ? '' : 's'}</span>
                          )}
                          <Link href={`/admin/questions#q-${m.id}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                            Edit
                          </Link>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </>
        )}
      </section>

      {/* ── Recent users ── */}
      <RecentUsersTable users={d.recentUsers} />
    </div>
  )
}
