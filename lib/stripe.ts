import Stripe from 'stripe'

// Server-side Stripe client — never import in client components
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
  typescript: true,
})

export const PLANS = {
  monthly: {
    priceId: process.env.STRIPE_PRICE_MONTHLY!,
    amount: 2000, // $20.00 in cents
    interval: 'month' as const,
    label: 'Monthly',
    trialDays: 7,
  },
} as const

// Promo coupon — applied at checkout for $15/mo permanent discount
export const PROMO_COUPON_ID = process.env.STRIPE_COUPON_PROMO!

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
  }

  // Only apply the internal coupon when one is actually configured; passing an
  // undefined coupon id makes Stripe reject the whole session.
  if (promoCode) {
    if (!PROMO_COUPON_ID) {
      throw new Error('A promo code was supplied but STRIPE_COUPON_PROMO is not configured')
    }
    params.discounts = [{ coupon: PROMO_COUPON_ID }]
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
