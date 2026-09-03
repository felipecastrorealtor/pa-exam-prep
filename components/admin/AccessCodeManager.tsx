'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
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
  created_at: string
}

function randomCode(prefix = 'PA') {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let out = prefix
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)]
  return out
}

export default function AccessCodeManager({ codes: initialCodes }: { codes: AccessCode[] }) {
  const supabase = createClient()
  const [codes, setCodes]     = useState(initialCodes)
  const [creating, setCreating] = useState(false)
  const [error, setError]     = useState('')

  // Form state
  const [code, setCode]           = useState(randomCode())
  const [type, setType]           = useState<'free_30d' | 'promo_15'>('free_30d')
  const [duration, setDuration]   = useState(30)
  const [maxUses, setMaxUses]     = useState<number | ''>(100)
  const [notes, setNotes]         = useState('')
  const [showForm, setShowForm]   = useState(false)

  const create = async () => {
    setCreating(true)
    setError('')
    try {
      const { data, error: err } = await supabase
        .from('access_codes')
        .insert({
          code:          code.trim().toUpperCase(),
          type,
          duration_days: duration,
          max_uses:      maxUses === '' ? null : maxUses,
          notes:         notes || null,
          active:        true,
        })
        .select()
        .single()

      if (err) throw err
      if (data) setCodes((prev) => [data, ...prev])
      setShowForm(false)
      setCode(randomCode())
      setNotes('')
    } catch (err: any) {
      setError(err.message ?? 'Create failed')
    } finally {
      setCreating(false)
    }
  }

  const deactivate = async (id: string) => {
    const { error: err } = await supabase
      .from('access_codes')
      .update({ active: false })
      .eq('id', id)
    if (!err) setCodes((prev) => prev.map((c) => c.id === id ? { ...c, active: false } : c))
  }

  const copyCode = (c: string) => {
    navigator.clipboard.writeText(c).catch(() => {})
  }

  return (
    <div className="space-y-4">

      {/* Create button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowForm((v) => !v)}
          className="btn-primary text-sm"
        >
          {showForm ? 'Cancel' : '+ New code'}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">New access code</h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Code</label>
              <div className="flex gap-2">
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="input flex-1 font-mono uppercase"
                  maxLength={20}
                />
                <button
                  type="button"
                  onClick={() => setCode(randomCode())}
                  className="btn-ghost text-xs px-3"
                >
                  ↻
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="input w-full"
              >
                <option value="free_30d">Free 30-day access</option>
                <option value="promo_15">Promo $15/mo</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Duration (days)</label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                min={1}
                max={365}
                className="input w-full"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Max uses (blank = unlimited)</label>
              <input
                type="number"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value === '' ? '' : Number(e.target.value))}
                min={1}
                className="input w-full"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Notes</label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input w-full"
              placeholder="Launch promo, event giveaway…"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            onClick={create}
            disabled={creating || !code.trim()}
            className={clsx('btn-primary', creating && 'opacity-60 cursor-wait')}
          >
            {creating ? 'Creating…' : 'Create code'}
          </button>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
            <tr>
              {['Code', 'Type', 'Uses', 'Status', 'Notes', 'Created', ''].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wide whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {codes.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                <td className="px-4 py-3">
                  <button
                    onClick={() => copyCode(c.code)}
                    className="font-mono font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                    title="Click to copy"
                  >
                    {c.code}
                  </button>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">{c.type}</td>
                <td className="px-4 py-3 text-gray-700 dark:text-gray-300 tabular-nums">
                  {c.uses_count}{c.max_uses ? ` / ${c.max_uses}` : ''}
                </td>
                <td className="px-4 py-3">
                  <span className={clsx(
                    'text-xs px-2 py-0.5 rounded-full font-medium',
                    c.active
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : 'bg-gray-100 text-gray-400 dark:bg-gray-800'
                  )}>
                    {c.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs max-w-[160px] truncate">{c.notes ?? '—'}</td>
                <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                  {new Date(c.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  {c.active && (
                    <button
                      onClick={() => deactivate(c.id)}
                      className="text-xs text-red-400 hover:text-red-600 transition-colors"
                    >
                      Deactivate
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {codes.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  No access codes yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
