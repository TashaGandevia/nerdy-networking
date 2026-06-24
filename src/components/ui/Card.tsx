// NOC panel card — dark surface with border, optional accent stripe

import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  /** Tailwind color class for the left accent stripe, e.g. 'bg-module-a' */
  accentColor?: string
  onClick?: () => void
}

/**
 * Styled card container for NOC panels and module tiles.
 *
 * @param accentColor - Optional left-border accent (Tailwind bg-* class)
 * @param onClick     - If provided, renders as a clickable card with hover state
 */
export function Card({ children, className = '', accentColor, onClick }: CardProps) {
  const clickable = !!onClick

  return (
    <div
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={clickable ? (e) => e.key === 'Enter' && onClick?.() : undefined}
      className={[
        'noc-card relative overflow-hidden',
        accentColor ? 'pl-1' : '',
        clickable
          ? 'cursor-pointer transition-colors hover:border-noc-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-packet'
          : '',
        className,
      ].join(' ')}
    >
      {accentColor && (
        <div className={`absolute inset-y-0 left-0 w-1 ${accentColor}`} />
      )}
      <div className={accentColor ? 'pl-3' : ''}>{children}</div>
    </div>
  )
}
