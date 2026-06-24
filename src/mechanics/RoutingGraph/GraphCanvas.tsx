// Shared SVG renderer for routing-graph modes. Draws nodes + weighted edges,
// optionally highlights a path and per-node distances.

import type { Graph } from '@/utils/graph'

export interface NodePos { id: string; label: string; x: number; y: number }

interface Props {
  nodes:       NodePos[]
  graph:       Graph
  /** Edges along the highlighted path (set of "from:to" or "to:from"). */
  highlight?:  Set<string>
  /** Per-node label below the circle (e.g. distance). */
  distances?:  Record<string, number | string>
  /** Currently-selected node (for click building). */
  selected?:   string | null
  onClickNode?: (id: string) => void
}

const W = 640, H = 320

function edgeKey(a: string, b: string) {
  return [a, b].sort().join(':')
}

export function GraphCanvas({ nodes, graph, highlight, distances, selected, onClickNode }: Props) {
  const pos = Object.fromEntries(nodes.map((n) => [n.id, n]))

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full border border-noc-border rounded bg-noc-bg" aria-label="Routing graph">
      {graph.edges.map((e) => {
        const a = pos[e.from], b = pos[e.to]
        if (!a || !b) return null
        const key   = edgeKey(e.from, e.to)
        const onPath = highlight?.has(key)
        const stroke = !e.up        ? '#f78166'
                     : onPath        ? '#3fb950'
                                     : '#4d5566'
        const dash   = !e.up ? '6 4' : undefined
        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2
        return (
          <g key={key}>
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={stroke} strokeWidth={onPath ? 3 : 2} strokeDasharray={dash} />
            <text x={mx} y={my - 6} textAnchor="middle" fill="#8b949e" fontSize={10} fontFamily="monospace">
              {e.weight}
            </text>
          </g>
        )
      })}

      {nodes.map((n) => {
        const isSelected = selected === n.id
        const d          = distances?.[n.id]
        return (
          <g key={n.id} style={{ cursor: onClickNode ? 'pointer' : 'default' }}
             onClick={() => onClickNode?.(n.id)}>
            <circle cx={n.x} cy={n.y} r={22}
              fill={isSelected ? '#1f2937' : '#161b22'}
              stroke={isSelected ? '#f0f6fc' : '#30363d'}
              strokeWidth={isSelected ? 2.5 : 2}
            />
            <text x={n.x} y={n.y + 1} textAnchor="middle" dominantBaseline="middle"
              fill="#c9d1d9" fontSize={13} fontWeight={600} fontFamily="Inter, sans-serif">
              {n.label}
            </text>
            {d !== undefined && (
              <text x={n.x} y={n.y + 38} textAnchor="middle" fill="#8b949e" fontSize={10} fontFamily="monospace">
                {d}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

export { edgeKey }
