'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { track } from '@/lib/analytics'

export interface GlossaryCard {
  id: string
  termEn: string
  termEs: string | null
  definitionEn: string
  definitionEs: string | null
  unitIds: number[]
  /** SRS state */
  interval: number
  reps: number
  due: string | null
}

interface Props {
  cards: GlossaryCard[]
  initialLang: 'en' | 'es'
}

type Rating = 'hard' | 'good' | 'easy'

const T = {
  dueToday:  { en: 'Due today',   es: 'Para hoy' },
  seen:      { en: 'Seen',        es: 'Vistas' },
  mastered:  { en: 'Mastered',    es: 'Dominadas' },
  tapToSee:  { en: 'Tap to see the definition', es: 'Toca para ver la definición' },
  spaceFlip: { en: 'Space to flip',             es: 'Espacio para voltear' },
  howWell:   { en: 'How well did you know it?', es: '¿Qué tan bien la conocías?' },
  hard:      { en: 'Hard',        es: 'Difícil' },
  good:      { en: 'Good',        es: 'Bien' },
  easy:      { en: 'Easy',        es: 'Fácil' },
  term:      { en: 'Term',        es: 'Término' },
  definition:{ en: 'Definition',  es: 'Definición' },
  doneTitle: { en: 'Session complete!', es: '¡Sesión completada!' },
  doneSub:   { en: 'Come back tomorrow for the cards due then.',
               es: 'Vuelve mañana para las tarjetas programadas.' },
  reviewed:  { en: 'reviewed',    es: 'repasadas' },
  again:     { en: 'Study all again', es: 'Estudiar todas de nuevo' },
  toGlossary:{ en: 'Open glossary', es: 'Abrir glosario' },
  emptyTitle:{ en: 'No terms available', es: 'No hay términos disponibles' },
  day:       { en: 'd',           es: 'd' },
}

/** A term counts as mastered once it is scheduled more than two weeks out. */
const MASTERED_INTERVAL = 16

