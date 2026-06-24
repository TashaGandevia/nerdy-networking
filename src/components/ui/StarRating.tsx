// Star rating display (1–3 stars) used on level cards and level completion screens

import type { StarCount } from '@/types'

interface StarRatingProps {
  /** Stars earned (1–3), or null if the level has never been completed */
  stars: StarCount | null
  /** Total stars possible (always 3 in this game) */
  max?: number
  size?: 'sm' | 'md' | 'lg'
}

const SIZE_PX: Record<string, number> = { sm: 14, md: 18, lg: 24 }

/**
 * Renders 1–3 star glyphs; filled stars = earned, hollow = not yet.
 *
 * @param stars - Stars earned this level (null = not completed)
 * @param max   - Maximum stars (default 3)
 * @param size  - Glyph size variant
 */
export function StarRating({ stars, max = 3, size = 'md' }: StarRatingProps) {
  const px = SIZE_PX[size]

  return (
    <span className="inline-flex gap-0.5" aria-label={`${stars ?? 0} of ${max} stars`}>
      {Array.from({ length: max }, (_, i) => {
        const filled = stars !== null && i < stars
        return (
          <svg
            key={i}
            width={px} height={px}
            viewBox="0 0 24 24"
            fill={filled ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth={1.8}
            className={filled ? 'text-yellow-400' : 'text-noc-border'}
          >
            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
          </svg>
        )
      })}
    </span>
  )
}
