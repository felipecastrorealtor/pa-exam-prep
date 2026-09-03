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

// Create a Stripe Checkout session for subscription
export async function createCheckoutSession({
  userId,
  email,
  promoCode,
  successUrl,
  cancelUrl,
}: {
  userId: string
  email: string
  promoCode?: string
  successUrl: string
  cancelUrl: string
}) {
  const params: Stripe.Checkout.SessionCreateParams = {
    mode: 'subscription',
    customer_email: email,
    line_items: [
      {
        price: PLANS.monthly.priceId,
        quantity: 1,
      },
    ],
    subscription_data: {
      trial_period_days: PLANS.monthly.trialDays,
      metadata: { userId },
    },
    metadata: { userId },
    success_url: successUrl,
    cancel_url: cancelUrl,
    allow_promotion_codes: true, // let user enter promo codes in Stripe's UI
  }

  // If caller already resolved a promo code to our internal coupon
  if (promoCode) {
    params.discounts = [{ coupon: PROMO_COUPON_ID }]
    // When discounts is set, allow_promotion_codes must be absent
    delete params.allow_promotion_codes
  }

  return stripe.checkout.sessions.create(params)
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
