import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// The API key stays on the server. It is never sent to the browser.
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta'
const MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash'

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

    const res = await fetch(`${GEMINI_BASE}/models/${MODEL}:generateContent?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
        generationConfig: { temperature: 0.4, maxOutputTokens: 1024 },
      }),
    })

    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      console.error('[ai-consultant] Gemini error:', res.status, detail.slice(0, 500))
      if (res.status === 429) {
        return NextResponse.json(
          { error: 'Too many requests right now. Wait a moment and try again.' },
          { status: 429 }
        )
      }
      // Never surface upstream detail — it can echo key material.
      return NextResponse.json({ error: 'The AI service is unavailable.' }, { status: 502 })
    }

    const json = await res.json()
    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) {
      return NextResponse.json({ error: 'Empty response from the AI service.' }, { status: 502 })
    }

    return NextResponse.json({ text })
  } catch (err) {
    console.error('[ai-consultant] unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