function isDue(c: GlossaryCard): boolean {
  if (!c.due) return true
  return new Date(c.due) <= new Date()
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function FlashcardSession({ cards, initialLang }: Props) {
  const [lang, setLang]       = useState<'en' | 'es'>(initialLang)
  const [flipped, setFlipped] = useState(false)
  const [idx, setIdx]         = useState(0)
  const [done, setDone]       = useState(false)
  const [reviewed, setReviewed] = useState(0)
  const [studyAll, setStudyAll] = useState(false)
  const [localState, setLocalState] =
    useState<Record<string, { interval: number; reps: number }>>({})

  // One start event per deck, Strict Mode included.
  const deckTracked = useRef(false)
  useEffect(() => {
    if (deckTracked.current) return
    deckTracked.current = true
    track('flashcard_session_started', { deck: 'glossary' })
  }, [])

  const t = (k: keyof typeof T) => T[k][lang]
  const isEs = lang === 'es'

  const deck = useMemo(() => {
    const due = cards.filter(isDue)
    const source = studyAll || due.length === 0 ? cards : due
    return shuffle(source)
  }, [cards, studyAll])

  const card = deck[idx]

  // ── Header counters, updated optimistically as the session runs ──
  const stats = useMemo(() => {
    let seen = 0, mastered = 0
    for (const c of cards) {
      const local = localState[c.id]
      const reps = local?.reps ?? c.reps
      const interval = local?.interval ?? c.interval
      if (reps > 0 || interval > 0) seen++
      if (interval >= MASTERED_INTERVAL) mastered++
    }
    return { due: Math.max(0, deck.length - idx), seen, mastered }
  }, [cards, localState, deck.length, idx])

  const rate = useCallback(async (rating: Rating) => {
    if (!card) return

    // Mirror the server's schedule locally so the counters move immediately.
    setLocalState((s) => {
      const prevInt = s[card.id]?.interval ?? card.interval
      const prevRep = s[card.id]?.reps ?? card.reps
      const next = rating === 'hard'
        ? { interval: 1, reps: 0 }
        : {
            interval: prevRep === 0 ? (rating === 'easy' ? 3 : 1)
                    : prevRep === 1 ? (rating === 'easy' ? 7 : 4)
                    : Math.min(180, Math.max(1, Math.round(prevInt * 2.5) || 4)),
            reps: prevRep + 1,
          }
      return { ...s, [card.id]: next }
    })

    fetch('/api/flashcard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ termId: card.id, rating }),
    }).catch(() => { /* scheduling is best-effort; never block the deck */ })

    setReviewed((n) => n + 1)

    if (idx + 1 >= deck.length) {
      track('flashcard_session_completed', {
        deck: 'glossary',
        cards_reviewed: reviewed + 1,
        duration_seconds: null,
      })
      setDone(true)
    }
    else { setIdx(idx + 1); setFlipped(false) }
  }, [card, idx, deck.length, reviewed])

  // Keyboard: space/enter flips, 1-3 rate
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (done) return
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setFlipped((f) => !f); return }
      if (!flipped) return
      if (e.key === '1') rate('hard')
      if (e.key === '2') rate('good')
      if (e.key === '3') rate('easy')
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [done, flipped, rate])

  function restart() {
    setStudyAll(true); setIdx(0); setFlipped(false); setDone(false); setReviewed(0)
  }

  // ── Empty ──
  if (cards.length === 0) {
    return (
      <div className="card">
        <div className="empty-state">
          <div className="empty-icon">📇</div>
          <div className="empty-msg">{t('emptyTitle')}</div>
        </div>
      </div>
    )
  }

  const LangToggle = (
    <div style={{
      display: 'inline-flex', padding: 3, gap: 2, flexShrink: 0,
      background: 'var(--surface2)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-sm)',
    }}>
      {(['en', 'es'] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          style={{
            border: 'none', cursor: 'pointer', padding: '4px 10px',
            borderRadius: 'var(--radius-xs)', fontSize: '0.7rem',
            fontWeight: 800, letterSpacing: '0.04em',
            background: lang === l ? 'var(--accent)' : 'transparent',
            color: lang === l ? '#fff' : 'var(--text3)',
          }}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  )

  // ── Done ──
  if (done || !card) {
    return (
      <div>
        <div className="card" style={{ textAlign: 'center', padding: '32px 20px' }}>
          <div style={{ fontSize: '2.6rem', marginBottom: 10 }}>🎉</div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text)', margin: '0 0 6px' }}>
            {t('doneTitle')}
          </h2>
          <p style={{ fontSize: '0.86rem', color: 'var(--text2)', margin: '0 0 4px' }}>
            {reviewed} {isEs ? 'tarjetas' : 'cards'} {t('reviewed')}
          </p>
          <p style={{ fontSize: '0.8rem', color: 'var(--text3)', margin: 0 }}>
            {t('doneSub')}
          </p>
        </div>

        <div className="stat-row">
          <div className="stat-pill">
            <div className="stat-num" style={{ color: 'var(--accent)' }}>{stats.seen}</div>
            <div className="stat-label">{t('seen')}</div>
          </div>
          <div className="stat-pill">
            <div className="stat-num" style={{ color: 'var(--success)' }}>{stats.mastered}</div>
            <div className="stat-label">{t('mastered')}</div>
          </div>
          <div className="stat-pill">
            <div className="stat-num" style={{ color: 'var(--warning)' }}>{cards.length}</div>
            <div className="stat-label">{isEs ? 'Términos' : 'Terms'}</div>
          </div>
        </div>

        <button onClick={restart} className="btn btn-primary btn-full" style={{ marginBottom: 8 }}>
          🔁 {t('again')}
        </button>
        <a href="/glossary" className="btn btn-ghost btn-full">{t('toGlossary')}</a>
      </div>
    )
  }

  const term = isEs && card.termEs ? card.termEs : card.termEn
  const other = isEs ? card.termEn : card.termEs
  const def  = isEs
    ? (card.definitionEs || card.definitionEn)
    : (card.definitionEn || card.definitionEs || '')

  const progress = (idx / deck.length) * 100
  const interval = localState[card.id]?.interval ?? card.interval

  return (
    <div>
      {/* ── Stats ── */}
      <div className="stat-row">
        <div className="stat-pill">
          <div className="stat-num" style={{ color: 'var(--accent)' }}>{stats.due}</div>
          <div className="stat-label">{t('dueToday')}</div>
        </div>
        <div className="stat-pill">
          <div className="stat-num" style={{ color: 'var(--text)' }}>{stats.seen}</div>
          <div className="stat-label">{t('seen')}</div>
        </div>
        <div className="stat-pill">
          <div className="stat-num" style={{ color: 'var(--success)' }}>{stats.mastered}</div>
          <div className="stat-label">{t('mastered')}</div>
        </div>
      </div>

      {/* ── Progress + language ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <div style={{ flex: 1 }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            fontSize: '0.7rem', color: 'var(--text3)', marginBottom: 5,
          }}>
            <span>{isEs ? 'Tarjetas' : 'Flashcards'}</span>
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>{idx + 1} / {deck.length}</span>
          </div>
          <div className="prog-bar">
            <div className="prog-fill" style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg,var(--accent),var(--accent2))',
            }}/>
          </div>
        </div>
        {LangToggle}
      </div>

      {/* ── Card ── */}
      <div style={{ position: 'relative', marginBottom: 18 }}>
        {/* Deck stack behind the top card */}
        <div aria-hidden style={{
          position: 'absolute', inset: '10px 14px -8px 14px',
          background: 'var(--surface2)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', opacity: 0.5, zIndex: 0,
        }}/>
        <div aria-hidden style={{
          position: 'absolute', inset: '5px 7px -4px 7px',
          background: 'var(--surface2)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', opacity: 0.75, zIndex: 0,
        }}/>

        <div
          onClick={() => setFlipped((f) => !f)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setFlipped((f) => !f) } }}
          style={{ perspective: 1400, cursor: 'pointer', position: 'relative', zIndex: 1 }}
        >
          <div style={{
            display: 'grid',
            minHeight: 260,
            transformStyle: 'preserve-3d',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            transition: 'transform 0.55s cubic-bezier(.4,.2,.2,1)',
          }}>
            {/* Front — the term */}
            <div style={{
              gridArea: '1 / 1', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
              background: 'linear-gradient(150deg, var(--surface) 0%, var(--surface2) 100%)',
              border: '1px solid var(--border)', borderRadius: 'var(--radius)',
              boxShadow: 'var(--card-shadow)',
              padding: '26px 22px',
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                fontSize: '0.66rem', fontWeight: 800, letterSpacing: '0.09em',
                textTransform: 'uppercase', color: 'var(--text3)',
              }}>
                <span>{t('term')}</span>
                {interval > 0 && (
                  <span style={{ color: 'var(--accent)' }}>
                    {interval}{t('day')}
                  </span>
                )}
              </div>

              <div style={{ textAlign: 'center', padding: '18px 0' }}>
                <div style={{
                  fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)',
                  lineHeight: 1.25, letterSpacing: '-0.01em',
                }}>
                  {term}
                </div>
                {other && (
                  <div style={{ fontSize: '0.92rem', color: 'var(--accent)', marginTop: 7, fontWeight: 600 }}>
                    {other}
                  </div>
                )}
              </div>

              <div style={{ textAlign: 'center', fontSize: '0.74rem', color: 'var(--text3)' }}>
                {t('tapToSee')}
              </div>
            </div>

            {/* Back — the definition */}
            <div style={{
              gridArea: '1 / 1', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              background: 'linear-gradient(150deg, rgba(79,142,247,0.13) 0%, var(--surface) 65%)',
              border: '1px solid rgba(79,142,247,0.35)', borderRadius: 'var(--radius)',
              boxShadow: 'var(--card-shadow)',
              padding: '26px 22px',
              display: 'flex', flexDirection: 'column', gap: 14,
            }}>
              <div style={{
                fontSize: '0.66rem', fontWeight: 800, letterSpacing: '0.09em',
                textTransform: 'uppercase', color: 'var(--accent)',
              }}>
                {t('definition')}
              </div>

              <div style={{
                fontSize: '0.95rem', fontWeight: 700, color: 'var(--text)', lineHeight: 1.3,
              }}>
                {term}
              </div>

              <p style={{
                fontSize: '0.92rem', lineHeight: 1.65, color: 'var(--text2)',
                margin: 0, overflowWrap: 'anywhere',
              }}>
                {def}
              </p>

              {card.unitIds.length > 0 && (
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 'auto' }}>
                  {card.unitIds.slice(0, 6).map((u) => (
                    <span key={u} style={{
                      fontSize: '0.6rem', fontWeight: 800, padding: '2px 7px', borderRadius: 99,
                      background: 'var(--surface2)', border: '1px solid var(--border)',
                      color: 'var(--text3)',
                    }}>U{u}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Rating ── */}
      {flipped ? (
        <div>
          <div style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--text3)', marginBottom: 9 }}>
            {t('howWell')}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
            {([
              { r: 'hard', label: t('hard'), color: 'var(--danger)',  rgb: '239,68,68',  key: '1' },
              { r: 'good', label: t('good'), color: 'var(--warning)', rgb: '245,158,11', key: '2' },
              { r: 'easy', label: t('easy'), color: 'var(--success)', rgb: '34,197,94',  key: '3' },
            ] as const).map(({ r, label, color, rgb, key }) => (
              <button
                key={r}
                onClick={() => rate(r)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                  padding: '12px 6px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                  background: `rgba(${rgb},0.1)`,
                  border: `1px solid rgba(${rgb},0.4)`,
                  color, fontWeight: 800, fontSize: '0.85rem',
                  fontFamily: 'inherit', transition: 'all 0.15s',
                }}
              >
                {label}
                <span style={{ fontSize: '0.6rem', opacity: 0.7, fontWeight: 600 }}>{key}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <p style={{ textAlign: 'center', fontSize: '0.74rem', color: 'var(--text3)', margin: 0 }}>
          {t('spaceFlip')}
        </p>
      )}
    </div>
  )
}
