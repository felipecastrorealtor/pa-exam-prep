'use client'

import { useState } from 'react'
import { track } from '@/lib/analytics'

type Props = {
  questionId?: string
  context?: Record<string, unknown>
  lang: 'en' | 'es'
  className?: string
}

const KINDS = [
  { value: 'answer',      en: 'Wrong answer',        es: 'Respuesta incorrecta' },
  { value: 'translation', en: 'Translation problem', es: 'Problema de traducción' },
  { value: 'flashcard',   en: 'Flashcard',           es: 'Flashcard' },
  { value: 'app',         en: 'Something is broken', es: 'Algo no funciona' },
  { value: 'other',       en: 'Other',               es: 'Otro' },
] as const

export default function ReportErrorButton({ questionId, context, lang, className }: Props) {
  const [open, setOpen]       = useState(false)
  const [kind, setKind]       = useState<string>('answer')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [done, setDone]       = useState(false)
  const [error, setError]     = useState<string | null>(null)

  const isEs = lang === 'es'

  async function submit() {
    if (!message.trim() || sending) return
    setSending(true)
    setError(null)
    try {
      track('question_reported', { question_id: questionId ?? null, report_reason: kind })
      const res = await fetch('/api/report-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId, kind, message, context }),
      })
      let json: { error?: string } = {}
      try { json = await res.json() } catch { /* non-JSON */ }

      if (!res.ok) {
        setError(json.error ?? (isEs ? 'No se pudo enviar.' : 'Could not send.'))
      } else {
        setDone(true)
        setMessage('')
        setTimeout(() => { setOpen(false); setDone(false) }, 2000)
      }
    } catch {
      setError(isEs ? 'Error de red. Intenta de nuevo.' : 'Network error. Try again.')
    }
    setSending(false)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className={
          className ??
          'text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 underline underline-offset-2'
        }
      >
        {isEs ? 'Reportar un error' : 'Report a problem'}
      </button>
    )
  }

  return (
    <div className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 space-y-2.5">
      {done ? (
        <p className="text-xs text-emerald-600 dark:text-emerald-400">
          {isEs ? '¡Gracias! Recibimos tu reporte.' : 'Thanks — we got your report.'}
        </p>
      ) : (
        <>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              {isEs ? 'Reportar un error' : 'Report a problem'}
            </span>
            <button
              onClick={() => { setOpen(false); setError(null) }}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              {isEs ? 'Cancelar' : 'Cancel'}
            </button>
          </div>

          <select
            value={kind}
            onChange={(e) => setKind(e.target.value)}
            className="w-full text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1.5"
          >
            {KINDS.map((k) => (
              <option key={k.value} value={k.value}>{isEs ? k.es : k.en}</option>
            ))}
          </select>

          <textarea
            rows={3}
            value={message}
            maxLength={2000}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={isEs
              ? '¿Qué está mal? Sé lo más específico posible.'
              : "What's wrong? Be as specific as you can."}
            className="w-full text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1.5 leading-relaxed"
          />

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] text-gray-400 leading-tight">
              {isEs
                ? 'Enviamos automáticamente la pregunta y el idioma. Nada más.'
                : 'We attach the question and language automatically. Nothing else.'}
            </span>
            <button
              onClick={submit}
              disabled={sending || !message.trim()}
              className="text-xs px-3 py-1.5 rounded-lg bg-blue-600 text-white font-semibold disabled:opacity-50 shrink-0"
            >
              {sending ? (isEs ? 'Enviando…' : 'Sending…') : (isEs ? 'Enviar' : 'Send')}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
