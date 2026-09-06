'use client'

import { useMemo, useState } from 'react'
import clsx from 'clsx'

interface AccessCode {
  id: string
  code: string
  type: string
  duration_days: number
  max_uses: number | null
  uses_count: number
  active: boolean
  expires_at: string | null
  notes: string | null
  batch_label?: string | null
  created_at: string
}

/**
 * The three offers Felipe actually hands out, plus an escape hatch.
 * None of them touch Stripe: redeeming grants `free_access` for the duration,
 * so no card is ever asked for.
 */
const PRESETS = [
  {
    id: 'lifetime',
    title: 'Lifetime — one code per person',
    blurb: 'Generates a batch of single-use codes, each good forever. Send one code to each person.',
    type: 'lifetime',
    durationDays: 36_500,
    maxUses: 1,
    quantity: 5,
    quantityEditable: true,
    prefix: 'LIFE',
  },
  {
    id: 'free30',
    title: '30 days free — up to 30 people',
    blurb: 'One shared code, redeemable 30 times, 30 days of access each.',
    type: 'free_30d',
    durationDays: 30,
    maxUses: 30,
    quantity: 1,
    quantityEditable: false,
    prefix: 'PA30',
  },
  {
    id: 'year8',
    title: '12 months free — up to 8 people',
    blurb: 'One shared code, redeemable 8 times, a full year of access each.',
    type: 'free_12m',
    durationDays: 365,
    maxUses: 8,
    quantity: 1,
    quantityEditable: false,
    prefix: 'PA12',
  },
  {
    id: 'custom',
    title: 'Custom',
    blurb: 'Set the duration, the number of redemptions and how many codes to generate.',
    type: 'custom',
    durationDays: 30,
    maxUses: 1,
    quantity: 1,
    quantityEditable: true,
    prefix: 'PA',
  },
] as const

type PresetId = (typeof PRESETS)[number]['id']

const TYPE_LABEL: Record<string, string> = {
  lifetime: 'Lifetime',
  free_12m: '12 months',
  free_30d: '30 days',
  promo_15: 'Promo 15%',
  custom:   'Custom',
}

function durationLabel(days: number): string {
  if (days >= 36_000) return 'Lifetime'
  if (days % 365 === 0) return `${days / 365} year${days === 365 ? '' : 's'}`
  return `${days} days`
}

