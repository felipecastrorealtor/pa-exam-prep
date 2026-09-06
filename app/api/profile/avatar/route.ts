import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const PRESETS = new Set([
  'house', 'key', 'compass', 'summit',
  'wave', 'leaf', 'prism', 'star',
  'moon', 'sun', 'bolt', 'orbit',
])

// A data URL is stored inline on the profile row, so it has to stay small.
const MAX_DATA_URL = 200_000

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  let body: { avatar?: unknown } = {}
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }

  const raw = body.avatar
  let avatar: string | null

  if (raw === null || raw === undefined || raw === '') {
    avatar = null
  } else if (typeof raw !== 'string') {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  } else if (raw.startsWith('preset:')) {
    if (!PRESETS.has(raw.slice(7))) {
      return NextResponse.json({ error: 'bad_request' }, { status: 400 })
    }
    avatar = raw
  } else if (/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(raw)) {
    // Reject anything but a plain raster data URL: no SVG (it can carry script)
    // and no remote URL, so nothing on this row can point off-site.
    if (raw.length > MAX_DATA_URL) {
      return NextResponse.json({ error: 'too_large' }, { status: 413 })
    }
    avatar = raw
  } else {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }

  const { error } = await supabase
    .from('profiles')
    .update({ avatar_url: avatar })
    .eq('id', user.id)

  if (error) {
    // The migration adding profiles.avatar_url has not been run yet — say so
    // plainly instead of failing with a generic message.
    const missing = /avatar_url/.test(error.message) && /column|schema cache/i.test(error.message)
    return NextResponse.json(
      { error: missing ? 'column_missing' : 'update_failed' },
      { status: missing ? 501 : 500 },
    )
  }

  return NextResponse.json({ ok: true, avatar })
}
