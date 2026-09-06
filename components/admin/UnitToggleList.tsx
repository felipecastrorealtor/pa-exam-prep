'use client'

import { useState } from 'react'
import clsx from 'clsx'

export interface AdminUnit {
  id: number
  titleEn: string
  titleEs: string | null
  enabled: boolean
  focusEnabled: boolean
  questionCount: number
  essentialCount: number
}

function Toggle({
  on, busy, onClick, label, tone,
}: {
  on: boolean
  busy: boolean
  onClick: () => void
  label: string
  tone: 'emerald' | 'amber'
}) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      role="switch"
      aria-checked={on}
      aria-label={label}
      className={clsx(
        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500',
        on
          ? tone === 'emerald' ? 'bg-emerald-500' : 'bg-amber-500'
          : 'bg-gray-200 dark:bg-gray-700',
        busy && 'opacity-50 cursor-wait',
      )}
    >
      <span className={clsx(
        'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
        on ? 'translate-x-6' : 'translate-x-1',
      )} />
    </button>
  )
}

export default function UnitToggleList({
  units: initialUnits,
  mode = 'full',
}: {
  units: AdminUnit[]
  /** 'focus' renders only the Focus-mode column — for the Focus Mode Setup page. */
  mode?: 'full' | 'focus'
}) {
  const [units, setUnits] = useState(initialUnits)
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError]   = useState('')

  async function patch(id: number, field: 'enabled' | 'focus_enabled', value: boolean) {
    const key = `${id}:${field}`
    setSaving(key)
    setError('')
    try {
      const res = await fetch('/api/admin/units', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, [field]: value }),
      })
      const json = await res.json().catch(() => ({}))
      if (res.ok) {
        setUnits((prev) => prev.map((u) => (
          u.id === id
            ? { ...u, ...(field === 'enabled' ? { enabled: value } : { focusEnabled: value }) }
            : u
        )))
      } else {
        setError(
          json.error === 'column_missing'
            ? 'Run migration 011 first — units.focus_enabled is missing.'
            : json.error === 'forbidden'
              ? 'This account is not an admin.'
              : json.error === 'no_rows_updated'
                ? 'The database accepted the request but changed nothing. Reload and try again.'
                : 'Could not save that change.',
        )
      }
    } catch {
      setError('Network error. Please try again.')
    }
    setSaving(null)
  }

  const focusOff = units.filter((u) => !u.focusEnabled).length

  return (
    <div className="space-y-3">
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {mode === 'focus' && (
        <p className="text-sm text-gray-500 leading-relaxed">
          Turning a unit off here removes it from Focus mode only — students still
          get it in Complete mode. {focusOff > 0
            ? `${focusOff} unit${focusOff === 1 ? '' : 's'} currently excluded.`
            : 'No units excluded right now.'}
        </p>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wide">Unit</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wide hidden sm:table-cell">Title</th>
              <th className="px-4 py-3 text-center font-medium text-gray-500 text-xs uppercase tracking-wide">Questions</th>
              <th className="px-4 py-3 text-center font-medium text-gray-500 text-xs uppercase tracking-wide">Essential</th>
              {mode === 'full' && (
                <th className="px-4 py-3 text-center font-medium text-gray-500 text-xs uppercase tracking-wide">In app</th>
              )}
              <th className="px-4 py-3 text-center font-medium text-gray-500 text-xs uppercase tracking-wide">In Focus</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {units.map((u) => (
              <tr key={u.id} className={clsx(
                'hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors',
                !u.enabled && 'opacity-55',
              )}>
                <td className="px-4 py-3 font-mono text-gray-500 text-xs whitespace-nowrap">Unit {u.id}</td>
                <td className="px-4 py-3 text-gray-900 dark:text-white hidden sm:table-cell">
                  <p className="font-medium">{u.titleEn}</p>
                  {u.titleEs && <p className="text-xs text-gray-400">{u.titleEs}</p>}
                </td>
                <td className="px-4 py-3 text-center tabular-nums text-gray-500">{u.questionCount}</td>
                <td className={clsx(
                  'px-4 py-3 text-center tabular-nums',
                  u.essentialCount === 0 ? 'text-gray-400' : 'text-amber-600 dark:text-amber-400 font-medium',
                )}>
                  {u.essentialCount}
                </td>
                {mode === 'full' && (
                  <td className="px-4 py-3 text-center">
                    <Toggle
                      on={u.enabled}
                      busy={saving === `${u.id}:enabled`}
                      onClick={() => patch(u.id, 'enabled', !u.enabled)}
                      label={`${u.enabled ? 'Hide' : 'Show'} unit ${u.id} in the app`}
                      tone="emerald"
                    />
                  </td>
                )}
                <td className="px-4 py-3 text-center">
                  <Toggle
                    on={u.focusEnabled}
                    busy={saving === `${u.id}:focus_enabled`}
                    onClick={() => patch(u.id, 'focus_enabled', !u.focusEnabled)}
                    label={`${u.focusEnabled ? 'Exclude' : 'Include'} unit ${u.id} in Focus mode`}
                    tone="amber"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