export default function AccessCodeManager({ codes: initialCodes }: { codes: AccessCode[] }) {
  const [codes, setCodes]       = useState(initialCodes)
  const [creating, setCreating] = useState(false)
  const [error, setError]       = useState('')
  const [showForm, setShowForm] = useState(false)
  const [justMade, setJustMade] = useState<AccessCode[]>([])
  const [copied, setCopied]     = useState<string | null>(null)

  const [presetId, setPresetId] = useState<PresetId>('lifetime')
  const preset = PRESETS.find((p) => p.id === presetId)!

  const [duration, setDuration] = useState<number>(preset.durationDays)
  const [maxUses, setMaxUses]   = useState<number>(preset.maxUses)
  const [quantity, setQuantity] = useState<number>(preset.quantity)
  const [label, setLabel]       = useState('')

  function choose(id: PresetId) {
    const p = PRESETS.find((x) => x.id === id)!
    setPresetId(id)
    setDuration(p.durationDays)
    setMaxUses(p.maxUses)
    setQuantity(p.quantity)
    setError('')
  }

  const summary = useMemo(() => {
    const who = quantity > 1
      ? `${quantity} single-use codes`
      : maxUses === 1 ? '1 code, usable once' : `1 code, usable ${maxUses} times`
    return `${who} · ${durationLabel(duration)} of access · no credit card`
  }, [quantity, maxUses, duration])

  async function create() {
    setCreating(true)
    setError('')
    try {
      const res = await fetch('/api/admin/codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type:          preset.type,
          duration_days: duration,
          max_uses:      quantity > 1 ? 1 : maxUses,
          quantity,
          prefix:        preset.prefix,
          batch_label:   label.trim() || null,
        }),
      })
      const json = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(
          json.error === 'column_missing'
            ? 'Run migration 011 first — the batch label column is missing.'
            : json.error === 'forbidden'
              ? 'This account is not an admin.'
              : json.error ?? 'Create failed',
        )
      } else {
        const made: AccessCode[] = json.codes ?? []
        setCodes((prev) => [...made, ...prev])
        setJustMade(made)
        setShowForm(false)
        setLabel('')
      }
    } catch {
      setError('Network error. Please try again.')
    }
    setCreating(false)
  }

  async function setActive(id: string, active: boolean) {
    const res = await fetch('/api/admin/codes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, active }),
    })
    if (res.ok) setCodes((prev) => prev.map((c) => (c.id === id ? { ...c, active } : c)))
  }

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text).then(
      () => { setCopied(key); setTimeout(() => setCopied((k) => (k === key ? null : k)), 1500) },
      () => {},
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => { setShowForm((v) => !v); setJustMade([]) }} className="btn-primary text-sm">
          {showForm ? 'Cancel' : '+ New code'}
        </button>
      </div>

      {/* ── Freshly generated batch: the one moment these are easy to copy ── */}
      {justMade.length > 0 && (
        <div className="card p-5 space-y-3 border-emerald-500/40">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="font-semibold text-emerald-600 dark:text-emerald-400">
              {justMade.length === 1 ? 'Code created' : `${justMade.length} codes created`}
            </h2>
            <button
              onClick={() => copy(justMade.map((c) => c.code).join('\n'), 'all')}
              className="btn-ghost text-xs px-3 py-1.5"
            >
              {copied === 'all' ? 'Copied' : 'Copy all'}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {justMade.map((c) => (
              <button
                key={c.id}
                onClick={() => copy(c.code, c.id)}
                className="font-mono text-sm px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white hover:ring-2 hover:ring-emerald-500/40"
                title="Copy"
              >
                {copied === c.id ? 'Copied' : c.code}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Create form ── */}
      {showForm && (
        <div className="card p-5 space-y-5">
          <h2 className="font-semibold text-gray-900 dark:text-white">New access code</h2>

          <div className="grid sm:grid-cols-2 gap-3">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => choose(p.id)}
                className={clsx(
                  'text-left rounded-xl border p-3 transition-colors',
                  presetId === p.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
                )}
                aria-pressed={presetId === p.id}
              >
                <div className="font-medium text-sm text-gray-900 dark:text-white">{p.title}</div>
                <div className="text-xs text-gray-500 mt-1 leading-relaxed">{p.blurb}</div>
              </button>
            ))}
          </div>

          {presetId === 'custom' && (
            <div className="grid sm:grid-cols-3 gap-4">
              <label className="space-y-1 block">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Days of access</span>
                <input
                  type="number" min={1} max={36500} value={duration}
                  onChange={(e) => setDuration(Math.max(1, Number(e.target.value) || 1))}
                  className="input w-full"
                />
              </label>
              <label className="space-y-1 block">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Redemptions per code</span>
                <input
                  type="number" min={1} value={maxUses}
                  onChange={(e) => setMaxUses(Math.max(1, Number(e.target.value) || 1))}
                  className="input w-full"
                  disabled={quantity > 1}
                />
              </label>
              <label className="space-y-1 block">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">How many codes</span>
                <input
                  type="number" min={1} max={200} value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Math.min(200, Number(e.target.value) || 1)))}
                  className="input w-full"
                />
              </label>
            </div>
          )}

          {presetId === 'lifetime' && (
            <label className="space-y-1 block max-w-[220px]">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">How many people</span>
              <input
                type="number" min={1} max={200} value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Math.min(200, Number(e.target.value) || 1)))}
                className="input w-full"
              />
            </label>
          )}

          <label className="space-y-1 block">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Label (optional — groups this batch in the list)
            </span>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Instructors — Sep 2026"
              className="input w-full"
              maxLength={120}
            />
          </label>

          <p className="text-xs text-gray-500">{summary}</p>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button onClick={create} disabled={creating} className="btn-primary text-sm">
            {creating ? 'Generating…' : quantity > 1 ? `Generate ${quantity} codes` : 'Generate code'}
          </button>
        </div>
      )}

      {/* ── Existing codes ── */}
      <div className="card overflow-x-auto">
        {codes.length === 0 ? (
          <p className="text-sm text-gray-500 p-6 text-center">
            No access codes yet. Create one above.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                {['Code', 'Type', 'Access', 'Uses', 'Batch', 'Created', ''].map((h) => (
                  <th key={h} className="px-3 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {codes.map((c) => {
                const usedUp = c.max_uses != null && c.uses_count >= c.max_uses
                return (
                  <tr key={c.id} className={clsx('hover:bg-gray-50 dark:hover:bg-gray-800/30', !c.active && 'opacity-55')}>
                    <td className="px-3 py-3">
                      <button
                        onClick={() => copy(c.code, c.id)}
                        className="font-mono font-medium text-gray-900 dark:text-white hover:underline"
                        title="Copy"
                      >
                        {copied === c.id ? 'Copied' : c.code}
                      </button>
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {TYPE_LABEL[c.type] ?? c.type}
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap">
                      {durationLabel(c.duration_days)}
                    </td>
                    <td className={clsx('px-3 py-3 text-xs tabular-nums whitespace-nowrap',
                      usedUp ? 'text-amber-600 dark:text-amber-400' : 'text-gray-600 dark:text-gray-300')}>
                      {c.uses_count} / {c.max_uses ?? '∞'}
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-500 max-w-[160px] truncate">
                      {c.batch_label ?? '—'}
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => setActive(c.id, !c.active)}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {c.active ? 'Deactivate' : 'Reactivate'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
