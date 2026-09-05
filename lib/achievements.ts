/**
 * Presentation metadata for the achievement wall.
 *
 * The original app grouped badges into categories and gave each a tier that
 * drives the aura colour and the gold sweep on tier 4. The database rows only
 * carry title/description/xp, so that layer lives here, keyed by achievement id.
 */

export type AchCat = 'start' | 'streak' | 'volume' | 'accuracy' | 'mastery' | 'special'

export const CAT_LABEL: Record<AchCat, { en: string; es: string }> = {
  start:    { en: 'First Steps', es: 'Primeros Pasos' },
  streak:   { en: 'Streak',      es: 'Racha' },
  volume:   { en: 'Volume',      es: 'Volumen' },
  accuracy: { en: 'Accuracy',    es: 'Precisión' },
  mastery:  { en: 'Mastery',     es: 'Maestría' },
  special:  { en: 'Special',     es: 'Especial' },
}

export const CAT_ORDER: AchCat[] = ['start', 'streak', 'volume', 'accuracy', 'mastery', 'special']

interface AchMeta { cat: AchCat; tier: 1 | 2 | 3 | 4; color: string }

export const ACH_META: Record<string, AchMeta> = {
  first_question: { cat: 'start',    tier: 1, color: '#06b6d4' },
  flash_25:       { cat: 'start',    tier: 1, color: '#2dd4bf' },
  session_10:     { cat: 'start',    tier: 2, color: '#4f8ef7' },

  streak_3:       { cat: 'streak',   tier: 2, color: '#f97316' },
  streak_7:       { cat: 'streak',   tier: 3, color: '#f59e0b' },
  streak_30:      { cat: 'streak',   tier: 4, color: '#fbbf24' },

  q50:            { cat: 'volume',   tier: 1, color: '#8b5cf6' },
  q100:           { cat: 'volume',   tier: 2, color: '#8b5cf6' },
  q250:           { cat: 'volume',   tier: 3, color: '#a855f7' },
  q500:           { cat: 'volume',   tier: 4, color: '#f97316' },

  perfect_10:     { cat: 'accuracy', tier: 3, color: '#10b981' },
  score_90:       { cat: 'accuracy', tier: 3, color: '#3b82f6' },

  mastery_10:     { cat: 'mastery',  tier: 1, color: '#7c5cfc' },
  mastery_50:     { cat: 'mastery',  tier: 3, color: '#8b5cf6' },
  mastery_100:    { cat: 'mastery',  tier: 4, color: '#fbbf24' },
  unit_complete:  { cat: 'mastery',  tier: 2, color: '#7c5cfc' },
  all_units:      { cat: 'mastery',  tier: 4, color: '#fbbf24' },

  flash_100:      { cat: 'special',  tier: 3, color: '#2dd4bf' },
  session_50:     { cat: 'special',  tier: 3, color: '#818cf8' },
  bilingual:      { cat: 'special',  tier: 2, color: '#fb923c' },
  exam_ready:     { cat: 'special',  tier: 4, color: '#fbbf24' },
}

/** Anything not in the table above still renders — it lands in "Special", tier 1. */
export function achMeta(id: string, xpReward = 0): AchMeta {
  return ACH_META[id] ?? {
    cat: 'special',
    tier: xpReward >= 500 ? 4 : xpReward >= 300 ? 3 : xpReward >= 150 ? 2 : 1,
    color: '#4f8ef7',
  }
}
