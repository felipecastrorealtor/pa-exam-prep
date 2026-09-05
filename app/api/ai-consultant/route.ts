import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// The API key stays on the server. It is never sent to the browser.
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta'
// Ordered fallback. The first entry is the proven model; the others cover
// transient 503s (high demand) and future deprecations without a code change.
// gemini-3.6-flash is a reasoning model: it spends ~1000 tokens thinking before
// writing, which took 18s in testing — well past Netlify's 10s function limit,
// so the function was killed and the browser got an HTML error page.
// flash-lite answers the same questions in ~1.3s.
const MODELS = (process.env.GEMINI_MODEL ?? 'gemini-3.1-flash-lite,gemini-3.5-flash,gemini-flash-latest')
  .split(',').map((m) => m.trim()).filter(Boolean)

// Bail out before the platform kills us, so the client always gets JSON.
const UPSTREAM_TIMEOUT_MS = 8000

const SYSTEM_PROMPT = `Eres un experto en Real Estate de Pennsylvania y Federal (USA). Tu función es ayudar a estudiantes que se preparan para el examen de licencia de bienes raíces de Pennsylvania (PSI exam).

Conoces a fondo:
- Modern Real Estate Practice (libro base del examen PA)
- Pennsylvania Real Estate Licensing and Registration Act (RELRA)
- PA Landlord-Tenant Act (68 P.S. § 250.501)
- PA Mechanic's Lien Law 1963
- PA Probate, Estates & Fiduciaries Code (20 Pa. C.S. § 2203)
- Federal Fair Housing Act (clases protegidas: raza, color, religión, sexo, origen nacional, discapacidad, estado familiar)
- RESPA / TRID / FIRREA / CERCLA / SARA / Title X
- Contratos, cierre, hipotecas, gravámenes, prioridad de gravámenes, impuestos de bienes raíces
- Tasación, valoración, tipos de propiedad
- Agency law: types of agency, disclosure requirements

Reglas:
- Responde SIEMPRE en el mismo idioma que el estudiante (español o inglés).
- Sé preciso, conciso y útil para el examen.
- Si la pregunta es de práctica, da la respuesta correcta con explicación clara.
- No inventes leyes o cifras; si no estás seguro, indícalo.
- Cuando sea relevante, menciona si aplica a nivel federal o solo a Pennsylvania.`

type Turn = { role: 'user' | 'model'; parts: { text: string }[] }

export async function POST(req: NextRequest) {
  try {
    // Only signed-in users may spend our API quota.
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const key = process.env.GEMINI_API_KEY
    if (!key) {
      console.error('[ai-consultant] GEMINI_API_KEY not configured')
      return NextResponse.json({ error: 'AI is not configured yet.' }, { status: 503 })
    }

    const { history } = (await req.json()) as { history?: Turn[] }
    if (!Array.isArray(history) || history.length === 0) {
      return NextResponse.json({ error: 'No message provided' }, { status: 400 })
    }

    // Keep the last 20 turns, and cap each message so one request can't run away.
    const contents = history.slice(-20).map((t) => ({
      role: t.role === 'model' ? 'model' : 'user',
      parts: [{ text: String(t.parts?.[0]?.text ?? '').slice(0, 2000) }],
    }))

    const payload = JSON.stringify({
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents,
      // These are reasoning models: part of the budget is spent thinking before
      // any visible text is produced. Too low a cap returns an empty answer.
      generationConfig: { temperature: 0.4, maxOutputTokens: 1024 },
    })

    let lastStatus = 0

    for (const model of MODELS) {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS)

      let res: Response
      try {
        res = await fetch(`${GEMINI_BASE}/models/${model}:generateContent?key=${key}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          signal: controller.signal,
        })
      } catch (e) {
        clearTimeout(timer)
        console.error('[ai-consultant]', model, 'timed out or failed to connect')
        lastStatus = 504
        continue
      }
      clearTimeout(timer)

      if (res.ok) {
        const json = await res.json()
        const candidate = json?.candidates?.[0]
        const text = (candidate?.content?.parts ?? [])
          .map((p: { text?: string }) => p?.text ?? '')
          .join('')
          .trim()

        if (text) return NextResponse.json({ text })

        // Ran out of budget before writing anything — try the next model.
        console.warn('[ai-consultant] empty text from', model, 'finish:', candidate?.finishReason)
        lastStatus = 502
        continue
      }

      lastStatus = res.status
      const detail = await res.text().catch(() => '')
      console.error('[ai-consultant]', model, 'failed:', res.status, detail.slice(0, 300))

      // Rate limiting is the caller's problem, not something a retry fixes.
      if (res.status === 429) {
        return NextResponse.json(
          { error: 'Too many requests right now. Wait a moment and try again.' },
          { status: 429 }
        )
      }
      // 404 (model retired) and 503 (overloaded) are worth retrying elsewhere.
      if (res.status !== 404 && res.status !== 503) break
    }

    // Never surface upstream detail — it can echo key material.
    return NextResponse.json(
      { error: 'The AI service is busy right now. Please try again in a moment.' },
      { status: lastStatus === 503 ? 503 : 502 }
    )
  } catch (err) {
    console.error('[ai-consultant] unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
