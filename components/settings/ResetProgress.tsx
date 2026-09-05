'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const T = {
  title:   { en: 'Danger Zone',      es: 'Zona de Riesgo' },
  blurb:   {
    en: 'Erases every answer, your study sessions, flashcard scheduling, XP, streak and unlocked achievements. The question bank itself is untouched — you simply start over. This cannot be undone.',
    es: 'Borra todas tus respuestas, tus sesiones de estudio, la programación de tarjetas, el XP, la racha y los logros desbloqueados. El banco de preguntas no se toca — simplemente vuelves a empezar. Esta acción no se puede deshacer.',
  },
  button:  { en: 'Reset my progress',   es: 'Reiniciar mi progreso' },
  confirm: { en: 'Are you sure?',       es: '¿Estás seguro?' },
  typeIt:  {
    en: 'Type RESET below to confirm.',
    es: 'Escribe RESET abajo para confirmar.',
  },
  cancel:  { en: 'Cancel',              es: 'Cancelar' },
  doIt:    { en: 'Erase everything',    es: 'Borrar todo' },
  working: { en: 'Erasing…',            es: 'Borrando…' },
  done:    { en: 'Progress reset. Starting fresh.', es: 'Progreso reiniciado. Empezando de cero.' },
  failed:  {
    en: 'Could not reset your progress. Please try again.',
    es: 'No se pudo reiniciar tu progreso. Inténtalo de nuevo.',
  },
}

export default function ResetProgress({ lang }: { lang: 'en' | 'es' }) {
  const router = useRouter()
  const t = (k: keyof typeof T) => T[k][lang]

  const [open, setOpen]       = useState(false)
  const [typed, setTyped]     = useState('')
  const [busy, setBusy]       = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [done, setDone]       = useState(false)

  async function handleReset() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/reset-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: 'RESET' }),
      })
      if (!res.ok) {
        setError(t('failed'))
        setBusy(false)
        return
      }
      setDone(true)
      setOpen(false)
      setTyped('')
      router.refresh()
    } catch {
      setError(t('failed'))
    }
    setBusy(false)
  }

  return (
    <div className="card" style={{ borderColor: 'rgba(239,68,68,0.3)' }}>
      <div className="card-title" style={{ color: 'var(--danger)' }}>{t('title')}</div>

      <p style={{ fontSize: '0.8rem', color: 'var(--text3)', lineHeight: 1.6, marginBottom: 14 }}>
        {t('blurb')}
      </p>

      {done && (
        <div style={{
          background: 'rgba(34,197,94,0.1)', border: '1px solid var(--success)',
          borderRadius: 'var(--radius-xs)', padding: '9px 13px',
          fontSize: '0.8rem', color: 'var(--success)', marginBottom: 12,
        }}>
          {t('done')}
        </div>
      )}

      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.1)', border: '1px solid var(--danger)',
          borderRadius: 'var(--radius-xs)', padding: '9px 13px',
          fontSize: '0.8rem', color: 'var(--danger)', marginBottom: 12,
        }}>
          {error}
        </div>
      )}

      {!open ? (
        <button
          onClick={() => { setOpen(true); setDone(false); setError(null) }}
          className="btn btn-ghost btn-full"
          style={{ color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.4)' }}
        >
          🗑 {t('button')}
        </button>
      ) : (
        <div style={{
          border: '1px solid rgba(239,68,68,0.35)', borderRadius: 'var(--radius-sm)',
          padding: 14, background: 'rgba(239,68,68,0.05)',
        }}>
          <p style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--danger)', margin: '0 0 4px' }}>
            {t('confirm')}
          </p>
          <p style={{ fontSize: '0.78rem', color: 'var(--text2)', margin: '0 0 10px' }}>
            {t('typeIt')}
          </p>
          <input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder="RESET"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            className="input"
            style={{ marginBottom: 10, fontSize: 16, letterSpacing: '0.1em', fontWeight: 700 }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => { setOpen(false); setTyped(''); setError(null) }}
              disabled={busy}
              className="btn btn-ghost"
              style={{ flex: 1 }}
            >
              {t('cancel')}
            </button>
            <button
              onClick={handleReset}
              disabled={busy || typed.trim().toUpperCase() !== 'RESET'}
              className="btn btn-danger"
              style={{
                flex: 1,
                opacity: busy || typed.trim().toUpperCase() !== 'RESET' ? 0.45 : 1,
                cursor: typed.trim().toUpperCase() !== 'RESET' ? 'not-allowed' : 'pointer',
              }}
            >
              {busy ? t('working') : t('doIt')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
