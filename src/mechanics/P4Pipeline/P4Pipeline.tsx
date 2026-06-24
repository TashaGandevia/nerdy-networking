// P4Pipeline mechanic — P4 Pipeline Builder
// Visual: left-to-right Parser → Ingress → Egress → Deparser with packet header cards.
// Used by: Module E (Deck 4) — P4 programmable dataplane levels.

import type { Level } from '@/types'
import { useSettingsStore } from '@/store'
import { Button } from '@/components/ui/Button'

interface P4PipelineProps {
  level: Level
  onComplete: (passed: boolean, hintsUsed: number) => void
}

// Pipeline stage metadata for placeholder rendering
const STAGES = [
  { id: 'parser',   label: 'Parser',   color: '#bc8cff', desc: 'Extract headers from bits' },
  { id: 'ingress',  label: 'Ingress',  color: '#58a6ff', desc: 'Match-action processing'   },
  { id: 'egress',   label: 'Egress',   color: '#ffa657', desc: 'Post-routing modifications' },
  { id: 'deparser', label: 'Deparser', color: '#56d364', desc: 'Reassemble packet bits'    },
]

/**
 * Stub for the P4 Pipeline Builder mechanic.
 * Will render a visual node-graph pipeline where players connect parser states,
 * fill match-action tables, and run test packets through the assembled pipeline.
 *
 * @param level      - Level config with active stage, features, and test packet suite
 * @param onComplete - Callback fired when the test suite passes
 */
export function P4Pipeline({ level, onComplete }: P4PipelineProps) {
  const showP4Code  = useSettingsStore((s) => s.showP4Code)
  const toggleP4Code = useSettingsStore((s) => s.toggleP4Code)

  const setup = level.setup as { stage?: string }

  return (
    <div className="noc-card p-6 flex flex-col gap-4">
      <p className="text-noc-muted text-xs uppercase tracking-widest">Mechanic — P4 Pipeline</p>
      <h2 className="text-noc-bright text-lg font-semibold">{level.title}</h2>
      <p className="text-noc-text text-sm">{level.intent}</p>

      <div className="flex gap-2 items-center">
        <Button variant="ghost" size="sm" onClick={toggleP4Code}>
          {showP4Code ? 'Hide P4 code' : 'Show P4 code'}
        </Button>
        <span className="text-noc-muted text-xs">Active stage: {setup.stage ?? 'full'}</span>
      </div>

      {/* Pipeline stages diagram */}
      <svg
        viewBox="0 0 700 180"
        className="w-full border border-noc-border rounded bg-noc-bg"
        aria-label="P4 pipeline diagram (placeholder)"
      >
        {/* Packet input arrow */}
        <text x={10} y={92} fill="#6e7681" fontSize={10} fontFamily="monospace">pkt →</text>

        {STAGES.map((stage, i) => {
          const x = 70 + i * 155
          const isActive = setup.stage === stage.id || setup.stage === 'full'
          return (
            <g key={stage.id}>
              {/* Arrow between stages */}
              {i > 0 && (
                <line x1={x - 15} y1={90} x2={x} y2={90} stroke="#30363d" strokeWidth={2} markerEnd="url(#arrowhead)" />
              )}

              {/* Stage box */}
              <rect
                x={x} y={50} width={130} height={80} rx={6}
                fill="#161b22"
                stroke={isActive ? stage.color : '#30363d'}
                strokeWidth={isActive ? 2 : 1}
              />
              <text x={x + 65} y={78} textAnchor="middle" fill={isActive ? stage.color : '#c9d1d9'} fontSize={13} fontWeight={600} fontFamily="Inter, sans-serif">
                {stage.label}
              </text>
              <text x={x + 65} y={96} textAnchor="middle" fill="#6e7681" fontSize={9} fontFamily="monospace">
                {stage.desc.substring(0, 20)}
              </text>
            </g>
          )
        })}

        {/* Output arrow */}
        <text x={690} y={92} fill="#6e7681" fontSize={10} fontFamily="monospace" textAnchor="end">→ wire</text>

        <defs>
          <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
            <polygon points="0 0, 6 3, 0 6" fill="#30363d" />
          </marker>
        </defs>
      </svg>

      {/* Optional P4 code panel */}
      {showP4Code && (
        <pre className="bg-noc-bg border border-noc-border rounded p-4 text-xs font-mono text-noc-muted overflow-x-auto leading-relaxed">
{`// P4 snippet for this stage (placeholder)
parser MyParser(packet_in pkt, out headers hdr, ...) {
  state start {
    pkt.extract(hdr.ethernet);
    transition select(hdr.ethernet.etherType) {
      0x0800: parse_ipv4;
      default: accept;
    }
  }
  // ...
}`}
        </pre>
      )}

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
