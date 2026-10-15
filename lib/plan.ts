/**
 * The plan's numbers, in one place.
 *
 * The trial length used to be a literal in lib/stripe.ts and the words "7-day"
 * were typed by hand into five components across two languages. Changing it
 * meant finding all of them, and missing one meant the site promised a length
 * the checkout did not give.
 *
 * This file is safe to import from a client component — it pulls in nothing.
 * lib/stripe.ts cannot be, because it loads the Stripe SDK.
 */

export const TRIAL_DAYS = 3

export const PRICE_USD = 20

/** "3-day" / "3 días", for sentences that embed the length. */
export function trialLengthLabel(lang: 'en' | 'es'): string {
  return lang === 'es' ? `${TRIAL_DAYS} días` : `${TRIAL_DAYS}-day`
}
