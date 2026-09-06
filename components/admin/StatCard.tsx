import clsx from 'clsx'

export interface Trend {
  pct: number | null
  /** Falling is good for some metrics (cancellations), bad for most. */
  invert?: boolean
}

/**
 * One headline number.
 *
 * `value` is a string so a metric with nothing to report can pass "—" and an
 * explanation, rather than a 0 that reads as a real measurement.
 */
export default function StatCard({
  label,
  value,
  hint,
  empty,
  trend,
  accent = 'blue',
}: {
  label: string
  value: string
  /** How the number is calculated — shown on hover and to screen readers. */
  hint: string
  /** Shown instead of a trend when there is no data behind the number. */
  empty?: string | null
  trend?: Trend
  accent?: 'blue' | 'emerald' | 'violet' | 'amber' | 'teal' | 'rose'
}) {
  const accents: Record<string, string> = {
    blue:    'text-blue-600 dark:text-blue-400',
    emerald: 'text-emerald-600 dark:text-emerald-400',
    violet:  'text-violet-600 dark:text-violet-400',
    amber:   'text-amber-600 dark:text-amber-400',
    teal:    'text-teal-600 dark:text-teal-400',
    rose:    'text-rose-600 dark:text-rose-400',
  }

  const pct = trend?.pct ?? null
  const good = pct == null ? null : trend?.invert ? pct <= 0 : pct >= 0

  return (
    <div className="card p-4 space-y-1.5" title={hint}>
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide flex items-center gap-1.5">
        {label}
        <span
          aria-hidden="true"
          className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border border-gray-300 dark:border-gray-600 text-[9px] leading-none text-gray-400"
        >
          i
        </span>
        <span className="sr-only">— {hint}</span>
      </p>

      <p className={clsx('text-3xl font-bold tabular-nums', accents[accent])}>{value}</p>

      {pct != null ? (
        <p className={clsx(
          'text-xs font-medium tabular-nums',
          good ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400',
        )}>
          {pct >= 0 ? '↑' : '↓'} {Math.abs(pct)}% vs previous period
        </p>
      ) : (
        <p className="text-xs text-gray-400">{empty ?? 'No comparison yet'}</p>
      )}
    </div>
  )
}
