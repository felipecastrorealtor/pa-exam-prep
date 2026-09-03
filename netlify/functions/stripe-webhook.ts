/**
 * Netlify Function: stripe-webhook
 *
 * Receives Stripe webhook events and keeps the Supabase profiles table
 * in sync with subscription status.
 *
 * Endpoint: /.netlify/functions/stripe-webhook
 * Configure this URL in: Stripe Dashboard → Developers → Webhooks
 *
 * Events handled:
 *   checkout.session.completed       → activate trial / subscription
 *   customer.subscription.updated    → sync status changes
 *   customer.subscription.deleted    → mark as canceled
 *   invoice.payment_failed           → mark as past_due
 *   invoice.payment_succeeded        → ensure status = active
 */

import type { Handler, HandlerEvent } from '@netlify/functions'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // service role bypasses RLS
)

async function syncSubscription(sub: Stripe.Subscription) {
  const userId = sub.metadata?.userId
  if (!userId) {
    console.error('stripe-webhook: subscription has no userId metadata', sub.id)
    return
  }

  // Map Stripe status to our enum
  const statusMap: Record<string, string> = {
    trialing:         'trialing',
    active:           'active',
    past_due:         'past_due',
    canceled:         'canceled',
    incomplete:       'incomplete',
    incomplete_expired: 'canceled',
    paused:           'paused',
    unpaid:           'past_due',
  }

  const status = statusMap[sub.status] ?? 'canceled'

  await supabaseAdmin
    .from('profiles')
    .update({
      subscription_status:    status as any,
      stripe_subscription_id: sub.id,
      stripe_customer_id:     typeof sub.customer === 'string'
                                ? sub.customer
                                : sub.customer.id,
      subscription_expires_at: null, // free_access codes set this; Stripe subs don't
    })
    .eq('id', userId)
}

const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' }
  }

  const sig = event.headers['stripe-signature']
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!sig || !webhookSecret) {
    console.error('stripe-webhook: missing signature or secret')
    return { statusCode: 400, body: 'Missing signature' }
  }

  let stripeEvent: Stripe.Event
  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body || '',
      sig,
      webhookSecret
    )
  } catch (err) {
    console.error('stripe-webhook: signature verification failed', err)
    return { statusCode: 400, body: 'Webhook signature verification failed' }
  }

  try {
    switch (stripeEvent.type) {

      case 'checkout.session.completed': {
        const session = stripeEvent.data.object as Stripe.Checkout.Session
        if (session.mode === 'subscription' && session.subscription) {
          const sub = await stripe.subscriptions.retrieve(
            typeof session.subscription === 'string'
              ? session.subscription
              : session.subscription.id
          )
          await syncSubscription(sub)
        }
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = stripeEvent.data.object as Stripe.Subscription
        await syncSubscription(sub)
        break
      }

      case 'customer.subscription.deleted': {
        const sub = stripeEvent.data.object as Stripe.Subscription
        const userId = sub.metadata?.userId
        if (userId) {
          await supabaseAdmin
            .from('profiles')
            .update({ subscription_status: 'canceled' as any })
            .eq('id', userId)
        }
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = stripeEvent.data.object as Stripe.Invoice
        if (invoice.subscription) {
          const sub = await stripe.subscriptions.retrieve(
            typeof invoice.subscription === 'string'
              ? invoice.subscription
              : invoice.subscription.id
          )
          await syncSubscription(sub)
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = stripeEvent.data.object as Stripe.Invoice
        if (invoice.subscription) {
          const sub = await stripe.subscriptions.retrieve(
            typeof invoice.subscription === 'string'
              ? invoice.subscription
              : invoice.subscription.id
          )
          const userId = sub.metadata?.userId
          if (userId) {
            await supabaseAdmin
              .from('profiles')
              .update({ subscription_status: 'past_due' as any })
              .eq('id', userId)
          }
        }
        break
      }

      default:
        // Ignore unhandled event types
        break
    }
  } catch (err) {
    console.error('stripe-webhook: handler error', stripeEvent.type, err)
    return { statusCode: 500, body: 'Internal error' }
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) }
}

export { handler }
