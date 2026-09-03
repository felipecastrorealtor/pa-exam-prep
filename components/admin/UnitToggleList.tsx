'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import clsx from 'clsx'

interface Unit {
  id: number
  titleEn: string
  titleEs: string | null
  enabled: boolean
  displayOrder: number
  questionCount: number
}

export default function UnitToggleList({ units: initialUnits }: { units: Unit[] }) {
  const supabase = createClient()
  const [units, setUnits] = useState(initialUnits)
  const [saving, setSaving] = useState<number | null>(null)

  const toggle = async (id: number, current: boolean) => {
    setSaving(id)
    const { error } = await supabase
      .from('units')
      .update({ enabled: !current })
      .eq('id', id)

    if (!error) {
      setUnits((prev) => prev.map((u) => u.id === id ? { ...u, enabled: !current } : u))
    }
    setSaving(null)
  }

  return (
    <div className="card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wide">
              Unit
            </th>
            <th className="px-4 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wide hidden sm:table-cell">
              Title
            </th>
            <th className="px-4 py-3 text-center font-medium text-gray-500 text-xs uppercase tracking-wide">
              Questions
            </th>
            <th className="px-4 py-3 text-center font-medium text-gray-500 text-xs uppercase tracking-wide">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {units.map((u) => (
            <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
              <td className="px-4 py-3 font-mono text-gray-500 text-xs">
                Unit {u.id}
              </td>
              <td className="px-4 py-3 text-gray-900 dark:text-white hidden sm:table-cell">
                <div>
                  <p className="font-medium">{u.titleEn}</p>
                  {u.titleEs && (
                    <p className="text-xs text-gray-400">{u.titleEs}</p>
                  )}
                </div>
              </td>
              <td className="px-4 py-3 text-center tabular-nums text-gray-500">
                {u.questionCount}
              </td>
              <td className="px-4 py-3 text-center">
                <button
                  onClick={() => toggle(u.id, u.enabled)}
                  disabled={saving === u.id}
                  className={clsx(
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none',
                    u.enabled ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-700',
                    saving === u.id && 'opacity-50 cursor-wait'
                  )}
                  aria-label={u.enabled ? 'Disable unit' : 'Enable unit'}
                >
                  <span className={clsx(
                    'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
                    u.enabled ? 'translate-x-6' : 'translate-x-1'
                  )} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
