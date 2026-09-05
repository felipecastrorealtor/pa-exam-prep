'use client'

import { useState, useMemo } from 'react'

export type AdminQuestion = {
  id: string
  unit_id: number
  legacy_id: number
  question_en: string
  option_a_en: string
  option_b_en: string
  option_c_en: string
  option_d_en: string
  correct: string
  explanation_en: string | null
  page_ref: number | null
  enabled: boolean
  question_es: string | null
  option_a_es: string | null
  option_b_es: string | null
  option_c_es: string | null
  option_d_es: string | null
  explanation_es: string | null
}

type Unit = { id: number; title_en: string }

const L = ['A', 'B', 'C', 'D'] as const

export default function QuestionEditor({
  questions, units,
}: { questions: AdminQuestion[]; units: Unit[] }) {
  const [rows, setRows]       = useState(questions)
  const [unitId, setUnitId]   = useState<number | 'all'>('all')
  const [search, setSearch]   = useState('')
  const [openId, setOpenId]   = useState<string | null>(null)
  const [draft, setDraft]     = useState<AdminQuestion | null>(null)
  const [saving, setSaving]   = useState(false)
  const [msg, setMsg]         = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((r) => {
      if (unitId !== 'all' && r.unit_id !== unitId) return false
      if (!q) return true
      return (
        r.question_en.toLowerCase().includes(q) ||
        (r.question_es ?? '').toLowerCase().includes(q) ||
        (r.explanation_en ?? '').toLowerCase().includes(q) ||
        `${r.unit_id}_${r.legacy_id}`.includes(q)
      )
    })
  }, [rows, unitId, search])

  function open(r: AdminQuestion) {
    setOpenId(r.id === openId ? null : r.id)
    setDraft({ ...r })
    setMsg(null)
  }

  async function save() {
    if (!draft) return
    setSaving(true); setMsg(null)

    const res = await fetch('/api/admin/questions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: draft.id,
        en: {
          question_en: draft.question_en,
          option_a_en: draft.option_a_en,
          option_b_en: draft.option_b_en,
          option_c_en: draft.option_c_en,
          option_d_en: draft.option_d_en,
          correct: draft.correct,
          explanation_en: draft.explanation_en,
          page_ref: draft.page_ref,
          enabled: draft.enabled,
        },
        es: {
          question_es:    draft.question_es ?? '',
          option_a_es:    draft.option_a_es ?? '',
          option_b_es:    draft.option_b_es ?? '',
          option_c_es:    draft.option_c_es ?? '',
          option_d_es:    draft.option_d_es ?? '',
          explanation_es: draft.explanation_es ?? '',
        },
      }),
    })

    const json = await res.json()
    if (!res.ok) {
      setMsg({ kind: 'err', text: json.error ?? 'Save failed' })
    } else {
      setRows((prev) => prev.map((r) => (r.id === draft.id ? draft : r)))
      setMsg({ kind: 'ok', text: 'Saved' })
    }
    setSaving(false)
  }

  const set = (k: keyof AdminQuestion, v: unknown) =>
    setDraft((d) => (d ? { ...d, [k]: v } : d))

  const inputCls = 'w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm'

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={unitId}
          onChange={(e) => setUnitId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          className={inputCls + ' max-w-xs'}
        >
          <option value="all">All units ({rows.length})</option>
          {units.map((u) => {
            const n = rows.filter((r) => r.unit_id === u.id).length
            return <option key={u.id} value={u.id}>{u.id}. {u.title_en} ({n})</option>
          })}
        </select>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search text, explanation, or 12_5…"
          className={inputCls + ' flex-1 min-w-[220px]'}
        />

        <span className="text-sm text-gray-500">{filtered.length} shown</span>
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.map((r) => (
          <div key={r.id} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
            <button
              onClick={() => open(r)}
              className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/50"
            >
              <span className="font-mono text-xs text-gray-400 mt-0.5 shrink-0">
                {r.unit_id}_{r.legacy_id}
              </span>
              <span className="flex-1 text-sm text-gray-800 dark:text-gray-200 line-clamp-2">
                {r.question_en}
              </span>
              <span className="text-xs font-bold text-emerald-600 shrink-0">{r.correct}</span>
              {!r.enabled && <span className="text-xs text-red-500 shrink-0">off</span>}
            </button>

            {openId === r.id && draft && (
              <div className="border-t border-gray-200 dark:border-gray-800 p-4 space-y-4 bg-gray-50 dark:bg-gray-950/40">
                {/* English */}
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-500">English</p>
                  <textarea rows={2} className={inputCls} value={draft.question_en}
                    onChange={(e) => set('question_en', e.target.value)} />
                  {L.map((letter) => {
                    const key = `option_${letter.toLowerCase()}_en` as keyof AdminQuestion
                    return (
                      <div key={letter} className="flex items-center gap-2">
                        <button
                          onClick={() => set('correct', letter)}
                          title="Mark as the correct answer"
                          className={
                            'w-8 h-8 rounded-lg text-xs font-bold shrink-0 ' +
                            (draft.correct === letter
                              ? 'bg-emerald-600 text-white'
                              : 'bg-gray-200 dark:bg-gray-800 text-gray-500')
                          }
                        >
                          {letter}
                        </button>
                        <input className={inputCls} value={String(draft[key] ?? '')}
                          onChange={(e) => set(key, e.target.value)} />
                      </div>
                    )
                  })}
                  <textarea rows={3} className={inputCls} placeholder="Explanation"
                    value={draft.explanation_en ?? ''}
                    onChange={(e) => set('explanation_en', e.target.value)} />
                </div>

                {/* Spanish */}
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
                    Español — keep each option in the same A–D position as English
                  </p>
                  <textarea rows={2} className={inputCls} value={draft.question_es ?? ''}
                    onChange={(e) => set('question_es', e.target.value)} />
                  {L.map((letter) => {
                    const key = `option_${letter.toLowerCase()}_es` as keyof AdminQuestion
                    return (
                      <div key={letter} className="flex items-center gap-2">
                        <span className={
                          'w-8 h-8 rounded-lg text-xs font-bold shrink-0 flex items-center justify-center ' +
                          (draft.correct === letter
                            ? 'bg-emerald-600/20 text-emerald-600 border border-emerald-600'
                            : 'bg-gray-200 dark:bg-gray-800 text-gray-500')
                        }>{letter}</span>
                        <input className={inputCls} value={String(draft[key] ?? '')}
                          onChange={(e) => set(key, e.target.value)} />
                      </div>
                    )
                  })}
                  <textarea rows={3} className={inputCls} placeholder="Explicación"
                    value={draft.explanation_es ?? ''}
                    onChange={(e) => set('explanation_es', e.target.value)} />
                </div>

                {/* Meta + save */}
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <label className="text-xs text-gray-500 flex items-center gap-2">
                    Page
                    <input type="number" className={inputCls + ' w-24'}
                      value={draft.page_ref ?? ''}
                      onChange={(e) => set('page_ref', e.target.value === '' ? null : Number(e.target.value))} />
                  </label>
                  <label className="text-xs text-gray-500 flex items-center gap-2">
                    <input type="checkbox" checked={draft.enabled}
                      onChange={(e) => set('enabled', e.target.checked)} />
                    Enabled
                  </label>

                  <div className="flex-1" />

                  {msg && (
                    <span className={'text-xs ' + (msg.kind === 'ok' ? 'text-emerald-600' : 'text-red-500')}>
                      {msg.text}
                    </span>
                  )}
                  <button onClick={save} disabled={saving}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold disabled:opacity-50">
                    {saving ? 'Saving…' : 'Save changes'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {filtered.length === 0 && (
          <p className="text-sm text-gray-500 py-8 text-center">No questions match.</p>
        )}
      </div>
    </div>
  )
}
