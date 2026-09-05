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

/* ------------------------------------------------------------------ search
   Half the Spanish terms carry accents ("Acreción", "Cláusula de aceleración").
   Nobody types those on a US keyboard, so every comparison runs on a
   diacritic-stripped, lower-cased copy of the text. `foldMap` keeps an index
   back into the ORIGINAL string so matches can still be highlighted in place. */

function fold(s: string): string {
  return (s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

function foldMap(s: string): { folded: string; map: number[] } {
  let folded = ''
  const map: number[] = []
  for (let i = 0; i < s.length; i++) {
    const piece = fold(s[i])
    for (const ch of piece) { folded += ch; map.push(i) }
  }
  return { folded, map }
}

/** Original-string [start, end) ranges covering every token hit. */
function matchRanges(text: string, tokens: string[]): Array<[number, number]> {
  if (!text || tokens.length === 0) return []
  const { folded, map } = foldMap(text)
  const hits: Array<[number, number]> = []

  for (const tok of tokens) {
    let from = 0
    for (;;) {
      const at = folded.indexOf(tok, from)
      if (at === -1) break
      const start = map[at]
      const end   = (map[at + tok.length - 1] ?? map[map.length - 1]) + 1
      hits.push([start, end])
      from = at + tok.length
    }
  }

  hits.sort((a, b) => a[0] - b[0])
  const merged: Array<[number, number]> = []
  for (const [s, e] of hits) {
    const last = merged[merged.length - 1]
    if (last && s <= last[1]) last[1] = Math.max(last[1], e)
    else merged.push([s, e])
  }
  return merged
}

function Highlight({ text, tokens }: { text: string; tokens: string[] }) {
  const ranges = matchRanges(text, tokens)
  if (ranges.length === 0) return <>{text}</>

  const out: React.ReactNode[] = []
  let cursor = 0
  ranges.forEach(([s, e], i) => {
    if (s > cursor) out.push(text.slice(cursor, s))
    out.push(
      <mark
        key={i}
        style={{
          background: 'rgba(79,142,247,0.28)',
          color: 'inherit',
          borderRadius: 3,
          padding: '0 1px',
        }}
      >
        {text.slice(s, e)}
      </mark>
    )
    cursor = e
  })
  if (cursor < text.length) out.push(text.slice(cursor))
  return <>{out}</>
}

export default function GlossaryClient({ terms, initialLang }: Props) {
  const [lang, setLang]     = useState<'en' | 'es'>(initialLang)
  const [search, setSearch] = useState('')

  // Every token must match somewhere — so "net listing" and "listing net" both work.
  const tokens = useMemo(
    () => fold(search).split(/\s+/).filter(Boolean),
    [search]
  )
  const searching = tokens.length > 0

  // Pre-fold once per term instead of on every keystroke × 129 terms.
  const indexed = useMemo(
    () => terms.map((t) => {
      const en = fold(t.term_en)
      const es = fold(t.term_es ?? '')
      return {
        t, en, es,
        termHay: `${en} ${es}`,
        defHay:  fold(`${t.definition_en} ${t.definition_es ?? ''}`),
      }
    }),
    [terms]
  )

  /* Ranked: name-prefix hits first, then other name hits, then definition-only
     hits. Without this, searching "title" buries "Title Insurance" under a
     dozen definitions that merely mention the word. */
  const results = useMemo(() => {
    if (!searching) return indexed.map(({ t }) => t)
    const q = fold(search.trim())

    return indexed
      .filter(({ termHay, defHay }) => {
        const all = `${termHay} ${defHay}`
        return tokens.every((tok) => all.includes(tok))
      })
      .map((row) => {
        const exact  = row.en === q || row.es === q
        const prefix = row.en.startsWith(q) || row.es.startsWith(q)
        const inTerm = tokens.every((tok) => row.termHay.includes(tok))
        const score  = exact ? 0 : prefix ? 1 : inTerm ? 2 : 3
        return { ...row, score }
      })
      .sort((a, b) => a.score - b.score || a.t.term_en.localeCompare(b.t.term_en))
      .map((row) => row.t)
  }, [indexed, tokens, searching, search])

  // Letter index only when browsing; a ranked result list must not be re-sorted.
  const grouped = useMemo(() => {
    if (searching) return null
    const g: Record<string, GlossaryTerm[]> = {}
    for (const t of results) {
      const letter = (t.term_en[0] ?? '#').toUpperCase()
      ;(g[letter] ??= []).push(t)
    }
    return g
  }, [results, searching])

  const renderTerm = (t: GlossaryTerm, showRule: boolean) => {
    const def = lang === 'es'
      ? (t.definition_es || t.definition_en)
      : (t.definition_en || t.definition_es || '')

    return (
      <article
        key={t.id}
        style={{ padding: '14px 0', borderTop: showRule ? '1px solid var(--border)' : 'none' }}
      >
        <h3 style={{ margin: '0 0 6px', fontSize: '1rem', fontWeight: 700, color: 'var(--text)', lineHeight: 1.35 }}>
          <Highlight text={t.term_en} tokens={tokens} />
          {t.term_es && (
            <span style={{ color: 'var(--accent)', fontWeight: 600 }}>
              {' / '}<Highlight text={t.term_es} tokens={tokens} />
            </span>
          )}
        </h3>
        <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--text2)' }}>
          <Highlight text={def} tokens={tokens} />
        </p>
      </article>
    )
  }

  return (
    <div style={{ maxWidth: 780, margin: '0 auto', padding: '24px 16px 32px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 18 }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text)', margin: 0, letterSpacing: '-0.01em' }}>
            {lang === 'es' ? 'Glosario' : 'Glossary'}
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text3)', margin: '4px 0 0' }}>
            {searching
              ? `${results.length} ${lang === 'es' ? 'de' : 'of'} ${terms.length} ${lang === 'es' ? 'términos' : 'terms'}`
              : `${terms.length} ${lang === 'es' ? 'términos' : 'terms'}`}
          </p>
        </div>

        <div style={{
          display: 'inline-flex', flexShrink: 0, padding: 3, gap: 2,
          background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
        }}>
          {(['en', 'es'] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              aria-pressed={lang === l}
              style={{
                border: 'none', cursor: 'pointer', padding: '5px 12px',
                borderRadius: 'var(--radius-xs)', fontSize: '0.75rem',
                fontWeight: 800, letterSpacing: '0.04em',
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
          type="text"
          inputMode="search"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={lang === 'es' ? 'Buscar término…' : 'Search terms…'}
          className="input"
          /* 16px keeps iOS Safari from zooming the page on focus */
          style={{ width: '100%', paddingLeft: 40, paddingRight: search ? 40 : 12, fontSize: 16 }}
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            aria-label={lang === 'es' ? 'Limpiar búsqueda' : 'Clear search'}
            style={{
              position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 26, height: 26, borderRadius: '50%', border: 'none',
              background: 'var(--surface3)', color: 'var(--text2)', cursor: 'pointer',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Results */}
      {searching ? (
        <div>{results.map((t, i) => renderTerm(t, i !== 0))}</div>
      ) : (
        Object.keys(grouped ?? {}).sort().map((letter) => (
          <section key={letter} style={{ marginBottom: 26 }}>
            <h2 style={{
              fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.14em',
              color: 'var(--accent)', textTransform: 'uppercase',
              margin: '0 0 10px', paddingBottom: 6, borderBottom: '1px solid var(--border)',
            }}>
              {letter}
            </h2>
            <div>{grouped![letter].map((t, i) => renderTerm(t, i !== 0))}</div>
          </section>
        ))
      )}

      {searching && results.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text3)' }}>
          <p style={{ fontSize: '0.95rem', margin: '0 0 4px', color: 'var(--text2)' }}>
            {lang === 'es' ? 'Sin resultados para' : 'No results for'} “{search.trim()}”
          </p>
          <p style={{ fontSize: '0.82rem', margin: 0 }}>
            {lang === 'es'
              ? 'Puedes buscar en inglés o español, con o sin acentos.'
              : 'You can search in English or Spanish, with or without accents.'}
          </p>
        </div>
      )}
    </div>
  )
}
