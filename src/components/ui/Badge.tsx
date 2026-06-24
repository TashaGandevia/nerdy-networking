// Small status badge — used for difficulty labels, module tags, link state

import type { ReactNode } from 'react'

type BadgeVariant = 'up' | 'congested' | 'down' | 'idle' | 'packet' | 'neutral'

interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
  className?: string
}

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  up:        'bg-link-up/15 text-link-up border-link-up/30',
  congested: 'bg-link-congested/15 text-link-congested border-link-congested/30',
  down:      'bg-link-down/15 text-link-down border-link-down/30',
  packet:    'bg-link-packet/15 text-link-packet border-link-packet/30',
  idle:      'bg-noc-border/20 text-noc-muted border-noc-border/30',
  neutral:   'bg-noc-surface text-noc-text border-noc-border',
}

/**
 * Pill-shaped label badge with a network-state colour variant.
 *
 * @param variant - Semantic colour: up | congested | down | idle | packet | neutral
 */
export function Badge({ children, variant = 'neutral', className = '' }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium font-mono',
        VARIANT_CLASSES[variant],
        className,
      ].join(' ')}
    >
      {children}
    </span>
  )
}
