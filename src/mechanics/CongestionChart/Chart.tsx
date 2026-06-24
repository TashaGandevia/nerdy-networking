// Shared SVG chart for cwnd-over-RTT plots used by every Congestion Chart mode.

import type { SimEvent, FlowSeries } from './simulator'

interface ChartProps {
  flows:        FlowSeries[]
  totalRtts:    number
  yMax?:        number
  events?:      SimEvent[]
  /** Only render points up to this RTT (for animated reveal). */
  revealUntil?: number
  /** Optional click handler — receives the RTT clicked on. */
  onClick?:     (rtt: number) => void
  /** Vertical marker the player has placed (Predict mode). */
  marker?:      { rtt: number; label?: string } | null
  height?:      number
}

const FLOW_COLORS = ['#58a6ff', '#3fb950', '#d29922', '#f85149', '#a371f7']
const EVENT_COLOR: Record<SimEvent['kind'], string> = {
  'three-dup-ack': '#d29922',
  'timeout':       '#f85149',
  'ecn-mark':      '#3fb950',
}

export function Chart({
  flows, totalRtts, yMax, events = [], revealUntil, onClick, marker, height = 200,
}: ChartProps) {
  const W = 640, H = height, PAD = { top: 12, right: 16, bottom: 28, left: 40 }
  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top  - PAD.bottom

  // Derive yMax from data if not provided.
  const dataMax = Math.max(
    1,
    ...flows.flatMap((f) => f.cwnd),
  )
  const yTop = yMax ?? Math.ceil(dataMax * 1.2)

  const reveal = revealUntil ?? totalRtts

  function toX(rtt: number)   { return PAD.left + (rtt / Math.max(1, totalRtts - 1)) * innerW }
  function toY(cwnd: number)  { return PAD.top  + innerH - (cwnd / yTop) * innerH }

  function handleClick(e: React.MouseEvent<SVGSVGElement>) {
    if (!onClick) return
    const svg = e.currentTarget
    const pt  = svg.createSVGPoint()
    pt.x = e.clientX
    pt.y = e.clientY
    const ctm = svg.getScreenCTM()
    if (!ctm) return
    const loc = pt.matrixTransform(ctm.inverse())
    const rtt = Math.round(((loc.x - PAD.left) / innerW) * (totalRtts - 1))
    onClick(Math.max(0, Math.min(totalRtts - 1, rtt)))
  }

  // Y-axis ticks: pick 5 evenly spaced
  const yTicks = Array.from({ length: 5 }, (_, i) => Math.round((yTop * i) / 4))
  const xTicks = Array.from({ length: 6 }, (_, i) => Math.round((totalRtts * i) / 5))

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={`w-full border border-noc-border rounded bg-noc-bg ${onClick ? 'cursor-crosshair' : ''}`}
      onClick={handleClick}
      aria-label="CongWin vs time chart"
    >
      {/* Axes */}
      <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={H - PAD.bottom} stroke="#30363d" />
      <line x1={PAD.left} y1={H - PAD.bottom} x2={W - PAD.right} y2={H - PAD.bottom} stroke="#30363d" />

      {/* Y ticks + gridlines */}
      {yTicks.map((v) => (
        <g key={`y-${v}`}>
          <line x1={PAD.left} y1={toY(v)} x2={W - PAD.right} y2={toY(v)} stroke="#21262d" />
          <text x={PAD.left - 6} y={toY(v) + 1} textAnchor="end" dominantBaseline="middle" fill="#6e7681" fontSize={9} fontFamily="monospace">{v}</text>
        </g>
      ))}

      {/* X ticks */}
      {xTicks.map((v) => (
        <g key={`x-${v}`}>
          <line x1={toX(v)} y1={H - PAD.bottom} x2={toX(v)} y2={H - PAD.bottom + 3} stroke="#30363d" />
          <text x={toX(v)} y={H - PAD.bottom + 12} textAnchor="middle" fill="#6e7681" fontSize={9} fontFamily="monospace">{v}</text>
        </g>
      ))}

      {/* Axis labels */}
      <text x={PAD.left - 2} y={PAD.top - 2} fill="#8b949e" fontSize={9} fontFamily="monospace">CW</text>
      <text x={W / 2} y={H - 4} textAnchor="middle" fill="#8b949e" fontSize={9} fontFamily="monospace">RTT</text>

      {/* One polyline per flow */}
      {flows.map((f, i) => {
        const pts = f.cwnd.slice(0, reveal + 1)
          .map((c, t) => `${toX(t)},${toY(c)}`)
          .join(' ')
        return (
          <polyline
            key={i}
            points={pts}
            fill="none"
            stroke={FLOW_COLORS[i % FLOW_COLORS.length]}
            strokeWidth={1.8}
          />
        )
      })}

      {/* Event markers */}
      {events.filter((e) => e.rtt <= reveal).map((e, idx) => {
        const cwnd = flows[e.flowIdx]?.cwnd[e.rtt] ?? 0
        return (
          <g key={`evt-${idx}`}>
            <line
              x1={toX(e.rtt)} x2={toX(e.rtt)}
              y1={toY(cwnd)} y2={H - PAD.bottom}
              stroke={EVENT_COLOR[e.kind]}
              strokeDasharray="2 2"
              strokeWidth={1}
              opacity={0.6}
            />
            <circle cx={toX(e.rtt)} cy={toY(cwnd)} r={3} fill={EVENT_COLOR[e.kind]} />
          </g>
        )
      })}

      {/* Player marker */}
      {marker && (
        <g>
          <line
            x1={toX(marker.rtt)} x2={toX(marker.rtt)}
            y1={PAD.top} y2={H - PAD.bottom}
            stroke="#a371f7" strokeWidth={2}
          />
          <text
            x={toX(marker.rtt) + 4}
            y={PAD.top + 10}
            fill="#a371f7"
            fontSize={10}
            fontFamily="monospace"
          >
            {marker.label ?? `t=${marker.rtt}`}
          </text>
        </g>
      )}
    </svg>
  )
}

export { FLOW_COLORS }
