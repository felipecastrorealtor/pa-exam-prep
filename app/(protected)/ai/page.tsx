'use client'

import Markdown from '@/components/ui/Markdown'
import { useState, useRef, useEffect } from 'react'

type Msg = { role: 'user' | 'model'; text: string }

const SUGGESTIONS = [
  '¿Cuál es el tiempo de rescisión en un contrato de PA?',
  '¿Qué es el fair housing y qué clases protege?',
  '¿Cómo funciona el proceso de cierre TRID/RESPA?',
  '¿Qué es un lien y cuál tiene prioridad en PA?',
  'Explica la diferencia entre agency y sub-agency',
]

const WELCOME =
  '¡Hola! Soy tu consultor de Real Estate para el examen de Pennsylvania. ' +
  'Puedo ayudarte con preguntas sobre legislación federal, ley de PA, contratos, ' +
  'gravámenes, fair housing y mucho más. ¿Qué quieres repasar hoy?'

export default function AIConsultantPage() {
  const [messages, setMessages] = useState<Msg[]>([{ role: 'model', text: WELCOME }])
  const [input, setInput]     = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const endRef  = useRef<HTMLDivElement>(null)
  const taRef   = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function send(text: string) {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    setError(null)
    setInput('')
    const next: Msg[] = [...messages, { role: 'user', text: trimmed }]
    setMessages(next)
    setLoading(true)

    try {
      const res = await fetch('/api/ai-consultant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          history: next
            .filter((m, i) => !(i === 0 && m.role === 'model')) // drop the welcome line
            .map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
        }),
      })

      // A killed or crashed function answers with HTML, not JSON. Parsing that
      // used to throw into the catch below and surface as "Network error",
      // which sent people looking at their wifi instead of the real problem.
      let json: { text?: string; error?: string } | null = null
      try {
        json = await res.json()
      } catch {
        json = null
      }

      if (!res.ok || !json?.text) {
        setError(
          json?.error ??
          (res.status === 504 || res.status === 502
            ? 'The AI took too long to answer. Please try again.'
            : `The AI service returned an unexpected response (${res.status}).`)
        )
        setMessages(messages) // roll back the unanswered question
      } else {
        setMessages([...next, { role: 'model', text: json.text }])
      }
    } catch {
      setError('Could not reach the server. Check your connection and try again.')
      setMessages(messages)
    }

    setLoading(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - var(--top-h) - var(--nav-h) - 24px)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)"
          strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z"/>
          <path d="M19 15l.7 1.8L21.5 17.5l-1.8.7L19 20l-.7-1.8L16.5 17.5l1.8-.7L19 15z"/>
        </svg>
        <div>
          <h1 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>Consultor IA</h1>
          <p style={{ fontSize: '0.75rem', color: 'var(--text3)', margin: 0 }}>
            Respuestas sobre Real Estate Federal y de Pennsylvania
          </p>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, paddingRight: 2 }}>
        {messages.map((m, i) => (
          <div key={i} style={{
            display: 'flex', gap: 8,
            flexDirection: m.role === 'user' ? 'row-reverse' : 'row',
            alignItems: 'flex-start',
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: m.role === 'user' ? 'var(--accent)' : 'var(--surface2)',
              border: '1px solid var(--border)',
            }}>
              {m.role === 'user' ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z"/>
                </svg>
              )}
            </div>
            <div style={{
              maxWidth: '78%',
              background: m.role === 'user' ? 'var(--accent)' : 'var(--surface)',
              color: m.role === 'user' ? '#fff' : 'var(--text)',
              border: m.role === 'user' ? 'none' : '1px solid var(--border)',
              borderRadius: 14, padding: '10px 14px',
              fontSize: '0.88rem', lineHeight: 1.6,
              wordBreak: 'break-word',
            }}>
              {m.role === 'user'
                ? <span style={{ whiteSpace: 'pre-wrap' }}>{m.text}</span>
                : <Markdown text={m.text} />}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'var(--text3)', fontSize: '0.82rem' }}>
            <div style={{ width: 28, height: 28 }} />
            Pensando…
          </div>
        )}
        <div ref={endRef} />
      </div>

      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.1)', border: '1px solid var(--danger)',
          borderRadius: 'var(--radius-xs)', padding: '9px 13px',
          fontSize: '0.8rem', color: 'var(--danger)', margin: '10px 0 0',
        }}>
          {error}
        </div>
      )}

      {/* Suggestions — only before the first question */}
      {messages.length === 1 && (
        <div style={{ marginTop: 12 }}>
          <p style={{ fontSize: '0.72rem', color: 'var(--text3)', marginBottom: 7 }}>Preguntas rápidas:</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                style={{
                  background: 'var(--surface2)', border: '1px solid var(--border)',
                  borderRadius: 999, padding: '6px 12px',
                  fontSize: '0.75rem', color: 'var(--text2)',
                  cursor: 'pointer', textAlign: 'left',
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Composer */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginTop: 12 }}>
        <textarea
          ref={taRef}
          rows={2}
          maxLength={2000}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) }
          }}
          placeholder="Escribe tu pregunta de Real Estate…"
          className="input"
          style={{ flex: 1, resize: 'none', fontFamily: 'inherit', lineHeight: 1.5 }}
        />
        <button
          onClick={() => send(input)}
          disabled={loading || !input.trim()}
          aria-label="Enviar"
          style={{
            width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
            background: 'var(--accent)', border: 'none',
            cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
            opacity: loading || !input.trim() ? 0.5 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
