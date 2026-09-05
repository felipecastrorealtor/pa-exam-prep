'use client'

import { useState, useEffect, useCallback } from 'react'
import clsx from 'clsx'

// ── Types ────────────────────────────────────────────────────────────────────

interface Flashcard {
  id: string
  legacyId: number
  unitId: number
  questionEn: string
  optionAEn: string
  optionBEn: string
  optionCEn: string
  optionDEn: string
  correct: 'A' | 'B' | 'C' | 'D'
  explanationEn: string
  pageRef: number | null
  questionEs: string | null
  optionAEs: string | null
  optionBEs: string | null
  optionCEs: string | null
  optionDEs: string | null
  explanationEs: string | null
  box: number     // Leitner box 1–5
  nextReview: string | null
}

interface Props {
  questions: Flashcard[]
  initialLang: 'en' | 'es'
}

// ── SRS helpers ───────────────────────────────────────────────────────────────
// Box intervals (days): 1→1, 2→3, 3→7, 4→14, 5→30
const BOX_INTERVALS = [0, 1, 3, 7, 14, 30]

function isDue(card: Flashcard): boolean {
  if (!card.nextReview) return true
  return new Date(card.nextReview) <= new Date()
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function FlashcardSession({ questions, initialLang }: Props) {
  const [lang, setLang] = useState<'en' | 'es'>(initialLang)
  const [flipped, setFlipped] = useState(false)
  const [cards, setCards] = useState<Flashcard[]>(() =>
    questions.filter(isDue).length > 0
      ? questions.filter(isDue)
      : questions // if nothing due, show all
  )
  const [idx, setIdx] = useState(0)
  const [sessionCorrect, setSessionCorrect] = useState(0)
  const [sessionTotal, setSessionTotal] = useState(0)
  const [done, setDone] = useState(false)

  const card = cards[idx]

  function front(c: Flashcard) {
    return lang === 'es' && c.questionEs ? c.questionEs : c.questionEn
  }

  function back(c: Flashcard) {
    const letterMap = { A: { en: c.optionAEn, es: c.optionAEs }, B: { en: c.optionBEn, es: c.optionBEs }, C: { en: c.optionCEn, es: c.optionCEs }, D: { en: c.optionDEn, es: c.optionDEs } }
    const chosen = letterMap[c.correct]
    const answer = lang === 'es' && chosen.es ? chosen.es : chosen.en
    const exp = lang === 'es' && c.explanationEs ? c.explanationEs : c.explanationEn
    return { letter: c.correct, answer, exp }
  }

  const advance = useCallback(async (knew: boolean) => {
    if (!card) return
    const prevBox = card.box
    const newBox  = knew ? Math.min(5, prevBox + 1) : 1
    const interval = BOX_INTERVALS[newBox]
    const nextReview = new Date()
    nextReview.setDate(nextReview.getDate() + interval)

    // Persist to Supabase
    try {
      await fetch('/api/flashcard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: card.id,
          knew,
          newBox,
          nextReview: nextReview.toISOString(),
        }),
      })
    } catch { /* non-critical */ }

    setSessionTotal((t) => t + 1)
    if (knew) setSessionCorrect((c) => c + 1)

    const nextIdx = idx + 1
    if (nextIdx >= cards.length) {
      setDone(true)
    } else {
      setIdx(nextIdx)
      setFlipped(false)
    }
  }, [card, idx, cards.length])

  // Keyboard: space = flip, y/1 = knew, n/2 = didn't know
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (done) return
      if (e.key === ' ' || e.key === 'f') { e.preventDefault(); setFlipped((f) => !f) }
      if (flipped) {
        if (e.key === 'y' || e.key === '1') advance(true)
        if (e.key === 'n' || e.key === '2') advance(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [done, flipped, advance])

  // ── Done ─────────────────────────────────────────────────────────────────
  if (done || !card) {
    const pct = sessionTotal > 0 ? Math.round((sessionCorrect / sessionTotal) * 100) : 0
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
        <div className="card max-w-sm w-full p-8 text-center space-y-6">
          <div className="text-5xl">{pct >= 80 ? '🎴' : '📚'}</div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {lang === 'es' ? '¡Ronda completa!' : 'Round complete!'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {lang === 'es' ? `${sessionCorrect} de ${sessionTotal} recordadas` : `${sessionCorrect} of ${sessionTotal} cards known`}
            </p>
          </div>
          <div className="flex justify-center gap-8">
            <div className="text-center">
              <p className="text-3xl font-bold text-emerald-500">{sessionCorrect}</p>
              <p className="text-xs text-gray-500">{lang === 'es' ? 'Sabía' : 'Knew'}</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-red-400">{sessionTotal - sessionCorrect}</p>
              <p className="text-xs text-gray-500">{lang === 'es' ? 'Repasar' : 'Review'}</p>
            </div>
          </div>
          <div className="space-y-3">
            <button
              onClick={() => { setIdx(0); setFlipped(false); setDone(false); setSessionCorrect(0); setSessionTotal(0) }}
              className="btn-primary w-full"
            >
              {lang === 'es' ? 'Otra ronda' : 'Another round'}
            </button>
            <a href="/study" className="btn-ghost w-full block text-center">
              {lang === 'es' ? 'Ir a estudio' : 'Go to study'}
            </a>
          </div>
        </div>
      </div>
    )
  }

  const { letter, answer, exp } = back(card)
  const progress = ((idx) / cards.length) * 100

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">

      {/* Header */}
      <header className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <a href="/study" className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </a>
          <div className="flex-1">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>{lang === 'es' ? 'Tarjetas' : 'Flashcards'}</span>
              <span className="font-mono">{idx + 1}/{cards.length}</span>
            </div>
            <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-violet-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <button
            onClick={() => setLang((l) => l === 'en' ? 'es' : 'en')}
            className="text-xs font-bold px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
          >
            {lang === 'en' ? 'ES' : 'EN'}
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-xl space-y-4">

          {/* Box indicator */}
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span className="font-mono">#{card.legacyId}</span>
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map((b) => (
                <div key={b} className={clsx(
                  'w-2 h-2 rounded-full',
                  b <= card.box ? 'bg-violet-500' : 'bg-gray-200 dark:bg-gray-700'
                )} />
              ))}
              <span className="ml-1">Box {card.box}</span>
            </div>
          </div>

          {/* Flip card */}
          <div
            onClick={() => setFlipped((f) => !f)}
            className="cursor-pointer"
            style={{ perspective: '1200px' }}
          >
            <div
              className="w-full transition-transform duration-500"
              style={{
                transformStyle: 'preserve-3d',
                transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                minHeight: '280px',
                // Both faces share one grid cell, so the card grows to fit the
                // taller of the two. Absolutely-positioned faces never do, which
                // is what let long explanations spill past the border.
                display: 'grid',
              }}
            >
              {/* Front */}
              <div
                className="card p-6 flex flex-col justify-between gap-3"
                style={{ gridArea: '1 / 1', backfaceVisibility: 'hidden' }}
              >
                <div className="flex justify-between items-start text-xs text-gray-400">
                  <span>{lang === 'es' ? 'Pregunta' : 'Question'}</span>
                  <span>{lang === 'es' ? 'Toca para voltear' : 'Tap to flip'} ↕</span>
                </div>
                <p className="text-gray-900 dark:text-white text-base leading-relaxed font-medium text-center my-4">
                  {front(card)}
                </p>
                <div className="text-center text-xs text-gray-400">
                  {lang === 'es' ? 'Espacio para voltear' : 'Space to flip'}
                </div>
              </div>

              {/* Back */}
              <div
                className="card p-6 flex flex-col gap-3 bg-violet-50 dark:bg-violet-900/10 border-violet-200 dark:border-violet-800"
                style={{ gridArea: '1 / 1', backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
              >
                <div className="text-xs text-violet-500 font-semibold">
                  {lang === 'es' ? 'Respuesta' : 'Answer'} · {letter}
                </div>
                <p className="text-gray-900 dark:text-white font-semibold leading-snug break-words">
                  {answer}
                </p>
                {exp && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed border-t border-violet-100 dark:border-violet-900/50 pt-3 break-words">
                    {exp}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Rating buttons — only when flipped */}
          {flipped && (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => advance(false)}
                className="flex flex-col items-center gap-1 p-4 rounded-xl border-2 border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
              >
                <span className="text-2xl">✗</span>
                <span className="text-sm font-semibold">
                  {lang === 'es' ? 'No sabía' : "Didn't know"}
                </span>
                <span className="text-xs opacity-70">Box 1 · 2</span>
              </button>
              <button
                onClick={() => advance(true)}
                className="flex flex-col items-center gap-1 p-4 rounded-xl border-2 border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
              >
                <span className="text-2xl">✓</span>
                <span className="text-sm font-semibold">
                  {lang === 'es' ? 'Lo sabía' : 'Knew it'}
                </span>
                <span className="text-xs opacity-70">
                  Box {Math.min(5, card.box + 1)} · {BOX_INTERVALS[Math.min(5, card.box + 1)]}d
                </span>
              </button>
            </div>
          )}

          {!flipped && (
            <p className="text-center text-xs text-gray-400">
              {lang === 'es' ? 'Y/1 = Sabía · N/2 = No sabía' : 'Y/1 = Knew · N/2 = Didn\'t know'}
            </p>
          )}
        </div>
      </main>
    </div>
  )
}
