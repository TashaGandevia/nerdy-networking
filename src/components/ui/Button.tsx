// Reusable button component with NOC-themed variants

import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size    = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  children: ReactNode
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:   'bg-link-packet text-noc-bg hover:bg-blue-400 focus-visible:ring-link-packet',
  secondary: 'bg-noc-border text-noc-text hover:bg-noc-muted focus-visible:ring-noc-border',
  ghost:     'bg-transparent text-noc-muted hover:text-noc-text hover:bg-noc-surface focus-visible:ring-noc-border',
  danger:    'bg-link-down text-white hover:bg-red-400 focus-visible:ring-link-down',
}

const SIZE_CLASSES: Record<Size, string> = {
  sm:  'px-3 py-1.5 text-xs',
  md:  'px-4 py-2 text-sm',
  lg:  'px-6 py-3 text-base',
}

/**
 * NOC-themed button.
 *
 * @param variant - Visual style: primary | secondary | ghost | danger
 * @param size    - sm | md | lg
 */
export function Button({
  variant = 'primary',
  size    = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={[
        'inline-flex items-center justify-center gap-2 rounded font-medium',
        'transition-colors duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-noc-bg',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </button>
  )
}
