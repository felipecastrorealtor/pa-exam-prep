'use client'

import { useState } from 'react'
import Link from 'next/link'
import clsx from 'clsx'

export interface AdminReport {
  id: string
  kind: string
  message: string
  status: string
  createdAt: string
  questionId: string | null
  unitId: number | null
  legacyId: number | null
  questionText: string | null
  reporterEmail: string | null
  page: string | null
  lang: string | null
}

const KIND_LABEL: Record<string, string> = {
  answer:      'Wrong answer',
  translation: 'Translation',
  flashcard:   'Flashcard',
  app:         'App problem',
  other:       'Other',
}

const TABS = ['open', 'resolved', 'dismissed', 'all'] as const

export default function ReportTriage({
  reports: initial,
  status,
}: {
  reports: AdminReport[]
  status: string
}) {
  const [reports, setReports] = useState(initial)
  const [busy, setBusy]       = useState<string | null>(null)
  const [error, setError]     = useState('')

  async function setStatus(id: string, next: 'open' | 'resolved' | 'dismissed') {
    setBusy(id)
    setError('')
    try {
      const res = await fetch('/api/admin/reports', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: next }),
      })
      if (res.ok) {
        // On a filtered tab the row no longer belongs here; drop it.
        setReports((prev) =>
          status === 'all' || status === next
            ? prev.map((r) => (r.id === id ? { ...r, status: next } : r))
            : prev.filter((r) => r.id !== id),
        )
      } else {
        setError('Could not update that report.')
      }
    } catch {
      setError('Network error. Please try again.')
    }
    setBusy(null)
  }

  return (
    <div className="space-y-4">
      <nav className="inline-flex rounded-xl border border-gray-200 dark:border-gray-700 p-1 bg-white dark:bg-gray-900">
        {TABS.map((t) => (
          <Link
            key={t}
            href={`/admin/reports?status=${t}`}
            aria-current={status === t ? 'page' : undefined}
            className={clsx(
              'px-3 py-1.5 text-sm rounded-lg capitalize transition-colors',
              status === t ? 'bg-blue-600 text-white font-medium' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white',
            )}
          >
            {t}
          </Link>
        ))}
      </nav>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {reports.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-sm text-gray-500">
            {status === 'open' ? 'Nothing reported is waiting on you.' : `No ${status} reports.`}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {reports.map((r) => (
            <li key={r.id} className="card p-4 space-y-3">
              <div className="flex flex-wrap items-center gap-2 justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={clsx(
                    'text-xs px-2 py-0.5 rounded-full font-medium',
                    r.kind === 'answer'
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
                  )}>
                    {KIND_LABEL[r.kind] ?? r.kind}
                  </span>
                  {r.unitId != null && (
                    <span className="text-xs font-mono text-gray-400">
                      U{r.unitId}{r.legacyId != null ? ` · #${r.legacyId}` : ''}
                    </span>
                  )}
                  {r.lang && <span className="text-xs text-gray-400 uppercase">{r.lang}</span>}
                  {r.status !== 'open' && (
                    <span className="text-xs text-gray-400 capitalize">{r.status}</span>
                  )}
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(r.createdAt).toLocaleString()}
                </span>
              </div>

              {r.questionText && (
                <p className="text-sm text-gray-500 leading-snug border-l-2 border-gray-200 dark:border-gray-700 pl-3">
                  {r.questionText.length > 180 ? `${r.questionText.slice(0, 180)}…` : r.questionText}
                </p>
              )}

              <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap leading-relaxed">
                {r.message}
              </p>

              <div className="flex flex-wrap items-center gap-3 text-xs">
                {r.reporterEmail && <span className="text-gray-400">{r.reporterEmail}</span>}
                {r.questionId && (
                  <Link href={`/admin/questions#q-${r.questionId}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                    Open question
                  </Link>
                )}
                <span className="flex-1" />
                {r.status !== 'resolved' && (
                  <button
                    onClick={() => setStatus(r.id, 'resolved')}
                    disabled={busy === r.id}
                    className="btn-ghost px-3 py-1.5 text-emerald-600 dark:text-emerald-400 disabled:opacity-50"
                  >
                    Mark resolved
                  </button>
                )}
                {r.status !== 'dismissed' && (
                  <button
                    onClick={() => setStatus(r.id, 'dismissed')}
                    disabled={busy === r.id}
                    className="btn-ghost px-3 py-1.5 text-gray-500 disabled:opacity-50"
                  >
                    Dismiss
                  </button>
                )}
                {r.status !== 'open' && (
                  <button
                    onClick={() => setStatus(r.id, 'open')}
                    disabled={busy === r.id}
                    className="btn-ghost px-3 py-1.5 text-gray-500 disabled:opacity-50"
                  >
                    Reopen
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
