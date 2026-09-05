/**
 * Stripe webhook Route Handler (Next.js App Router)
 * This duplicates the logic in netlify/functions/stripe-webhook.ts
 * but as a Next.js API route for local dev with `next dev`.
 * In production on Netlify, the Netlify Function at /.netlify/functions/stripe-webhook
 * is used and this route is NOT called (netlify.toml rewrites handle it).
 */
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig  = req.headers.get('stripe-signature') ?? ''

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabaseAdmin = await createAdminClient()

  async function syncSub(sub: Stripe.Subscription) {
    const userId = sub.metadata?.userId
    if (!userId) return

    const statusMap: Record<string, string> = {
      trialing: 'trialing', active: 'active', past_due: 'past_due',
      canceled: 'canceled', incomplete: 'canceled', paused: 'paused',
      unpaid: 'past_due', incomplete_expired: 'canceled',
    }

    const patch: Record<string, unknown> = {
      subscription_status:    (statusMap[sub.status] ?? 'canceled') as any,
      stripe_subscription_id: sub.id,
      stripe_customer_id:     typeof sub.customer === 'string' ? sub.customer : sub.customer.id,
      subscription_expires_at: null,
    }

    // The moment a trial exists on Stripe's side, burn the entitlement so the
    // same account can never be granted a second one.
    if (sub.trial_start || sub.status === 'trialing') {
      patch.trial_used_at = new Date(
        (sub.trial_start ?? Math.floor(Date.now() / 1000)) * 1000
      ).toISOString()
    }

    const { error } = await supabaseAdmin.from('profiles').update(patch as any).eq('id', userId)
    if (error) console.error('[stripe/webhook] profile update failed:', error)
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const s = event.data.object as Stripe.Checkout.Session
      if (s.mode === 'subscription' && s.subscription) {
        const sub = await stripe.subscriptions.retrieve(
          typeof s.subscription === 'string' ? s.subscription : s.subscription.id
        )
        await syncSub(sub)
      }
      break
    }
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      await syncSub(event.data.object as Stripe.Subscription)
      break
    case 'customer.subscription.deleted': {
      const userId = (event.data.object as Stripe.Subscription).metadata?.userId
      if (userId) await supabaseAdmin.from('profiles')
        .update({ subscription_status: 'canceled' as any }).eq('id', userId)
      break
    }
    case 'invoice.payment_failed': {
      const inv = event.data.object as Stripe.Invoice
      if (inv.subscription) {
        const sub = await stripe.subscriptions.retrieve(
          typeof inv.subscription === 'string' ? inv.subscription : inv.subscription.id
        )
        const userId = sub.metadata?.userId
        if (userId) await supabaseAdmin.from('profiles')
          .update({ subscription_status: 'past_due' as any }).eq('id', userId)
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
