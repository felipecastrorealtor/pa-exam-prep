'use client'

import Link from 'next/link'
import { PA_CONTENT } from '@/lib/content/pa-law'

const S = { fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, strokeWidth: 1.7 }

function Icon({ name }: { name: string }) {
  const c = 'var(--accent)'
  const paths: Record<string, React.ReactNode> = {
    scale: (<>
      <path d="M12 3v18M7 21h10" stroke={c} {...S}/>
      <path d="M5 7h14M5 7l-3 6h6l-3-6zM19 7l-3 6h6l-3-6z" stroke={c} {...S}/>
    </>),
    clipboard: (<>
      <path d="M9 4H7a2 2 0 00-2 2v13a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2h-2" stroke={c} {...S}/>
      <rect x="9" y="2" width="6" height="4" rx="1" stroke={c} {...S}/>
      <path d="M9 11h6M9 15h4" stroke={c} {...S}/>
    </>),
    handshake: (<>
      <path d="M11 17l-2 2a1.5 1.5 0 01-2.1-2.1L9 15" stroke={c} {...S}/>
      <path d="M3 10l4-4 3 1 4-1 4 3 3 1v5l-3 3-4-3-3 2-4-3z" stroke={c} {...S}/>
    </>),
    money: (<>
      <circle cx="12" cy="12" r="9" stroke={c} {...S}/>
      <path d="M12 6v12M15 9c0-1.1-1.3-2-3-2s-3 .9-3 2 1.3 2 3 2 3 .9 3 2-1.3 2-3 2-3-.9-3-2" stroke={c} {...S}/>
    </>),
    home: (<>
      <path d="M3 11l9-7 9 7v9a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke={c} {...S}/>
      <path d="M9 22v-8h6v8" stroke={c} {...S}/>
    </>),
    document: (<>
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke={c} {...S}/>
      <path d="M14 2v6h6M8 13h8M8 17h5" stroke={c} {...S}/>
    </>),
    target: (<>
      <circle cx="12" cy="12" r="9" stroke={c} {...S}/>
      <circle cx="12" cy="12" r="5" stroke={c} {...S}/>
      <circle cx="12" cy="12" r="1.6" fill={c} stroke="none"/>
    </>),
    radiation: (<>
      <circle cx="12" cy="12" r="9" stroke={c} {...S}/>
      <circle cx="12" cy="12" r="2" stroke={c} {...S}/>
      <path d="M12 10V3M10.3 13.2L4.2 17M13.7 13.2l6.1 3.8" stroke={c} {...S}/>
    </>),
    map: (<>
      <path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2z" stroke={c} {...S}/>
      <path d="M9 4v14M15 6v14" stroke={c} {...S}/>
    </>),
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
      {paths[name] ?? paths.document}
    </svg>
  )
}

export default function PALawPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icon name="scale" />
          <div>
            <h1 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
              Ley de Pennsylvania
            </h1>
            <p style={{ fontSize: '0.75rem', color: 'var(--text3)', margin: 0 }}>
              {PA_CONTENT.length} secciones · {PA_CONTENT.reduce((n, s) => n + s.facts.length, 0)} datos clave
            </p>
          </div>
        </div>
        <Link href="/study/12" className="btn btn-primary" style={{ fontSize: '0.8rem', whiteSpace: 'nowrap', padding: '8px 14px' }}>
          Practicar →
        </Link>
      </div>

      {/* Sections */}
      {PA_CONTENT.map((section) => (
        <div key={section.title} className="card" style={{ padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <Icon name={section.icon} />
            <h2 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text)', margin: 0, lineHeight: 1.35 }}>
              {section.title}
            </h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {section.facts.map((fact, i) => (
              <div key={i} style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                <span style={{ color: 'var(--accent)', fontSize: '0.8rem', lineHeight: 1.6, flexShrink: 0 }}>▸</span>
                <p style={{ fontSize: '0.84rem', color: 'var(--text2)', lineHeight: 1.6, margin: 0 }}>{fact}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
