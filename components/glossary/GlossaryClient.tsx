'use client'

import { useState, useMemo } from 'react'

interface GlossaryTerm {
  id: string
  term_en: string
  term_es: string | null
  definition_en: string
  definition_es: string | null
  category?: string | null
}

interface Props {
  terms: GlossaryTerm[]
  initialLang: 'en' | 'es'
}

export default function GlossaryClient({ terms, initialLang }: Props) {
  const [lang, setLang]     = useState<'en' | 'es'>(initialLang)
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return terms
    return terms.filter((t) =>
      [t.term_en, t.term_es, t.definition_en, t.definition_es]
        .some((v) => (v ?? '').toLowerCase().includes(q))
    )
  }, [terms, search])

  // Group by first letter of the English term so the index is stable in both languages.
  const grouped = useMemo(() => {
    const g: Record<string, GlossaryTerm[]> = {}
    for (const t of filtered) {
      const letter = (t.term_en[0] ?? '#').toUpperCase()
      ;(g[letter] ??= []).push(t)
    }
    return g
  }, [filtered])

  const letters = useMemo(() => Object.keys(grouped).sort(), [grouped])

  return (
    <div style={{ maxWidth: 780, margin: '0 auto', padding: '24px 16px 32px' }}>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        gap: 16, marginBottom: 18,
      }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text)', margin: 0, letterSpacing: '-0.01em' }}>
            {lang === 'es' ? 'Glosario' : 'Glossary'}
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text3)', margin: '4px 0 0' }}>
            {filtered.length}{filtered.length !== terms.length ? ` / ${terms.length}` : ''}{' '}
            {lang === 'es' ? 'términos' : 'terms'}
          </p>
        </div>

        {/* EN | ES segmented toggle */}
        <div style={{
          display: 'inline-flex', flexShrink: 0, padding: 3, gap: 2,
          background: 'var(--surface2)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
        }}>
          {(['en', 'es'] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              aria-pressed={lang === l}
              style={{
                border: 'none', cursor: 'pointer',
                padding: '5px 12px', borderRadius: 'var(--radius-xs)',
                fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.04em',
                background: lang === l ? 'var(--accent)' : 'transparent',
                color: lang === l ? '#fff' : 'var(--text3)',
                transition: 'all 0.15s',
              }}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 22 }}>
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="var(--text3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
        >
          <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
        </svg>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={lang === 'es' ? 'Buscar término…' : 'Search terms…'}
          className="input"
          style={{ width: '100%', paddingLeft: 40 }}
        />
      </div>

      {/* Terms */}
      {letters.map((letter) => (
        <section key={letter} style={{ marginBottom: 26 }}>
          <h2 style={{
            fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.14em',
            color: 'var(--accent)', textTransform: 'uppercase',
            margin: '0 0 10px', paddingBottom: 6,
            borderBottom: '1px solid var(--border)',
          }}>
            {letter}
          </h2>

          <div>
            {grouped[letter].map((t, i) => {
              const def = lang === 'es'
                ? (t.definition_es || t.definition_en)
                : (t.definition_en || t.definition_es || '')

              return (
                <article
                  key={t.id}
                  style={{
                    padding: '14px 0',
                    borderTop: i === 0 ? 'none' : '1px solid var(--border)',
                  }}
                >
                  <h3 style={{
                    margin: '0 0 6px', fontSize: '1rem', fontWeight: 700,
                    color: 'var(--text)', lineHeight: 1.35,
                  }}>
                    {t.term_en}
                    {t.term_es && (
                      <span style={{ color: 'var(--accent)', fontWeight: 600 }}>
                        {' / '}{t.term_es}
                      </span>
                    )}
                  </h3>
                  <p style={{
                    margin: 0, fontSize: '0.9rem', lineHeight: 1.6,
                    color: 'var(--text2)',
                  }}>
                    {def}
                  </p>
                </article>
              )
            })}
          </div>
        </section>
      ))}

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text3)' }}>
          <p style={{ fontSize: '0.95rem', margin: 0 }}>
            {lang === 'es' ? 'Sin resultados' : 'No results found'}
          </p>
        </div>
      )}
    </div>
  )
}
