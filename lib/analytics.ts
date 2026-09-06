'use client'

import posthog from 'posthog-js'

/**
 * The one place the app talks to analytics.
 *
 * Every event the product cares about is declared here with its payload, so a
 * typo in a name or a property is a compile error rather than a silently
 * missing funnel. Components call `track('question_answered', {...})` — they
 * never touch posthog directly.
 *
 * Nothing identifying goes into an event: the person is the distinct id, set
 * once by `identifyUser`. No email, no answer text, no card details, no tokens.
 */

type Lang = 'en' | 'es'
type Plan = 'paid' | 'trial' | 'free_access' | 'none'
/** How the questions were served: a quiz, a targeted review, or a mock exam. */
type SessionMode = 'quiz' | 'review' | 'exam'

export interface EventMap {
  /* Account and subscription. The money events are also written by the Stripe
     webhook — the browser is never the record of what was paid. */
  user_registered:       { language: Lang }
  trial_started:         { plan?: string }
  checkout_started:      { requested_trial: boolean; has_promo: boolean }
  subscription_activated:{ plan?: string }
  subscription_cancelled:Record<string, never>
  payment_failed:        Record<string, never>
  access_code_redeemed:  { duration_days?: number }

  /* Studying. */
  study_session_started:   { session_mode: SessionMode; unit_id: number | null; questions: number; language: Lang }
  study_session_completed: { session_mode: SessionMode; unit_id: number | null; questions_answered: number; score: number | null; duration_seconds: number | null; language: Lang }
  question_answered:       { question_id: string; unit_id: number | null; is_correct: boolean; session_mode: SessionMode; language: Lang }
  unit_started:            { unit_id: number }
  unit_completed:          { unit_id: number; score: number | null }
  practice_exam_started:   { exam_type: string; questions: number }
  practice_exam_completed: { exam_type: string; score: number; questions_answered: number; duration_seconds: number | null; passed: boolean }
  flashcard_session_started:   { deck: string }
  flashcard_session_completed: { deck: string; cards_reviewed: number; duration_seconds: number | null }
  achievement_unlocked:    { achievement_id: string }
  question_reported:       { question_id: string | null; report_reason: string }
}

export type EventName = keyof EventMap

let ready = false

export function analyticsEnabled(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY)
}

/** Called once by the provider. Safe to call twice — Strict Mode does. */
export function initAnalytics(): void {
  if (ready || typeof window === 'undefined') return
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
  if (!key) return

  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
    // Routing is ours: the App Router doesn't fire the navigations posthog
    // listens for, so the provider sends $pageview itself.
    capture_pageview: false,
    capture_pageleave: true,
    persistence: 'localStorage+cookie',
    autocapture: false,          // only the events declared above
    disable_session_recording: false,
    session_recording: {
      // Record shapes, never content: no typing, no answer text, nothing a
      // student wrote. Anything marked ph-no-capture is blanked outright.
      maskAllInputs: true,
      maskTextSelector: '[data-ph-mask], input, textarea',
    },
    // Web vitals only; no heatmaps, no exception autocapture of user text.
    capture_performance: true,
    loaded: () => { ready = true },
  })
  ready = true
}

export function track<E extends EventName>(event: E, properties: EventMap[E]): void {
  if (!ready || !analyticsEnabled()) return
  try {
    posthog.capture(event, properties as Record<string, unknown>)
  } catch {
    // Analytics must never break a study session.
  }
}

export function trackPageview(url: string): void {
  if (!ready || !analyticsEnabled()) return
  try {
    posthog.capture('$pageview', { $current_url: url })
  } catch { /* ignore */ }
}

/**
 * The account's stable id — never the email. Plan and language are person
 * properties, so a funnel can be split by them without stamping them on every
 * single event.
 */
export function identifyUser(userId: string, props: { plan: Plan; language: Lang }): void {
  if (!ready || !analyticsEnabled()) return
  try {
    posthog.identify(userId, props)
  } catch { /* ignore */ }
}

/** On sign-out, so the next person on this browser is not the previous one. */
export function resetAnalytics(): void {
  if (!ready || !analyticsEnabled()) return
  try {
    posthog.reset()
  } catch { /* ignore */ }
}
