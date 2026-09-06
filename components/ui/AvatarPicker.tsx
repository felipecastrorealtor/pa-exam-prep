'use client'

import { useRef, useState } from 'react'
import Avatar, { PRESET_IDS, PresetAvatar, type PresetId } from '@/components/ui/Avatar'
import Icon from '@/components/ui/Icon'

const T = {
  change:   { en: 'Change photo',      es: 'Cambiar foto' },
  choose:   { en: 'Choose an avatar',  es: 'Elige un avatar' },
  upload:   { en: 'Upload a photo',    es: 'Subir una foto' },
  remove:   { en: 'Remove',            es: 'Quitar' },
  close:    { en: 'Done',              es: 'Listo' },
  saving:   { en: 'Saving…',           es: 'Guardando…' },
  tooBig:   { en: 'That image is too large. Try one under 8 MB.',
              es: 'Esa imagen es muy grande. Prueba con una de menos de 8 MB.' },
  failed:   { en: 'Could not save the photo. Please try again.',
              es: 'No se pudo guardar la foto. Inténtalo de nuevo.' },
  notReady: { en: 'Avatars are not enabled on this database yet.',
              es: 'Los avatares aún no están habilitados en esta base de datos.' },
}

/** Downscale to a square JPEG small enough to live in a text column. */
async function toSquareDataUrl(file: File, edge = 256): Promise<string> {
  const bitmap = await createImageBitmap(file)
  const side   = Math.min(bitmap.width, bitmap.height)
  const sx     = (bitmap.width  - side) / 2
  const sy     = (bitmap.height - side) / 2

  const canvas = document.createElement('canvas')
  canvas.width = edge
  canvas.height = edge
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('no canvas')
  ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, edge, edge)
  bitmap.close?.()

  // Step the quality down until it comfortably fits the 200 KB server limit.
  for (const q of [0.82, 0.7, 0.6, 0.5]) {
    const url = canvas.toDataURL('image/jpeg', q)
    if (url.length < 180_000) return url
  }
  return canvas.toDataURL('image/jpeg', 0.4)
}

export default function AvatarPicker({
  initial,
  fallback,
  lang,
}: {
  initial: string | null
  fallback: string
  lang: 'en' | 'es'
}) {
  const isEs = lang === 'es'
  const t = (k: keyof typeof T) => (isEs ? T[k].es : T[k].en)

  const [value, setValue]   = useState<string | null>(initial)
  const [open, setOpen]     = useState(false)
  const [busy, setBusy]     = useState(false)
  const [error, setError]   = useState<string | null>(null)
  const fileRef             = useRef<HTMLInputElement>(null)

  async function save(next: string | null) {
    const previous = value
    // Optimistic: the grid should feel instant.
    setValue(next)
    setBusy(true)
    setError(null)
    try {
      const res  = await fetch('/api/profile/avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar: next }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setValue(previous)
        setError(json?.error === 'column_missing' ? t('notReady') : t('failed'))
      }
    } catch {
      setValue(previous)
      setError(t('failed'))
    }
    setBusy(false)
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (file.size > 8 * 1024 * 1024) { setError(t('tooBig')); return }
    setBusy(true)
    setError(null)
    try {
      const url = await toSquareDataUrl(file)
      await save(url)
    } catch {
      setError(t('failed'))
      setBusy(false)
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={t('change')}
        style={{
          position: 'relative', padding: 0, border: 'none', background: 'none',
          cursor: 'pointer', borderRadius: '50%', lineHeight: 0,
        }}
        className="avatar-btn"
      >
        <Avatar value={value} fallback={fallback} size={64} />
        <span className="avatar-edit">
          <Icon name="gear" size={13} />
        </span>
      </button>

      <div style={{ flex: 1, minWidth: 180 }}>
        <button type="button" onClick={() => setOpen((o) => !o)} className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
          {busy ? t('saving') : t('change')}
        </button>
        {error && (
          <div style={{ color: 'var(--danger, #f87171)', fontSize: '0.75rem', marginTop: 6 }}>{error}</div>
        )}
      </div>

      {open && (
        <div className="avatar-panel">
          <div className="avatar-panel-title">{t('choose')}</div>

          <div className="avatar-grid">
            {PRESET_IDS.map((id: PresetId) => {
              const key = `preset:${id}`
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => save(key)}
                  className={`avatar-opt${value === key ? ' is-active' : ''}`}
                  aria-label={id}
                >
                  <PresetAvatar id={id} size={44} />
                </button>
              )
            })}
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            <button type="button" onClick={() => fileRef.current?.click()} className="btn btn-ghost" style={{ flex: 1, minWidth: 140, fontSize: '0.8rem' }}>
              <Icon name="user" size={15} style={{ marginRight: 6, verticalAlign: '-3px' }} />
              {t('upload')}
            </button>
            {value && (
              <button type="button" onClick={() => save(null)} className="btn btn-ghost" style={{ fontSize: '0.8rem' }}>
                {t('remove')}
              </button>
            )}
            <button type="button" onClick={() => setOpen(false)} className="btn btn-primary" style={{ fontSize: '0.8rem' }}>
              {t('close')}
            </button>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={onFile}
            style={{ display: 'none' }}
          />
        </div>
      )}
    </div>
  )
}
