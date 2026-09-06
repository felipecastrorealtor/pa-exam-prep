import type { CSSProperties } from 'react'

/**
 * Flags for the language switch.
 *
 * Emoji flags don't render at all on Windows and look pasted-on everywhere
 * else, so these are drawn: a rounded 3:2 rectangle with a hairline border,
 * which keeps them legible at 18px next to the label.
 */
export type FlagCode = 'us' | 'es'

export default function Flag({
  code,
  width = 22,
  style,
}: {
  code: FlagCode
  width?: number
  style?: CSSProperties
}) {
  const h = Math.round((width * 2) / 3)
  const common = {
    width,
    height: h,
    style: { display: 'inline-block', verticalAlign: '-3px', borderRadius: 3, ...style },
    viewBox: '0 0 30 20',
    role: 'img' as const,
    'aria-hidden': true,
  }
  const clip = `flag-clip-${code}`

  if (code === 'us') {
    return (
      <svg {...common}>
        <defs>
          <clipPath id={clip}>
            <rect width="30" height="20" rx="2.5" />
          </clipPath>
        </defs>
        <g clipPath={`url(#${clip})`}>
          <rect width="30" height="20" fill="#fff" />
          {[0, 2, 4, 6, 8, 10, 12].map((i) => (
            <rect key={i} y={(i * 20) / 13} width="30" height={20 / 13} fill="#b22234" />
          ))}
          <rect width="13" height={(20 / 13) * 7} fill="#3c3b6e" />
          {/* Stars are suggested rather than counted — at this size a 50-star
              field turns to mush; a small grid of dots reads correctly. */}
          {[0, 1, 2, 3].map((r) =>
            [0, 1, 2, 3, 4].map((c) => (
              <circle
                key={`${r}-${c}`}
                cx={1.6 + c * 2.6 + (r % 2 ? 1.3 : 0)}
                cy={1.7 + r * 2.4}
                r="0.62"
                fill="#fff"
              />
            )),
          )}
        </g>
        <rect width="30" height="20" rx="2.5" fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth="0.8" />
      </svg>
    )
  }

  return (
    <svg {...common}>
      <defs>
        <clipPath id={clip}>
          <rect width="30" height="20" rx="2.5" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clip})`}>
        <rect width="30" height="20" fill="#c60b1e" />
        <rect y="5" width="30" height="10" fill="#ffc400" />
        {/* The coat of arms, reduced to the crowned pillar silhouette. */}
        <g fill="#c60b1e" opacity="0.9">
          <rect x="7" y="8" width="1.5" height="4.6" rx="0.5" />
          <rect x="10" y="8" width="1.5" height="4.6" rx="0.5" />
          <rect x="6.3" y="7.2" width="2.9" height="1" rx="0.4" />
          <rect x="9.3" y="7.2" width="2.9" height="1" rx="0.4" />
        </g>
      </g>
      <rect width="30" height="20" rx="2.5" fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth="0.8" />
    </svg>
  )
}
