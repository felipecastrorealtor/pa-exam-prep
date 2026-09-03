'use client'

import { useState, useMemo } from 'react'
import clsx from 'clsx'

interface GlossaryTerm {
  id: string
  term_en: string
  term_es: string | null
  definition_en: string
  definition_es: string | null
  category: string | null
}

interface Props {
  terms: GlossaryTerm[]
  initialLang: 'en' | 'es'
}

export default function GlossaryClient({ terms, initialLang }: Props) {
  const [lang, setLang]     = useState<'en' | 'es'>(initialLang)
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(terms.map((t) => t.category).filter(Boolean)))],
    [terms]
  )
  const [cat, setCat] = useState('All')

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return terms.filter((t) => {
      const matchCat = cat === 'All' || t.category === cat
      const term = lang === 'es' && t.term_es ? t.term_es : t.term_en
      const def  = lang === 'es' && t.definition_es ? t.definition_es : t.definition_en
      const matchSearch = !q || term.toLowerCase().includes(q) || def.toLowerCase().includes(q)
      return matchCat && matchSearch
    })
  }, [terms, search, cat, lang])

  // Group by first letter
  const grouped = useMemo(() => {
    const g: Record<string, GlossaryTerm[]> = {}
    for (const t of filtered) {
      const term  = lang === 'es' && t.term_es ? t.term_es : t.term_en
      const letter = term[0]?.toUpperCase() ?? '#'
      ;(g[letter] ??= []).push(t)
    }
    return g
  }, [filtered, lang])

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {lang === 'es' ? 'Glosario' : 'Glossary'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {filtered.length} {lang === 'es' ? 'términos' : 'terms'}
          </p>
        </div>
        <button
          onClick={() => setLang((l) => l === 'en' ? 'es' : 'en')}
          className="text-xs font-bold px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          {lang === 'en' ? 'Español' : 'English'}
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={lang === 'es' ? 'Buscar término…' : 'Search terms…'}
          className="input w-full pl-9"
        />
      </div>

      {/* Category filter */}
      {categories.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c!)}
              className={clsx(
                'text-xs px-3 py-1 rounded-full border transition-colors font-medium',
                cat === c
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                  : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
              )}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {/* Terms */}
      {Object.keys(grouped).sort().map((letter) => (
        <div key={letter} className="space-y-2">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            {letter}
          </h2>
          <div className="space-y-1">
            {grouped[letter].map((term) => {
              const termText = lang === 'es' && term.term_es ? term.term_es : term.term_en
              const defText  = lang === 'es' && term.definition_es ? term.definition_es : term.definition_en
              const isOpen   = expanded === term.id

              return (
                <button
                  key={term.id}
                  onClick={() => setExpanded(isOpen ? null : term.id)}
                  className="w-full text-left card px-4 py-3 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium text-gray-900 dark:text-white text-sm">
                      {termText}
                    </span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {term.category && (
                        <span className="text-xs text-gray-400 hidden sm:block">
                          {term.category}
                        </span>
                      )}
                      <svg
                        className={clsx('w-4 h-4 text-gray-400 transition-transform', isOpen && 'rotate-180')}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  {isOpen && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 leading-relaxed text-left">
                      {defText}
                    </p>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-3">🔍</p>
          <p>{lang === 'es' ? 'Sin resultados' : 'No results found'}</p>
        </div>
      )}
    </div>
  )
}
