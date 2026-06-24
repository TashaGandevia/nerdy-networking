// RoutingGraph mechanic — Packet Routing + Algorithm Visualiser
// Visual: animated packet hops, forwarding table builder, Dijkstra / Bellman-Ford / BGP step-through.
// Used by: Modules A, B (intra-AS, inter-AS, SDN traffic engineering levels).

import type { Level } from '@/types'
import { dijkstra } from '@/utils/graph'
import type { Graph } from '@/utils/graph'

interface RoutingGraphProps {
  level: Level
  onComplete: (passed: boolean, hintsUsed: number) => void
}

// Sample graph used for placeholder rendering
const SAMPLE_GRAPH: Graph = {
  nodes: [
    { id: 'A', label: 'A' }, { id: 'B', label: 'B' },
    { id: 'C', label: 'C' }, { id: 'D', label: 'D' },
  ],
  edges: [
    { from: 'A', to: 'B', weight: 1, up: true },
    { from: 'B', to: 'C', weight: 2, up: true },
    { from: 'A', to: 'C', weight: 4, up: true },
    { from: 'C', to: 'D', weight: 1, up: true },
  ],
}

const NODE_POSITIONS: Record<string, [number, number]> = {
  A: [80,  180], B: [240, 80],
  C: [400, 180], D: [560, 180],
}

/**
 * Stub for the Routing Graph mechanic.
 * Will render an interactive node-link diagram with animated packet travel
 * and step-by-step Dijkstra / Bellman-Ford / BGP visualisation.
 *
 * @param level      - Level config with algorithm type, graph template, and link failures
 * @param onComplete - Callback fired when the player's forwarding table is validated
 */
export function RoutingGraph({ level, onComplete }: RoutingGraphProps) {
  const result = dijkstra(SAMPLE_GRAPH, 'A', 'D')

  return (
    <div className="noc-card p-6 flex flex-col gap-4">
      <p className="text-noc-muted text-xs uppercase tracking-widest">Mechanic — Routing Graph</p>
      <h2 className="text-noc-bright text-lg font-semibold">{level.title}</h2>
      <p className="text-noc-text text-sm">{level.intent}</p>

      {/* SVG graph placeholder */}
      <svg
        viewBox="0 0 640 280"
        className="w-full border border-noc-border rounded bg-noc-bg"
        aria-label="Routing graph (placeholder)"
      >
        {/* Edges */}
        {SAMPLE_GRAPH.edges.map((e) => {
          const [x1, y1] = NODE_POSITIONS[e.from]
          const [x2, y2] = NODE_POSITIONS[e.to]
          const mx = (x1 + x2) / 2
          const my = (y1 + y2) / 2
          const isOnPath = result?.path.includes(e.from) && result.path.includes(e.to)
          return (
            <g key={`${e.from}-${e.to}`}>
              <line
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={isOnPath ? '#3fb950' : '#30363d'}
                strokeWidth={isOnPath ? 3 : 2}
              />
              <text x={mx} y={my - 6} textAnchor="middle" fill="#6e7681" fontSize={10} fontFamily="monospace">
                {e.weight}
              </text>
            </g>
          )
        })}

        {/* Nodes */}
        {SAMPLE_GRAPH.nodes.map((n) => {
          const [x, y] = NODE_POSITIONS[n.id]
          const onPath = result?.path.includes(n.id)
          return (
            <g key={n.id}>
              <circle cx={x} cy={y} r={22} fill="#161b22" stroke={onPath ? '#3fb950' : '#30363d'} strokeWidth={2} />
              <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="middle" fill={onPath ? '#3fb950' : '#c9d1d9'} fontSize={13} fontWeight={600} fontFamily="Inter, sans-serif">
                {n.label}
              </text>
            </g>
          )
        })}

        {result && (
          <text x={320} y={250} textAnchor="middle" fill="#3fb950" fontSize={11} fontFamily="monospace">
            Shortest path A→D: {result.path.join(' → ')}  (cost {result.cost})
          </text>
        )}
      </svg>

      <p className="text-noc-muted text-xs border border-noc-border rounded px-3 py-2">
        🚧 Win condition: {level.winCondition}
      </p>

      <button
        className="text-xs text-noc-muted underline self-start"
        onClick={() => onComplete(true, 0)}
      >
        [Dev] Mark complete
      </button>
    </div>
  )
}
