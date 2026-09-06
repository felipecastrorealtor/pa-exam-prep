'use client'

import type { CSSProperties } from 'react'

/**
 * Profile avatars.
 *
 * A person can either pick one of the presets below (stored as `preset:<id>`)
 * or upload a photo, which the picker downscales to a small square JPEG data
 * URL before saving — so no storage bucket is needed and the value is just a
 * string on the profile row.
 */

export type PresetId =
  | 'house' | 'key'   | 'compass' | 'summit'
  | 'wave'  | 'leaf'  | 'prism'   | 'star'
  | 'moon'  | 'sun'   | 'bolt'    | 'orbit'

export const PRESET_IDS: PresetId[] = [
  'house', 'key', 'compass', 'summit',
  'wave', 'leaf', 'prism', 'star',
  'moon', 'sun', 'bolt', 'orbit',
]

/** Each preset owns a gradient, so the grid reads as twelve distinct choices. */
const GRAD: Record<PresetId, [string, string]> = {
  house:   ['#4f8ef7', '#7c5cfc'],
  key:     ['#fbbf24', '#f59e0b'],
  compass: ['#06b6d4', '#0ea5e9'],
  summit:  ['#34d399', '#059669'],
  wave:    ['#38bdf8', '#3b82f6'],
  leaf:    ['#86efac', '#16a34a'],
  prism:   ['#c084fc', '#7c3aed'],
  star:    ['#fde68a', '#f59e0b'],
  moon:    ['#a5b4fc', '#4f46e5'],
  sun:     ['#fca5a5', '#f97316'],
  bolt:    ['#facc15', '#ea580c'],
  orbit:   ['#f472b6', '#db2777'],
}

/* Glyphs are drawn on a 40×40 grid, in white over the gradient disc. */
function Glyph({ id }: { id: PresetId }) {
  const s = { stroke: '#fff', strokeWidth: 2, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  switch (id) {
    case 'house':
      return (
        <g>
          <path d="M11 20 L20 12 L29 20" {...s} />
          <path d="M13.5 19 L13.5 28 L26.5 28 L26.5 19" {...s} />
          <rect x="18" y="23" width="4" height="5" fill="#fff" opacity="0.9" />
        </g>
      )
    case 'key':
      return (
        <g>
          <circle cx="16" cy="17" r="4.5" {...s} />
          <path d="M19 20 L27 28" {...s} />
          <path d="M24 25 L26.5 22.5" {...s} />
        </g>
      )
    case 'compass':
      return (
        <g>
          <circle cx="20" cy="20" r="9" {...s} />
          <path d="M24 16 L18.5 18.5 L16 24 L21.5 21.5 Z" fill="#fff" />
        </g>
      )
    case 'summit':
      return (
        <g>
          <path d="M10 27 L17 16 L21 22 L24 18 L30 27 Z" {...s} />
          <path d="M15 20.5 L19 20.5" {...s} strokeWidth={1.5} />
        </g>
      )
    case 'wave':
      return (
        <g>
          <path d="M10 18 Q15 13 20 18 T30 18" {...s} />
          <path d="M10 24 Q15 19 20 24 T30 24" {...s} opacity={0.75} />
        </g>
      )
    case 'leaf':
      return (
        <g>
          <path d="M12 28 Q12 14 28 12 Q28 27 12 28 Z" {...s} />
          <path d="M14 26 L25 15" {...s} strokeWidth={1.5} />
        </g>
      )
    case 'prism':
      return (
        <g>
          <path d="M20 11 L29 27 L11 27 Z" {...s} />
          <path d="M20 11 L20 27" {...s} strokeWidth={1.5} opacity={0.8} />
        </g>
      )
    case 'star':
      return (
        <path
          d="M20 11 L22.6 17.6 L29.6 18 L24.2 22.5 L26 29.3 L20 25.4 L14 29.3 L15.8 22.5 L10.4 18 L17.4 17.6 Z"
          fill="#fff"
        />
      )
    case 'moon':
      return <path d="M25 11 A9 9 0 1 0 29 22 A7 7 0 0 1 25 11 Z" fill="#fff" />
    case 'sun':
      return (
        <g>
          <circle cx="20" cy="20" r="5.5" fill="#fff" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => {
            const r = (a * Math.PI) / 180
            return (
              <line
                key={a}
                x1={20 + Math.cos(r) * 8}  y1={20 + Math.sin(r) * 8}
                x2={20 + Math.cos(r) * 11} y2={20 + Math.sin(r) * 11}
                stroke="#fff" strokeWidth={2} strokeLinecap="round"
              />
            )
          })}
        </g>
      )
    case 'bolt':
      return <path d="M23 10 L13 22 L19 22 L17 30 L27 18 L21 18 Z" fill="#fff" />
    case 'orbit':
      return (
        <g>
          <circle cx="20" cy="20" r="4" fill="#fff" />
          <ellipse cx="20" cy="20" rx="11" ry="5" {...s} transform="rotate(-25 20 20)" />
          <circle cx="29" cy="15" r="2" fill="#fff" />
        </g>
      )
  }
}

export function PresetAvatar({ id, size = 60 }: { id: PresetId; size?: number }) {
  const [from, to] = GRAD[id]
  const gid = `av-${id}`
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" style={{ display: 'block' }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={from} />
          <stop offset="100%" stopColor={to} />
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="20" fill={`url(#${gid})`} />
      <Glyph id={id} />
    </svg>
  )
}

export function isPreset(v: string | null | undefined): v is string {
  return typeof v === 'string' && v.startsWith('preset:')
}

export function presetIdOf(v: string): PresetId {
  const id = v.slice('preset:'.length) as PresetId
  return PRESET_IDS.includes(id) ? id : 'house'
}

export default function Avatar({
  value,
  fallback,
  size = 60,
  style,
}: {
  value?: string | null
  fallback: string
  size?: number
  style?: CSSProperties
}) {
  const box: CSSProperties = {
    width: size, height: size, borderRadius: '50%', flexShrink: 0,
    overflow: 'hidden', display: 'block', ...style,
  }

  if (isPreset(value)) {
    return (
      <div style={box}>
        <PresetAvatar id={presetIdOf(value)} size={size} />
      </div>
    )
  }

  if (value) {
    return (
      // A data: URL from the picker — next/image cannot optimise it.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={value} alt="" style={{ ...box, objectFit: 'cover' }} />
    )
  }

  return (
    <div
      style={{
        ...box,
        background: 'linear-gradient(135deg,var(--accent),var(--accent2))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.4, fontWeight: 800, color: '#fff',
      }}
    >
      {(fallback || '?')[0].toUpperCase()}
    </div>
  )
}
