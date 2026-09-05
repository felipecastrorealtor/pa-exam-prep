/** Level ladder — same thresholds and names as the original single-file app. */
export const LEVELS = [
  { min: 0,    icon: '🌱', en: 'Novice',       es: 'Novato' },
  { min: 100,  icon: '📗', en: 'Apprentice',   es: 'Aprendiz' },
  { min: 300,  icon: '📘', en: 'Student',      es: 'Estudiante' },
  { min: 600,  icon: '📙', en: 'Practitioner', es: 'Practicante' },
  { min: 1000, icon: '🎓', en: 'Graduate',     es: 'Graduado' },
  { min: 1600, icon: '⭐', en: 'Expert',       es: 'Experto' },
  { min: 2500, icon: '🏆', en: 'Master',       es: 'Maestro' },
  { min: 4000, icon: '👑', en: 'Champion',     es: 'Campeón' },
] as const

export type Level = (typeof LEVELS)[number]

export function currentLevel(xp: number): Level {
  let found: Level = LEVELS[0]
  for (const l of LEVELS) {
    if (xp >= l.min) found = l
    else break
  }
  return found
}

export function nextLevel(xp: number): Level | null {
  for (const l of LEVELS) if (xp < l.min) return l
  return null
}

/** Progress within the current level: { curr, needed, pct }. */
export function xpProgress(xp: number) {
  const cur  = currentLevel(xp)
  const next = nextLevel(xp)
  if (!next) return { curr: xp - cur.min, needed: xp - cur.min, pct: 100 }
  const curr   = xp - cur.min
  const needed = next.min - cur.min
  return { curr, needed, pct: Math.round((curr / needed) * 100) }
}

export function levelIndex(l: Level): number {
  return LEVELS.indexOf(l as never) + 1
}

/** Same weighting the original app used for the readiness ring. */
export function calcReadiness(opts: {
  total: number
  correct: number
  seen: number
  totalQuestions: number
  streak: number
}): number {
  const { total, correct, seen, totalQuestions, streak } = opts
  const acc      = total > 0 ? Math.min((correct / total) * 1.25, 1) : 0
  const coverage = totalQuestions > 0 ? Math.min(seen / totalQuestions, 1) : 0
  const strk     = Math.min(streak / 7, 1)
  return Math.round((acc * 0.45 + coverage * 0.4 + strk * 0.15) * 100)
}
