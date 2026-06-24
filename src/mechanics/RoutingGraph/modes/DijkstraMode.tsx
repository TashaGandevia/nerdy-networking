// B-L04 Dijkstra Step-through — Random connected graph; player fills the
// forwarding table (cost + next-hop) from a chosen source to every destination.

import { useMemo, useState } from 'react'
import type { Level } from '@/types'
import { Button } from '@/components/ui/Button'
import { Badge }  from '@/components/ui/Badge'
import { dijkstra, type Graph } from '@/utils/graph'
import { GraphCanvas, edgeKey, type NodePos } from '../GraphCanvas'

interface Props {
  level: Level
  onComplete: (passed: boolean, hintsUsed: number) => void
}

const NODE_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G']

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

interface Scenario {
  nodes:  NodePos[]
  graph:  Graph
  source: string
}

function makeScenario(): Scenario {
  const n     = rand(5, 6)
  const ids   = NODE_LABELS.slice(0, n)
  // Place nodes on a circle layout
  const cx = 320, cy = 160, R = 110
  const nodes: NodePos[] = ids.map((id, i) => ({
    id, label: id,
    x: cx + R * Math.cos(2 * Math.PI * i / n - Math.PI / 2),
    y: cy + R * Math.sin(2 * Math.PI * i / n - Math.PI / 2),
  }))

  // Build a spanning ring + extra chords for variety
  const edges: Graph['edges'] = []
  for (let i = 0; i < n; i++) {
    edges.push({ from: ids[i], to: ids[(i + 1) % n], weight: rand(1, 9), up: true })
  }
  // Add a few cross edges
  const extra = rand(1, 2)
  for (let k = 0; k < extra; k++) {
    const a = rand(0, n - 1)
    const b = (a + rand(2, n - 2)) % n
    if (!edges.some((e) => (e.from === ids[a] && e.to === ids[b]) || (e.from === ids[b] && e.to === ids[a]))) {
      edges.push({ from: ids[a], to: ids[b], weight: rand(2, 10), up: true })
    }
  }
  return { nodes, graph: { nodes: ids.map((id) => ({ id, label: id })), edges }, source: 'A' }
}

const HINTS = [
  'Dijkstra relaxes each edge from the lowest-cost unvisited node — never go back to a node whose final cost is already settled.',
  'For each destination, the "next hop" is the neighbour of the source on its shortest path.',
]

export function DijkstraMode({ level, onComplete }: Props) {
  const [scenarioKey, setScenarioKey] = useState(0)
  const scenario = useMemo(() => makeScenario(), [scenarioKey])
  const truth    = useMemo(() => {
    const out: Record<string, { cost: number; nextHop: string }> = {}
    for (const n of scenario.nodes) {
      if (n.id === scenario.source) continue
      const r = dijkstra(scenario.graph, scenario.source, n.id)
      if (r) out[n.id] = { cost: r.cost, nextHop: r.path[1] }
    }
    return out
  }, [scenario])

  const [entries, setEntries]     = useState<Record<string, { cost: string; nextHop: string }>>({})
  const [submitted, setSubmitted] = useState(false)
  const [hintIdx,   setHintIdx]   = useState(0)

  function reset() {
    setScenarioKey((k) => k + 1)
    setEntries({})
    setSubmitted(false)
    setHintIdx(0)
  }

  const destinations = scenario.nodes.filter((n) => n.id !== scenario.source)
  const correct = destinations.filter((n) => {
    const e = entries[n.id]
    return e
      && parseInt(e.cost) === truth[n.id]?.cost
      && e.nextHop === truth[n.id]?.nextHop
  }).length
  const passed = correct === destinations.length

  // Build highlight set from correct entries' paths (visual aid after submit)
  const highlight = useMemo(() => {
    if (!submitted) return undefined
    const s = new Set<string>()
    for (const n of destinations) {
      const r = dijkstra(scenario.graph, scenario.source, n.id)
      if (!r) continue
      for (let i = 0; i < r.path.length - 1; i++) s.add(edgeKey(r.path[i], r.path[i + 1]))
    }
    return s
  }, [submitted, scenario, destinations])

  return (
    <div className="noc-card p-6 flex flex-col gap-4">
      <p className="text-noc-muted text-xs uppercase tracking-widest">Dijkstra (link-state)</p>
      <h2 className="text-noc-bright text-lg font-semibold">{level.title}</h2>
      <p className="text-noc-text text-sm">{level.intent}</p>

      <div className="flex gap-2 flex-wrap">
        <Badge variant="idle">Source: {scenario.source}</Badge>
        <Badge variant="idle">{scenario.nodes.length} nodes</Badge>
        <Badge variant="idle">{correct} / {destinations.length} correct</Badge>
      </div>

      <GraphCanvas nodes={scenario.nodes} graph={scenario.graph} highlight={highlight} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {destinations.map((n) => {
          const e       = entries[n.id] ?? { cost: '', nextHop: '' }
          const isRight = submitted
            && parseInt(e.cost) === truth[n.id]?.cost
            && e.nextHop === truth[n.id]?.nextHop
          const isWrong = submitted && !isRight
          return (
            <div key={n.id} className={`border rounded px-3 py-2 grid grid-cols-[auto_1fr_1fr] gap-2 items-center ${
              isRight ? 'border-link-up' : isWrong ? 'border-link-down' : 'border-noc-border'
            }`}>
              <span className="text-noc-bright font-mono">{scenario.source} → {n.id}</span>
              <input
                type="number" min={0}
                value={e.cost}
                disabled={submitted}
                onChange={(ev) => setEntries((p) => ({ ...p, [n.id]: { ...e, cost: ev.target.value } }))}
                placeholder="cost"
                className="bg-noc-bg border border-noc-border text-noc-text text-xs rounded px-2 py-1 font-mono"
              />
              <select
                value={e.nextHop}
                disabled={submitted}
                onChange={(ev) => setEntries((p) => ({ ...p, [n.id]: { ...e, nextHop: ev.target.value } }))}
                className="bg-noc-bg border border-noc-border text-noc-text text-xs rounded px-2 py-1"
              >
                <option value="">— next hop —</option>
                {scenario.nodes.filter((m) => m.id !== scenario.source).map((m) => (
                  <option key={m.id} value={m.id}>{m.id}</option>
                ))}
              </select>
              {submitted && isWrong && (
                <p className="col-span-3 text-link-down text-xs font-mono">
                  Actual: cost {truth[n.id]?.cost} via {truth[n.id]?.nextHop}
                </p>
              )}
            </div>
          )
        })}
      </div>

      {hintIdx > 0 && (
        <div className="border border-noc-border rounded px-3 py-2 flex flex-col gap-1">
          {HINTS.slice(0, hintIdx).map((h, i) => (
            <p key={i} className="text-noc-muted text-xs">💡 {h}</p>
          ))}
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {!submitted && (
          <Button size="sm" disabled={Object.keys(entries).length < destinations.length}
                  onClick={() => setSubmitted(true)}>
            Submit table
          </Button>
        )}
        {submitted && (
          <Button size="sm" disabled={!passed} onClick={() => onComplete(passed, hintIdx)}>
            Finish level
          </Button>
        )}
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
