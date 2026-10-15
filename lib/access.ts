/**
 * One answer to "does this account have access?", for every gate that asks.
 *
 * There were three different answers before this file, and they disagreed:
 *
 *   middleware.ts and (protected)/layout.tsx   active, trialing, free_access
 *                                              with a future expiry date
 *   /api/stripe/checkout (GET)                 active, trialing, past_due,
 *                                              free_access — any expiry
 *   netlify retention sweep                    active, trialing, past_due,
 *                                              free_access — null expiry means
 *                                              forever
 *
 * An account in `past_due` therefore got locked out of /study by the first,
 * while the second told the subscribe page "you are already subscribed" — so
 * the only two doors each sent the person back to the other one. That is what
 * the admin account was stuck in.
 *
 * The rules, once:
 *
 *  - An admin always has access. Being locked out of your own product because
 *    a card failed is never the behaviour anyone wants, and the admin pages
 *    live behind the same gate as the study pages.
 *  - `past_due` keeps access. Stripe retries a failed invoice over several
 *    days before giving up; cutting someone off the morning their card
 *    hiccups loses a paying member over a problem that usually fixes itself.
 *    When Stripe does give up it sends `canceled`, and that does end access.
 *  - `free_access` with no expiry date means unlimited, which is what a
 *    lifetime access code is. The old gate required a date and silently
 *    denied the lifetime case.
 */

export const ACCESS_STATUSES = ['active', 'trialing', 'past_due', 'free_access'] as const

export interface AccessProfile {
  role?: string | null
  subscription_status?: string | null
  subscription_expires_at?: string | null
}

export function hasAccess(profile: AccessProfile | null | undefined): boolean {
  if (!profile) return false

  if (profile.role === 'admin') return true

  const status = profile.subscription_status ?? ''

  if (status === 'free_access') {
    // No date = lifetime.
    if (!profile.subscription_expires_at) return true
    return new Date(profile.subscription_expires_at).getTime() > Date.now()
  }

  if (status === 'trialing') {
    // A trial that never ends is not a trial. This check was missing, and
    // seventeen accounts whose trial expired in September still had full
    // access a month later.
    //
    // Two kinds of trial end up in this column and they are told apart by the
    // date. A Stripe trial carries none — the webhook writes null and Stripe
    // itself closes it by sending `canceled`, so trusting the status alone is
    // right there. A trial granted by the app carries an expiry date, and that
    // date is the entire point of it.
    if (!profile.subscription_expires_at) return true
    return new Date(profile.subscription_expires_at).getTime() > Date.now()
  }

  // free_access and trialing already returned above.
  return status === 'active' || status === 'past_due'
}

// What the person is told they are on, which is not the same question as
// whether they get in: an admin on a lapsed card is still an admin, and the
// billing state shown to them should stay truthful.
export function planLabel(profile: AccessProfile | null | undefined): 'paid' | 'trial' | 'free_access' | 'none' {
  const status = profile?.subscription_status ?? ''
  if (status === 'active' || status === 'past_due') return 'paid'
  if (status === 'trialing') return 'trial'
  if (status === 'free_access') return 'free_access'
  return 'none'
}
