import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import GlossaryClient from '@/components/glossary/GlossaryClient'

export const metadata: Metadata = { title: 'Glossary — PA Exam Prep' }

export default async function GlossaryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: terms } = await supabase
    .from('glossary_terms')
    .select('id, slug, term_en, term_es, definition_en, definition_es')
    .order('term_en')

  const { data: profile } = await supabase
    .from('profiles')
    .select('preferred_lang')
    .eq('id', user.id)
    .single()

  const lang = (profile?.preferred_lang as 'en' | 'es') ?? 'en'

  // The table has no category column; the client treats it as optional.
  const rows = (terms ?? []).map((t: Record<string, any>) => ({ ...t, category: null }))

  return <GlossaryClient terms={rows} initialLang={lang} />
}
