'use client'

import { Fragment, type ReactNode } from 'react'

/**
 * Small markdown renderer for AI answers.
 *
 * The model replies in markdown, and the chat was printing it raw — readers saw
 * literal ** and ### instead of bold text and headings. This turns the common
 * subset into React nodes (never HTML strings), so model output can never
 * inject markup.
 *
 * Handles: ### / ## / # headings, **bold**, *italic*, `code`, bullet lists,
 * numbered lists, --- rules, and blank-line paragraphs.
 */

const INLINE = /(\*\*[^*]+\*\*|\*[^*\n]+\*|`[^`\n]+`)/g

function inline(text: string, keyBase: string): ReactNode[] {
  return text.split(INLINE).filter(Boolean).map((part, i) => {
    const key = `${keyBase}-${i}`
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return <strong key={key} style={{ fontWeight: 700, color: 'var(--text)' }}>{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return <em key={key}>{part.slice(1, -1)}</em>
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code key={key} style={{
          background: 'var(--surface2)', border: '1px solid var(--border)',
          borderRadius: 4, padding: '1px 5px', fontSize: '0.86em',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        }}>
          {part.slice(1, -1)}
        </code>
      )
    }
    return <Fragment key={key}>{part}</Fragment>
  })
}

const H_SIZE: Record<number, string> = { 1: '1.05rem', 2: '0.98rem', 3: '0.92rem' }

export default function Markdown({ text }: { text: string }) {
  const lines = text.replace(/\r\n/g, '\n').split('\n')
  const out: ReactNode[] = []
  let list: { ordered: boolean; items: string[] } | null = null
  let para: string[] = []

  const flushList = () => {
    if (!list) return
    const Tag = list.ordered ? 'ol' : 'ul'
    const items = list.items
    out.push(
      <Tag key={`l${out.length}`} style={{
        margin: '6px 0', paddingLeft: 20,
        display: 'flex', flexDirection: 'column', gap: 4,
      }}>
        {items.map((it, i) => <li key={i}>{inline(it, `l${out.length}-${i}`)}</li>)}
      </Tag>
    )
    list = null
  }

  const flushPara = () => {
    if (para.length === 0) return
    const body = para.join(' ')
    out.push(
      <p key={`p${out.length}`} style={{ margin: '6px 0' }}>
        {inline(body, `p${out.length}`)}
      </p>
    )
    para = []
  }

  for (const raw of lines) {
    const line = raw.trimEnd()

    if (!line.trim()) { flushList(); flushPara(); continue }

    const h = line.match(/^(#{1,3})\s+(.*)$/)
    if (h) {
      flushList(); flushPara()
      const level = h[1].length
      out.push(
        <div key={`h${out.length}`} style={{
          fontSize: H_SIZE[level], fontWeight: 800, color: 'var(--text)',
          margin: out.length === 0 ? '0 0 6px' : '14px 0 6px', lineHeight: 1.35,
        }}>
          {inline(h[2], `h${out.length}`)}
        </div>
      )
      continue
    }

    if (/^(---+|\*\*\*+|___+)$/.test(line.trim())) {
      flushList(); flushPara()
      out.push(<hr key={`r${out.length}`} style={{ border: 0, borderTop: '1px solid var(--border)', margin: '12px 0' }} />)
      continue
    }

    const ul = line.match(/^\s*[*+-]\s+(.*)$/)
    if (ul) {
      flushPara()
      if (!list || list.ordered) { flushList(); list = { ordered: false, items: [] } }
      list.items.push(ul[1])
      continue
    }

    const ol = line.match(/^\s*\d+[.)]\s+(.*)$/)
    if (ol) {
      flushPara()
      if (!list || !list.ordered) { flushList(); list = { ordered: true, items: [] } }
      list.items.push(ol[1])
      continue
    }

    flushList()
    para.push(line.trim())
  }
  flushList(); flushPara()

  return <div style={{ display: 'flex', flexDirection: 'column' }}>{out}</div>
}
