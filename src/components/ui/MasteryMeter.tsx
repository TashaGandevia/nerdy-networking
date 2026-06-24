// Circular mastery progress ring for module cards and the sidebar

interface MasteryMeterProps {
  /** Mastery fraction 0–1 */
  value: number
  /** Ring diameter in pixels */
  size?: number
  /** Tailwind color for the filled arc, e.g. 'text-module-a' */
  colorClass?: string
  /** Whether to show the percentage label in the centre */
  showLabel?: boolean
}

/**
 * SVG donut chart used to display module mastery (0–100%).
 *
 * @param value      - Mastery fraction (0–1)
 * @param size       - Diameter in px (default 48)
 * @param colorClass - Tailwind text-color class (controls stroke via currentColor)
 * @param showLabel  - Show percentage in the centre (default true)
 */
export function MasteryMeter({
  value,
  size       = 48,
  colorClass = 'text-link-packet',
  showLabel  = true,
}: MasteryMeterProps) {
  const radius      = (size - 6) / 2
  const circumference = 2 * Math.PI * radius
  const filled      = Math.min(1, Math.max(0, value)) * circumference
  const pct         = Math.round(value * 100)

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={colorClass}>
      {/* Track */}
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={5}
        className="opacity-10"
      />
      {/* Filled arc — starts at top (−90°) */}
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={5}
        strokeDasharray={`${filled} ${circumference}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        className="transition-all duration-500"
      />
      {showLabel && (
        <text
          x={size / 2} y={size / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fill="currentColor"
          fontSize={size * 0.26}
          fontWeight={600}
          fontFamily="Inter, sans-serif"
        >
          {pct}%
        </text>
      )}
    </svg>
  )
}
