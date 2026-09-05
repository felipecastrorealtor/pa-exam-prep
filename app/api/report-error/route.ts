import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const KINDS = ['answer', 'translation', 'flashcard', 'app', 'other'] as const

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const { questionId, kind, message, context } = body as {
      questionId?: string
      kind?: string
      message?: string
      context?: Record<string, unknown>
    }

    const text = String(message ?? '').trim()
    if (!text) {
      return NextResponse.json({ error: 'Please describe the problem.' }, { status: 400 })
    }
    if (text.length > 2000) {
      return NextResponse.json({ error: 'Please keep it under 2000 characters.' }, { status: 400 })
    }

    const { error } = await supabase.from('error_reports').insert({
      user_id:     user.id,
      question_id: questionId ?? null,
      kind:        KINDS.includes(kind as typeof KINDS[number]) ? kind : 'other',
      message:     text,
      // Context is collected automatically so the reporter doesn't have to
      // explain where they were. No progress data, no personal details.
      context: {
        ...(context ?? {}),
        userAgent: req.headers.get('user-agent')?.slice(0, 200) ?? null,
        at: new Date().toISOString(),
      },
    } as any)

    if (error) {
      console.error('[report-error] insert failed:', error)
      return NextResponse.json({ error: 'Could not save your report.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[report-error] unexpected:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
