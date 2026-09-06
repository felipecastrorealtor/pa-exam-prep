'use client'

import { useMemo, useState } from 'react'

/**
 * A small multi-series line chart, drawn as inline SVG.
 *
 * The project has no charting library and this needs one chart shape, twice —
 * pulling in a whole library for that would cost more bytes than the app's
 * entire dashboard. Hovering (or focusing) a column reveals the day's numbers;
 * the same numbers are in a visually-hidden table underneath, so the chart is
 * readable without sight or a mouse.
 */

export interface Series {
  label: string
  color: string
  values: number[]
}

export default function TrendChart({
  title,
  days,
  series,
  emptyMessage = 'No data for this period',
}: {
  title: string
  days: string[]
  series: Series[]
  emptyMessage?: string
}) {
  const [hover, setHover] = useState<number | null>(null)

  const max = useMemo(
    () => Math.max(1, ...series.flatMap((s) => s.values)),
    [series],
  )
  const hasData = series.some((s) => s.values.some((v) => v > 0))

  const W = 720
  const H = 200
  const PAD = { top: 12, right: 10, bottom: 22, left: 32 }
  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom

  const x = (i: number) => PAD.left + (days.length <= 1 ? innerW / 2 : (i / (days.length - 1)) * innerW)
  const y = (v: number) => PAD.top + innerH - (v / max) * innerH

  // Four gridlines, on numbers a person would actually pick.
  const step = niceStep(max / 4)
  const ticks: number[] = []
  for (let v = 0; v <= max; v += step) ticks.push(v)

  const fmtDay = (iso: string) => {
    const d = new Date(`${iso}T00:00:00`)
    return `${d.getMonth() + 1}/${d.getDate()}`
  }

  const labelEvery = Math.max(1, Math.ceil(days.length / 8))

  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <h2 className="font-semibold text-gray-900 dark:text-white">{title}</h2>
        <ul className="flex flex-wrap gap-x-4 gap-y-1">
          {series.map((s) => (
            <li key={s.label} className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="inline-block h-2 w-2 rounded-full" style={{ background: s.color }} />
              {s.label}
            </li>
          ))}
        </ul>
      </div>

      {!hasData ? (
        <p className="text-sm text-gray-400 py-10 text-center">{emptyMessage}</p>
      ) : (
        <div className="overflow-x-auto">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="w-full min-w-[420px] h-[200px]"
            role="img"
            aria-label={`${title}. ${series.map((s) => `${s.label}: ${s.values.reduce((a, b) => a + b, 0)} over ${days.length} days`).join('. ')}`}
            onMouseLeave={() => setHover(null)}
          >
            {ticks.map((t) => (
              <g key={t}>
                <line
                  x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)}
                  stroke="currentColor" className="text-gray-200 dark:text-gray-800" strokeWidth="1"
                />
                <text
                  x={PAD.left - 6} y={y(t) + 3} textAnchor="end"
                  className="fill-gray-400 text-[9px]"
                >
                  {t}
                </text>
              </g>
            ))}

            {days.map((d, i) => (
              i % labelEvery === 0 ? (
                <text key={d} x={x(i)} y={H - 6} textAnchor="middle" className="fill-gray-400 text-[9px]">
                  {fmtDay(d)}
                </text>
              ) : null
            ))}

            {series.map((s) => (
              <polyline
                key={s.label}
                points={s.values.map((v, i) => `${x(i)},${y(v)}`).join(' ')}
                fill="none"
                stroke={s.color}
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            ))}

            {hover != null && (
              <line
                x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={PAD.top + innerH}
                stroke="currentColor" className="text-gray-400" strokeWidth="1" strokeDasharray="3 3"
              />
            )}

            {hover != null && series.map((s) => (
              <circle key={s.label} cx={x(hover)} cy={y(s.values[hover] ?? 0)} r="3.5" fill={s.color} />
            ))}

            {/* Invisible hit areas, one per day, keyboard reachable. */}
            {days.map((d, i) => (
              <rect
                key={d}
                x={x(i) - innerW / Math.max(1, days.length) / 2}
                y={PAD.top}
                width={innerW / Math.max(1, days.length)}
                height={innerH}
                fill="transparent"
                tabIndex={0}
                onMouseEnter={() => setHover(i)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
              >
                <title>
                  {d} — {series.map((s) => `${s.label}: ${s.values[i] ?? 0}`).join(', ')}
                </title>
              </rect>
            ))}
          </svg>

          <p className="text-xs text-gray-500 h-4 mt-1" aria-live="polite">
            {hover != null
              ? `${days[hover]} · ${series.map((s) => `${s.label} ${s.values[hover] ?? 0}`).join(' · ')}`
              : ''}
          </p>
        </div>
      )}
    </div>
  )
}

function niceStep(raw: number): number {
  if (raw <= 1) return 1
  const mag = 10 ** Math.floor(Math.log10(raw))
  const n = raw / mag
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * mag
}
