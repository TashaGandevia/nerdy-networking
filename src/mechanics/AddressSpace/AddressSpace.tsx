// AddressSpace mechanic — Subnet Puzzle
// Visual: address bar / binary tree showing CIDR block carving.
// Used by: Module A (Deck 1) — addressing and VLSM levels.

import type { Level } from '@/types'
import { parseCIDR } from '@/utils/subnet'

interface AddressSpaceProps {
  level: Level
  /** Called with true when the player's solution passes all win conditions */
  onComplete: (passed: boolean, hintsUsed: number) => void
}

/**
 * Stub for the Address Space mechanic.
 * Will render an interactive address-bar / binary-tree for CIDR carving.
 *
 * @param level      - Level config including the parent block and requirements
 * @param onComplete - Callback fired when the player submits a solution
 */
export function AddressSpace({ level, onComplete }: AddressSpaceProps) {
  const setup = level.setup as { block: string }
  const block = parseCIDR(setup.block)

  return (
    <div className="noc-card p-6 flex flex-col gap-4">
      <p className="text-noc-muted text-xs uppercase tracking-widest">Mechanic — Address Space</p>
      <h2 className="text-noc-bright text-lg font-semibold">{level.title}</h2>
      <p className="text-noc-text text-sm">{level.intent}</p>

      {/* Placeholder address bar */}
      <div className="bg-noc-bg border border-noc-border rounded p-4 font-mono text-sm">
        <p className="text-noc-muted text-xs mb-2">Parent block</p>
        <p className="text-link-packet">{setup.block}</p>
        {block && (
          <p className="text-noc-muted text-xs mt-1">
            {block.totalHosts.toLocaleString()} addresses ({block.network} – {block.broadcast})
          </p>
        )}
      </div>

      {/* SVG placeholder — address bar will go here */}
      <svg
        viewBox="0 0 600 80"
        className="w-full border border-noc-border rounded bg-noc-bg"
        aria-label="Address space bar (placeholder)"
      >
        <rect x={0} y={20} width={600} height={40} rx={4} fill="#30363d" />
        <text x={300} y={44} textAnchor="middle" fill="#6e7681" fontSize={12} fontFamily="monospace">
          Address bar — coming soon
        </text>
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
