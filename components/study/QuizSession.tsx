'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import clsx from 'clsx'

// ── Types ────────────────────────────────────────────────────────────────────

export interface SerializedQuestion {
  id: string
  legacyId: number
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
  mastery: number
  attempts: number
}

interface Props {
  unitId: number
  unitTitleEn: string
  unitTitleEs: string | null
  questions: SerializedQuestion[]
  initialLang: 'en' | 'es'
  mode: 'quiz' | 'review' | 'exam'
}

type AnswerLetter = 'A' | 'B' | 'C' | 'D'
const LETTERS: AnswerLetter[] = ['A', 'B', 'C', 'D']

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(sec: number) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function MasteryDots({ level }: { level: number }) {
  return (
    <div className="flex gap-1" aria-label={`Mastery level ${level} of 3`}>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className={clsx(
            'w-2 h-2 rounded-full transition-colors',
            i <= level
              ? 'bg-emerald-500'
              : 'bg-gray-200 dark:bg-gray-700'
          )}
        />
      ))}
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────────

export default function QuizSession({
  unitId,
  unitTitleEn,
  unitTitleEs,
  questions: rawQuestions,
  initialLang,
  mode,
}: Props) {
  const router = useRouter()
  const sessionStart = useRef(Date.now())
  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null)

  // Sort review mode: unseen / wrong first, mastered last
  const [questions] = useState<SerializedQuestion[]>(() =>
    mode === 'review'
      ? [...rawQuestions].sort((a, b) => a.mastery - b.mastery)
      : rawQuestions
  )

  const [lang, setLang]         = useState<'en' | 'es'>(initialLang)
  const [idx, setIdx]           = useState(0)
  const [selected, setSelected] = useState<AnswerLetter | null>(null)
  const [revealed, setRevealed] = useState(false)   // feedback shown?
  const [elapsed, setElapsed]   = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone]         = useState(false)

  // Session counters
  const [answered, setAnswered]         = useState(0)
  const [correct, setCorrect]           = useState(0)
  const [sessionXP, setSessionXP]       = useState(0)
  const [achievements, setAchievements] = useState<string[]>([])
  const [xpToast, setXpToast]           = useState<{ xp: number; k: number } | null>(null)

  // Per-question mastery (local mirror so UI updates instantly)
  const [masteryMap, setMasteryMap] = useState<Record<string, number>>(() => {
    const m: Record<string, number> = {}
    for (const q of rawQuestions) m[q.id] = q.mastery
    return m
  })

  // Exam mode: collect all answers, submit at the end
  const [examAnswers, setExamAnswers] = useState<Record<string, AnswerLetter>>({})
  const [examResults, setExamResults] = useState<Record<string, boolean>>({}) // questionId → correct

  // ── Timer ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    timerRef.current = setInterval(
      () => setElapsed(Math.floor((Date.now() - sessionStart.current) / 1000)),
      1000
    )
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
  }, [])

  // ── Derived ────────────────────────────────────────────────────────────────
  const q        = questions[idx]
  const progress = ((idx + (revealed ? 1 : 0)) / questions.length) * 100
  const unitTitle = lang === 'es' ? (unitTitleEs || unitTitleEn) : unitTitleEn

  function qText(q: SerializedQuestion) {
    return lang === 'es' && q.questionEs ? q.questionEs : q.questionEn
  }
  function optText(q: SerializedQuestion, l: AnswerLetter) {
    if (lang === 'es') {
      const map = { A: q.optionAEs, B: q.optionBEs, C: q.optionCEs, D: q.optionDEs }
      if (map[l]) return map[l]!
    }
    const map = { A: q.optionAEn, B: q.optionBEn, C: q.optionCEn, D: q.optionDEn }
    return map[l]
  }
  function expText(q: SerializedQuestion) {
    return lang === 'es' && q.explanationEs ? q.explanationEs : q.explanationEn
  }

  // ── Submit a single answer ────────────────────────────────────────────────
  const submitAnswer = useCallback(async (
    question: SerializedQuestion,
    letter: AnswerLetter
  ) => {
    const isCorrect = letter === question.correct
    setSubmitting(true)
    try {
      const res = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: question.id,
          unitId,
          correct: isCorrect,
          answer: letter,
          lang,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        if (typeof data.newMastery === 'number') {
          setMasteryMap((prev) => ({ ...prev, [question.id]: data.newMastery }))
        }
        if (typeof data.xp === 'number' && data.xp > 0) {
          setSessionXP((prev) => prev + data.xp)
          setXpToast({ xp: data.xp, k: Date.now() })
          setTimeout(() => setXpToast(null), 2000)
        }
        if (Array.isArray(data.newAchievements) && data.newAchievements.length > 0) {
          setAchievements((prev) => [...prev, ...data.newAchievements])
        }
      }
    } catch {
      // non-critical — continue
    } finally {
      setSubmitting(false)
    }
    return isCorrect
  }, [unitId, lang])

  // ── Submit the whole session record ───────────────────────────────────────
  const submitSession = useCallback(async (
    finalAnswered: number,
    finalCorrect: number,
  ) => {
    const durationSec = Math.floor((Date.now() - sessionStart.current) / 1000)
    try {
      await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unitId,
          sessionType: mode,
          questionsAnswered: finalAnswered,
          correct: finalCorrect,
          durationSec,
          lang,
        }),
      })
    } catch { /* non-critical */ }
  }, [unitId, mode, lang])

  // ── Answer handler (quiz / review) ────────────────────────────────────────
  const handleAnswer = useCallback(async (letter: AnswerLetter) => {
    if (revealed || submitting) return

    setSelected(letter)

    if (mode === 'exam') {
      // Exam: record locally, no feedback, auto-advance
      setExamAnswers((prev) => ({ ...prev, [q.id]: letter }))
      // brief highlight then advance
      setTimeout(() => {
        setIdx((prev) => {
          const next = prev + 1
          if (next >= questions.length) {
            // All questions answered — calculate results
            setDone(true)
            stopTimer()
          }
          return Math.min(next, questions.length - 1)
        })
        setSelected(null)
      }, 350)
      return
    }

    // Quiz / review: show feedback immediately
    setRevealed(true)
    const isCorrect = await submitAnswer(q, letter)
    setAnswered((prev) => prev + 1)
    if (isCorrect) setCorrect((prev) => prev + 1)
  }, [revealed, submitting, mode, q, questions.length, stopTimer, submitAnswer])

  // ── Advance to next / finish ───────────────────────────────────────────────
  const handleNext = useCallback(async () => {
    const nextIdx = idx + 1

    if (nextIdx >= questions.length) {
      stopTimer()

      if (mode === 'exam') {
        // Submit all exam answers
        let finalCorrect = 0
        const results: Record<string, boolean> = {}
        const submissions = Object.entries(examAnswers).map(async ([qId, letter]) => {
          const question = questions.find((x) => x.id === qId)
          if (!question) return
          const isCorrect = letter === question.correct
          results[qId] = isCorrect
          if (isCorrect) finalCorrect++
          await submitAnswer(question, letter)
        })
        await Promise.allSettled(submissions)
        setExamResults(results)
        const finalAnswered = Object.keys(examAnswers).length
        setAnswered(finalAnswered)
        setCorrect(finalCorrect)
        await submitSession(finalAnswered, finalCorrect)
      } else {
        await submitSession(answered + (revealed ? 0 : 0), correct)
      }

      setDone(true)
    } else {
      setIdx(nextIdx)
      setSelected(null)
      setRevealed(false)
    }
  }, [idx, questions, mode, examAnswers, answered, correct, revealed, stopTimer, submitAnswer, submitSession])

  // ── Restart ────────────────────────────────────────────────────────────────
  const restart = useCallback(() => {
    sessionStart.current = Date.now()
    setIdx(0)
    setSelected(null)
    setRevealed(false)
    setElapsed(0)
    setDone(false)
    setAnswered(0)
    setCorrect(0)
    setSessionXP(0)
    setAchievements([])
    setExamAnswers({})
    setExamResults({})
    timerRef.current = setInterval(
      () => setElapsed(Math.floor((Date.now() - sessionStart.current) / 1000)),
      1000
    )
  }, [])

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (done) return
      const numMap: Record<string, AnswerLetter> = { '1': 'A', '2': 'B', '3': 'C', '4': 'D' }
      if (!revealed && numMap[e.key]) { handleAnswer(numMap[e.key]); return }
      if (!revealed && e.key.toUpperCase() in { A: 1, B: 1, C: 1, D: 1 }) {
        handleAnswer(e.key.toUpperCase() as AnswerLetter)
        return
      }
      if (revealed && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault()
        handleNext()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [done, revealed, handleAnswer, handleNext])

  // ── DONE SCREEN ────────────────────────────────────────────────────────────
  if (done) {
    const pct    = answered > 0 ? Math.round((correct / answered) * 100) : 0
    const emoji  = pct >= 80 ? '🎉' : pct >= 60 ? '💪' : '📚'
    const durationSec = elapsed

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4">

          {/* Result card */}
          <div className="card p-8 text-center space-y-6">
            <div className="text-5xl">{emoji}</div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {lang === 'es' ? 'Sesión completa' : 'Session complete'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">{unitTitle}</p>
            </div>

            {/* Circular score */}
            <div className="flex justify-center">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.9" fill="none"
                    className="text-gray-200 dark:text-gray-800"
                    stroke="currentColor" strokeWidth="3" />
                  <circle
                    cx="18" cy="18" r="15.9" fill="none"
                    stroke={pct >= 80 ? '#10b981' : pct >= 60 ? '#f59e0b' : '#ef4444'}
                    strokeWidth="3"
                    strokeDasharray={`${pct} ${100 - pct}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">{pct}%</span>
                  <span className="text-xs text-gray-500">
                    {lang === 'es' ? 'correcto' : 'correct'}
                  </span>
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{answered}</p>
                <p className="text-xs text-gray-500">
                  {lang === 'es' ? 'respondidas' : 'answered'}
                </p>
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-500">+{sessionXP}</p>
                <p className="text-xs text-gray-500">XP</p>
              </div>
              <div>
                <p className="text-2xl font-mono font-bold text-gray-900 dark:text-white">
                  {formatTime(durationSec)}
                </p>
                <p className="text-xs text-gray-500">
                  {lang === 'es' ? 'tiempo' : 'time'}
                </p>
              </div>
            </div>

            {/* Achievements unlocked */}
            {achievements.length > 0 && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                <p className="text-sm font-semibold text-amber-700 dark:text-amber-300 mb-2">
                  🏆 {lang === 'es' ? 'Logros desbloqueados' : 'Achievements unlocked'}!
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {achievements.map((a) => (
                    <span key={a}
                      className="text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-2 py-1 rounded-full">
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3 pt-2">
              <button onClick={restart} className="btn-primary w-full">
                {lang === 'es' ? 'Estudiar de nuevo' : 'Study again'}
              </button>
              <button
                onClick={() => router.push(`/study/${unitId}?mode=review`)}
                className="btn-ghost w-full"
              >
                {lang === 'es' ? 'Modo repaso' : 'Review mode'}
              </button>
              <button onClick={() => router.push('/study')} className="btn-ghost w-full">
                {lang === 'es' ? 'Volver a unidades' : 'Back to units'}
              </button>
            </div>
          </div>

          {/* Exam review: show question-by-question breakdown */}
          {mode === 'exam' && Object.keys(examResults).length > 0 && (
            <div className="card p-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {lang === 'es' ? 'Revisión de respuestas' : 'Answer review'}
              </h3>
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {questions.map((question, i) => {
                  const userAns = examAnswers[question.id]
                  const wasCorrect = examResults[question.id]
                  return (
                    <div key={question.id}
                      className={clsx(
                        'flex items-start gap-3 p-3 rounded-lg text-sm',
                        wasCorrect
                          ? 'bg-emerald-50 dark:bg-emerald-900/20'
                          : 'bg-red-50 dark:bg-red-900/20'
                      )}>
                      <span className="flex-shrink-0 font-mono text-xs text-gray-400 mt-0.5">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-800 dark:text-gray-200 line-clamp-2">
                          {qText(question)}
                        </p>
                        <div className="flex gap-3 mt-1 text-xs">
                          <span className={wasCorrect ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}>
                            {lang === 'es' ? 'Tu respuesta' : 'Your answer'}: {userAns ?? '—'}
                          </span>
                          {!wasCorrect && (
                            <span className="text-emerald-600 dark:text-emerald-400">
                              {lang === 'es' ? 'Correcta' : 'Correct'}: {question.correct}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="flex-shrink-0">{wasCorrect ? '✓' : '✗'}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── QUIZ SCREEN ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">

      {/* ── Header ── */}
      <header className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">

          {/* Back */}
          <button
            onClick={() => router.push('/study')}
            aria-label="Back to units"
            className="flex-shrink-0 text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Progress */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span className="truncate">{unitTitle}</span>
              <span className="flex-shrink-0 ml-2 font-mono">{idx + 1}/{questions.length}</span>
            </div>
            <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Timer */}
          <span className="flex-shrink-0 font-mono text-sm text-gray-500 tabular-nums">
            {formatTime(elapsed)}
          </span>

          {/* XP */}
          <span className="flex-shrink-0 text-sm font-semibold text-emerald-500">
            +{sessionXP} XP
          </span>

          {/* Lang toggle */}
          <button
            onClick={() => setLang((l) => (l === 'en' ? 'es' : 'en'))}
            className="flex-shrink-0 text-xs font-bold px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            {lang === 'en' ? 'ES' : 'EN'}
          </button>
        </div>
      </header>

      {/* ── Question area ── */}
      <main className="flex-1 px-4 py-6 flex flex-col items-center">
        <div className="w-full max-w-2xl space-y-4">

          {/* Meta row */}
          <div className="flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center gap-2">
              <span className="font-mono">#{q.legacyId}</span>
              {q.pageRef != null && <span>· p.{q.pageRef}</span>}
              {mode === 'exam' && (
                <span className="px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 font-medium">
                  {lang === 'es' ? 'Modo examen' : 'Exam mode'}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <span>{lang === 'es' ? 'Dominio' : 'Mastery'}:</span>
              <MasteryDots level={masteryMap[q.id] ?? q.mastery} />
            </div>
          </div>

          {/* Question text */}
          <div className="card p-5 md:p-6">
            <p className="text-gray-900 dark:text-white text-base leading-relaxed">
              {qText(q)}
            </p>
          </div>

          {/* Options */}
          <div className="space-y-2.5">
            {LETTERS.map((letter) => {
              const text      = optText(q, letter)
              const isChosen  = selected === letter
              const isCorrect = letter === q.correct

              // Color state
              let borderClass = 'border-gray-200 dark:border-gray-700'
              let bgClass     = 'bg-white dark:bg-gray-900 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10'
              let circleClass = 'border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400'
              let dimmed      = false

              if (revealed) {
                if (isCorrect) {
                  borderClass = 'border-emerald-500'
                  bgClass     = 'bg-emerald-50 dark:bg-emerald-900/20'
                  circleClass = 'border-emerald-500 bg-emerald-500 text-white'
                } else if (isChosen) {
                  borderClass = 'border-red-400'
                  bgClass     = 'bg-red-50 dark:bg-red-900/20'
                  circleClass = 'border-red-400 bg-red-400 text-white'
                } else {
                  dimmed = true
                  bgClass = 'bg-white dark:bg-gray-900 opacity-50'
                }
              } else if (isChosen) {
                borderClass = 'border-blue-500'
                bgClass     = 'bg-blue-50 dark:bg-blue-900/20'
                circleClass = 'border-blue-500 bg-blue-500 text-white'
              }

              return (
                <button
                  key={letter}
                  onClick={() => handleAnswer(letter)}
                  disabled={revealed || submitting}
                  className={clsx(
                    'w-full text-left flex items-start gap-3 p-4 rounded-xl border-2 transition-all duration-150',
                    borderClass, bgClass,
                    revealed || submitting ? 'cursor-default' : 'cursor-pointer',
                    dimmed && 'pointer-events-none'
                  )}
                >
                  {/* Letter circle */}
                  <span className={clsx(
                    'flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-colors',
                    circleClass
                  )}>
                    {letter}
                  </span>

                  {/* Option text */}
                  <span className="flex-1 text-sm text-gray-800 dark:text-gray-200 leading-relaxed pt-0.5">
                    {text}
                  </span>

                  {/* Indicator */}
                  {revealed && isCorrect && (
                    <span className="flex-shrink-0 text-emerald-500 font-bold pt-0.5">✓</span>
                  )}
                  {revealed && isChosen && !isCorrect && (
                    <span className="flex-shrink-0 text-red-400 font-bold pt-0.5">✗</span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Explanation panel */}
          {revealed && (
            <div className={clsx(
              'card border-l-4 p-4 space-y-2 transition-all',
              selected === q.correct
                ? 'border-l-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10'
                : 'border-l-red-400 bg-red-50/50 dark:bg-red-900/10'
            )}>
              <p className={clsx(
                'text-sm font-semibold',
                selected === q.correct
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-red-600 dark:text-red-400'
              )}>
                {selected === q.correct
                  ? (lang === 'es' ? '¡Correcto! ✓' : 'Correct! ✓')
                  : (lang === 'es' ? `Incorrecto ✗ — Respuesta: ${q.correct}` : `Incorrect ✗ — Answer: ${q.correct}`)}
              </p>
              {expText(q) && (
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {expText(q)}
                </p>
              )}
              {q.pageRef != null && (
                <p className="text-xs text-gray-400">
                  {lang === 'es' ? 'Referencia' : 'Reference'}: p.{q.pageRef}
                </p>
              )}
            </div>
          )}

          {/* Next button — shown after answering in quiz/review */}
          {revealed && (
            <button onClick={handleNext} className="btn-primary w-full">
              {idx + 1 >= questions.length
                ? (lang === 'es' ? 'Ver resultados →' : 'See results →')
                : (lang === 'es' ? 'Siguiente →' : 'Next →')}
            </button>
          )}

          {/* Keyboard hint */}
          {!revealed && (
            <p className="text-center text-xs text-gray-400">
              {lang === 'es'
                ? 'Tecla 1–4 o A–D para responder · Enter para siguiente'
                : 'Press 1–4 or A–D to answer · Enter to advance'}
            </p>
          )}
        </div>
      </main>

      {/* XP toast */}
      {xpToast && (
        <div
          key={xpToast.k}
          style={{ animation: 'fadeUpOut 2s ease forwards' }}
          className="fixed bottom-24 right-4 z-50 bg-emerald-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg pointer-events-none"
        >
          +{xpToast.xp} XP
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeUpOut {
          0%   { opacity: 1; transform: translateY(0); }
          70%  { opacity: 1; transform: translateY(-12px); }
          100% { opacity: 0; transform: translateY(-20px); }
        }
      `}</style>
    </div>
  )
}
