/**
 * Netlify Function: gemini-proxy
 *
 * SECURITY PURPOSE:
 *   The old pa_real_estate_v4.html had the Gemini API key hardcoded in public
 *   HTML. That key HAS BEEN REVOKED. This function holds the NEW key in a
 *   Netlify environment variable (GEMINI_API_KEY) — it never reaches the browser.
 *
 * Endpoint: /.netlify/functions/gemini-proxy
 * Method: POST
 * Auth: Bearer token (Supabase JWT) — subscription check enforced here
 *
 * Body (JSON):
 *   { prompt: string, model?: string }
 *
 * Response (JSON):
 *   { text: string }  on success
 *   { error: string } on failure
 */

import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta'
const DEFAULT_MODEL = 'gemini-1.5-flash'

// Max prompt length — prevent abuse
const MAX_PROMPT_CHARS = 8_000
// Rate limit: max requests per user per minute (simple in-memory, resets per function cold start)
const rateLimitMap = new Map<string, { count: number; reset: number }>()
const RATE_LIMIT_PER_MIN = 10

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(userId)
  if (!entry || now > entry.reset) {
    rateLimitMap.set(userId, { count: 1, reset: now + 60_000 })
    return true
  }
  if (entry.count >= RATE_LIMIT_PER_MIN) return false
  entry.count++
  return true
}

const handler: Handler = async (event: HandlerEvent, _ctx: HandlerContext) => {
  // Only POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  // ── Auth: verify Supabase JWT ───────────────────────────────────────────────
  const authHeader = event.headers['authorization'] || ''
  const token = authHeader.replace(/^Bearer\s+/i, '')

  if (!token) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) }
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Verify the JWT and get user
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Invalid token' }) }
  }

  // ── Subscription check ──────────────────────────────────────────────────────
  // Use service role to bypass RLS for this read
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('subscription_status, subscription_expires_at')
    .eq('id', user.id)
    .single()

  const isActive =
    profile?.subscription_status === 'active' ||
    profile?.subscription_status === 'trialing' ||
    (profile?.subscription_status === 'free_access' &&
      profile.subscription_expires_at &&
      new Date(profile.subscription_expires_at) > new Date())

  if (!isActive) {
    return {
      statusCode: 402,
      body: JSON.stringify({ error: 'Subscription required' }),
    }
  }

  // ── Rate limit ──────────────────────────────────────────────────────────────
  if (!checkRateLimit(user.id)) {
    return {
      statusCode: 429,
      body: JSON.stringify({ error: 'Too many requests — please wait a moment' }),
    }
  }

  // ── Parse body ──────────────────────────────────────────────────────────────
  let body: { prompt?: string; model?: string }
  try {
    body = JSON.parse(event.body || '{}')
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) }
  }

  const prompt = (body.prompt || '').trim()
  if (!prompt) {
    return { statusCode: 400, body: JSON.stringify({ error: 'prompt is required' }) }
  }
  if (prompt.length > MAX_PROMPT_CHARS) {
    return { statusCode: 400, body: JSON.stringify({ error: 'prompt too long' }) }
  }

  const model = body.model || DEFAULT_MODEL
  // Allowlist models — never let user inject arbitrary model strings
  const allowedModels = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash']
  if (!allowedModels.includes(model)) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid model' }) }
  }

  // ── Call Gemini API (key stays server-side) ─────────────────────────────────
  const geminiKey = process.env.GEMINI_API_KEY
  if (!geminiKey) {
    console.error('GEMINI_API_KEY not configured')
    return { statusCode: 500, body: JSON.stringify({ error: 'AI service not configured' }) }
  }

  try {
    const geminiRes = await fetch(
      `${GEMINI_BASE}/models/${model}:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          },
          safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          ],
        }),
      }
    )

    if (!geminiRes.ok) {
      const errBody = await geminiRes.text()
      console.error('Gemini API error:', geminiRes.status, errBody)
      return {
        statusCode: 502,
        body: JSON.stringify({ error: 'AI service error — please try again' }),
      }
    }

    const geminiData = await geminiRes.json()
    const text =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || ''

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    }
  } catch (err) {
    console.error('Gemini proxy error:', err)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal error' }),
    }
  }
}

export { handler }
