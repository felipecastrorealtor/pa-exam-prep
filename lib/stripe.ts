import Stripe from 'stripe'
import { TRIAL_DAYS } from '@/lib/plan'

// Server-side Stripe client — never import in client components
// This account is on Stripe Managed Payments, which the API rejects on any
// version before 2025-03-31.basil — on the old pin EVERY checkout session
// creation came back 400 and the button showed the generic failure message.
// Keep this in step with the installed SDK's pinned version.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
  typescript: true,
})

export const PLANS = {
  monthly: {
    priceId: process.env.STRIPE_PRICE_MONTHLY!,
    amount: 2000, // $20.00 in cents
    interval: 'month' as const,
    label: 'Monthly',
    trialDays: TRIAL_DAYS,
  },
} as const

// A code the person typed is resolved against Stripe's own promotion codes.
// There used to be a single coupon id in STRIPE_COUPON_PROMO that was applied
// whatever they typed — so any text at all bought the discount, and someone
// who simply noticed the field got it without knowing a code.
export class InvalidPromoCodeError extends Error {
  constructor(public readonly code: string) {
    super(`No active Stripe promotion code matches "${code}"`)
    this.name = 'InvalidPromoCodeError'
  }
}

// Stripe's `code` filter is an exact match, and the field upper-cases what the
// person types, so a code created in lower case would never be found. Try the
// text as given and as typed-upper before giving up.
async function findPromotionCode(typed: string) {
  const tries = Array.from(new Set([typed.trim(), typed.trim().toUpperCase()])).filter(Boolean)
  for (const code of tries) {
    const found = await stripe.promotionCodes.list({ code, active: true, limit: 1 })
    if (found.data.length > 0) return found.data[0]
  }
  return null
}

// Create a Stripe Checkout session for subscription.
//
// `withTrial` is decided by the caller AFTER checking eligibility server-side —
// never from anything the browser sent.
export async function createCheckoutSession({
  userId,
  email,
  customerId,
  promoCode,
  withTrial,
  successUrl,
  cancelUrl,
}: {
  userId: string
  email: string
  customerId?: string | null
  promoCode?: string
  withTrial: boolean
  successUrl: string
  cancelUrl: string
}) {
  if (!PLANS.monthly.priceId) {
    throw new Error('STRIPE_PRICE_MONTHLY is not configured')
  }

  const params: Stripe.Checkout.SessionCreateParams = {
    mode: 'subscription',
    line_items: [{ price: PLANS.monthly.priceId, quantity: 1 }],
    subscription_data: { metadata: { userId } },
    metadata: { userId, withTrial: String(withTrial) },
    success_url: successUrl,
    cancel_url: cancelUrl,
    allow_promotion_codes: true,
  }

  // Reuse the existing customer so a returning user doesn't get a duplicate
  // record — and so Stripe's own trial history stays attached to one customer.
  if (customerId) {
    params.customer = customerId
  } else {
    params.customer_email = email
  }

  if (withTrial) {
    params.subscription_data!.trial_period_days = PLANS.monthly.trialDays

    // The site promises "no credit card required to start", so don't ask for
    // one. Stripe only collects a payment method when money is due now, and
    // during a trial none is.
    params.payment_method_collection = 'if_required'

    // Which leaves a trial that can reach its end with no way to charge.
    // Without this, Stripe keeps the subscription and marks it past_due — and
    // past_due still grants access, so the trial would quietly become free
    // forever. Cancelling is the honest end: the webhook writes `canceled`
    // and access stops.
    params.subscription_data!.trial_settings = {
      end_behavior: { missing_payment_method: 'cancel' },
    }
  }

  // Apply the code the person actually typed, or refuse it. Silently handing
  // out a discount for the wrong text is worse than saying "that code is not
  // valid" — the person at least learns something true.
  if (promoCode?.trim()) {
    const promotion = await findPromotionCode(promoCode)
    if (!promotion) throw new InvalidPromoCodeError(promoCode.trim())

    params.discounts = [{ promotion_code: promotion.id }]
    // Stripe rejects discounts and allow_promotion_codes together.
    delete params.allow_promotion_codes
  }

  return stripe.checkout.sessions.create(params)
}

// Has this account ever started a subscription on Stripe's side?
// Used as a second opinion when our own trial_used_at flag is empty.
export async function hasStripeSubscriptionHistory(customerId?: string | null) {
  if (!customerId) return false
  try {
    const subs = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 1,
    })
    return subs.data.length > 0
  } catch (err) {
    console.error('[stripe] subscription history lookup failed:', err)
    // Fail closed on the trial: better to charge correctly than to hand out
    // a second free week because a lookup blipped.
    return true
  }
}

// Resolve a free-access code locally (not Stripe)
// Returns the number of days granted, or null if invalid
export async function validateFreeAccessCode(
  code: string,
  supabaseAdmin: ReturnType<typeof import('@/lib/supabase/server').createAdminClient> extends Promise<infer T> ? T : never
) {
  const { data, error } = await supabaseAdmin
    .from('access_codes')
    .select('id, duration_days, max_uses, uses_count, active, expires_at')
    .eq('code', code.trim().toUpperCase())
    .single()

  if (error || !data) return null
  if (!data.active) return null
  if (data.max_uses !== null && data.uses_count >= data.max_uses) return null
  if (data.expires_at && new Date(data.expires_at) < new Date()) return null

  return data
}
