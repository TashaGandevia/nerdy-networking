// B-L05 Count to Infinity — Linear 3-node graph A-B-C; the link B↔C fails.
// Naive distance-vector loops "I'd go via B, B'd go via me"; player toggles
// split-horizon to break the loop. Win = converged with split-horizon on.

import { useMemo, useState } from 'react'
import type { Level } from '@/types'
import { Button } from '@/components/ui/Button'
import { Badge }  from '@/components/ui/Badge'
import type { Graph } from '@/utils/graph'
import { GraphCanvas, type NodePos } from '../GraphCanvas'

interface Props {
  level: Level
  onComplete: (passed: boolean, hintsUsed: number) => void
}

interface Scenario {
  nodes: NodePos[]
  graph: Graph
  failedFrom: string
  failedTo:   string
}

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function makeScenario(): Scenario {
  const weights = [rand(1, 4), rand(1, 4)]
  return {
    nodes: [
      { id: 'A', label: 'A', x: 140, y: 160 },
      { id: 'B', label: 'B', x: 320, y: 160 },
      { id: 'C', label: 'C', x: 500, y: 160 },
    ],
    graph: {
      nodes: [
        { id: 'A', label: 'A' },
        { id: 'B', label: 'B' },
        { id: 'C', label: 'C' },
      ],
      edges: [
        { from: 'A', to: 'B', weight: weights[0], up: true },
        { from: 'B', to: 'C', weight: weights[1], up: false }, // failed
      ],
    },
    failedFrom: 'B', failedTo: 'C',
  }
}

const MAX_ROUNDS = 10
const INF        = '∞'

interface Round {
  dB_C: string     // B's distance to C ('∞' or number)
  dA_C: string     // A's distance to C
}

/** Simulate distance-vector convergence with or without split-horizon. */
function simulate(splitHorizon: boolean, weightAB: number, weightBC: number): { rounds: Round[]; converged: boolean } {
  // Initially A thinks dist(C)=weightAB+weightBC via B, B thinks dist(C)=weightBC.
  // After failure: B knows C is unreachable; A still advertises (weightAB + weightBC).
  let dB = INF                                         // B's view of C after failure
  let dA = String(weightAB + weightBC)                  // A's stale view
  const rounds: Round[] = [{ dB_C: dB, dA_C: dA }]

  for (let i = 0; i < MAX_ROUNDS; i++) {
    // B learns from A: if A says dA_C, B reaches C via A at weightAB + dA_C (unless split-horizon
    // says A wouldn't advertise C back to B since A's route to C goes through B).
    let newDB = INF
    if (!splitHorizon && dA !== INF) {
      // A advertised dA to B → B considers it
      newDB = String(weightAB + parseInt(dA))
    }
    // A learns from B: if split-horizon, B doesn't advertise C back to A iff B's route to C goes via A.
    // After failure B's route goes via A only when learned from A → split-horizon poisons it.
    let newDA = INF
    if (!splitHorizon && dB !== INF) {
      newDA = String(weightAB + parseInt(dB))
    }
    // Without split-horizon, the loop will both ping-pong upward (count to infinity).
    if (splitHorizon) {
      // C is truly unreachable: both settle on ∞.
      newDB = INF
      newDA = INF
    } else {
      // Without it: each side keeps inflating using the other's stale advertisement.
      newDA = String(weightAB + (dB === INF ? 16 : parseInt(dB)))
      newDB = String(weightAB + (dA === INF ? 16 : parseInt(dA)))
    }
    rounds.push({ dB_C: newDB, dA_C: newDA })
    if (newDB === dB && newDA === dA) {
      return { rounds, converged: true }
    }
    if ((newDA !== INF && parseInt(newDA) >= 16) || (newDB !== INF && parseInt(newDB) >= 16)) {
      // Hit "infinity" = 16, classic RIP cap
      return { rounds, converged: false }
    }
    dA = newDA; dB = newDB
  }
  return { rounds, converged: false }
}

const HINTS = [
  'Without split-horizon, A keeps telling B "I can reach C" and B trusts it — so each round costs grow without ever revealing the link is down.',
  'Split-horizon: a router does not advertise a route back out the interface it learned that route from.',
]

export function CountToInfinityMode({ level, onComplete }: Props) {
  const [scenarioKey, setScenarioKey] = useState(0)
  const scenario = useMemo(() => makeScenario(), [scenarioKey])
  const wAB      = scenario.graph.edges[0].weight
  const wBC      = scenario.graph.edges[1].weight

  const [splitHorizon, setSplitHorizon] = useState(false)
  const sim = useMemo(() => simulate(splitHorizon, wAB, wBC), [splitHorizon, wAB, wBC])

  const [hintIdx, setHintIdx] = useState(0)
  const passed = splitHorizon && sim.converged

  function reset() {
    setScenarioKey((k) => k + 1)
    setSplitHorizon(false)
    setHintIdx(0)
  }

  return (
    <div className="noc-card p-6 flex flex-col gap-4">
      <p className="text-noc-muted text-xs uppercase tracking-widest">Distance-vector (RIP)</p>
      <h2 className="text-noc-bright text-lg font-semibold">{level.title}</h2>
      <p className="text-noc-text text-sm">{level.intent}</p>

      <div className="flex gap-2 flex-wrap">
        <Badge variant="idle">A↔B cost {wAB}</Badge>
        <Badge variant="down">B↔C link DOWN (was {wBC})</Badge>
        <Badge variant="idle">RIP infinity = 16</Badge>
      </div>

      <GraphCanvas nodes={scenario.nodes} graph={scenario.graph} />

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setSplitHorizon((v) => !v)}
          className={`text-xs px-3 py-1.5 rounded border transition-colors ${
            splitHorizon
              ? 'bg-link-packet/15 border-link-packet text-link-packet'
              : 'border-noc-border text-noc-muted hover:text-noc-text'
          }`}
        >
          Split-horizon: {splitHorizon ? 'ON' : 'OFF'}
        </button>
      </div>

      <div className="border border-noc-border rounded overflow-hidden">
        <table className="w-full text-xs font-mono">
          <thead className="bg-noc-bg text-noc-muted">
            <tr>
              <th className="text-left  px-2 py-1">Round</th>
              <th className="text-right px-2 py-1">A's dist to C</th>
              <th className="text-right px-2 py-1">B's dist to C</th>
            </tr>
          </thead>
          <tbody>
            {sim.rounds.map((r, i) => (
              <tr key={i} className="border-t border-noc-border">
                <td className="px-2 py-1">{i}</td>
                <td className="px-2 py-1 text-right">{r.dA_C}</td>
                <td className="px-2 py-1 text-right">{r.dB_C}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className={`text-sm ${sim.converged ? 'text-link-up' : 'text-link-down'}`}>
        {sim.converged
          ? `Converged in ${sim.rounds.length - 1} rounds — both routers agree C is unreachable.`
          : 'Did not converge — distances keep climbing toward ∞ (count-to-infinity).'}
      </p>

      {hintIdx > 0 && (
        <div className="border border-noc-border rounded px-3 py-2 flex flex-col gap-1">
          {HINTS.slice(0, hintIdx).map((h, i) => (
            <p key={i} className="text-noc-muted text-xs">💡 {h}</p>
          ))}
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        <Button size="sm" disabled={!passed} onClick={() => onComplete(true, hintIdx)}>
          Finish level
        </Button>
        {hintIdx < HINTS.length && (
          <Button size="sm" variant="ghost" onClick={() => setHintIdx((n) => n + 1)}>
            Hint ({hintIdx + 1}/{HINTS.length})
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={reset}>New scenario</Button>
      </div>
    </div>
  )
}
