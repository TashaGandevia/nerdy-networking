// C-L03 Non-Shortest-Path Flow
// Random graph; one "target" flow must take a *specific* non-shortest path.
// Player clicks the sequence of nodes from source to dest to build the route.
// Pass: path is non-shortest, valid (uses up edges), and matches the assigned
// "target" path the controller wants.

import { useEffect, useMemo, useState } from 'react'
import type { Level } from '@/types'
import { Button } from '@/components/ui/Button'
import { Badge }  from '@/components/ui/Badge'
import { dijkstra, type Graph } from '@/utils/graph'
import { GraphCanvas, edgeKey, type NodePos } from '../GraphCanvas'

interface Props { level: Level; onComplete: (passed: boolean, hintsUsed: number) => void }

interface Scenario {
  nodes:     NodePos[]
  graph:     Graph
  source:    string
  dest:      string
  /** Required path the controller wants. Must be non-shortest. */
  required:  string[]
}

const LABELS = ['A', 'B', 'C', 'D', 'E', 'F']
function rand(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min }

/** Find any *non-shortest* simple path from source to dest. Returns null if none exists. */
function findNonShortest(graph: Graph, source: string, dest: string, shortestCost: number): string[] | null {
  const adj: Record<string, { to: string; weight: number }[]> = {}
  for (const n of graph.nodes) adj[n.id] = []
  for (const e of graph.edges) {
    if (!e.up) continue
    adj[e.from].push({ to: e.to,   weight: e.weight })
    adj[e.to  ].push({ to: e.from, weight: e.weight })
  }
  const found: string[][] = []
  function dfs(curr: string, path: string[], cost: number) {
    if (found.length >= 10) return
    if (curr === dest) {
      if (cost > shortestCost) found.push([...path])
      return
    }
    for (const { to, weight } of adj[curr]) {
      if (path.includes(to)) continue
      path.push(to); dfs(to, path, cost + weight); path.pop()
    }
  }
  dfs(source, [source], 0)
  if (found.length === 0) return null
  // Sort by cost ascending, pick a middle one for "interesting" non-shortest path
  found.sort((a, b) => pathCost(graph, a) - pathCost(graph, b))
  return found[Math.min(rand(0, 2), found.length - 1)]
}

function pathCost(graph: Graph, path: string[]): number {
  let c = 0
  for (let i = 0; i < path.length - 1; i++) {
    const e = graph.edges.find((ed) =>
      (ed.from === path[i] && ed.to === path[i + 1]) || (ed.to === path[i] && ed.from === path[i + 1]),
    )
    if (e) c += e.weight
  }
  return c
}

function makeScenario(): Scenario {
  const n   = 5
  const ids = LABELS.slice(0, n)
  const cx = 320, cy = 160, R = 110
  const nodes: NodePos[] = ids.map((id, i) => ({
    id, label: id,
    x: cx + R * Math.cos(2 * Math.PI * i / n - Math.PI / 2),
    y: cy + R * Math.sin(2 * Math.PI * i / n - Math.PI / 2),
  }))
  // Build a richer graph: ring + chords
  const edges: Graph['edges'] = []
  for (let i = 0; i < n; i++) {
    edges.push({ from: ids[i], to: ids[(i + 1) % n], weight: rand(1, 4), up: true })
  }
  edges.push({ from: ids[0], to: ids[2], weight: rand(2, 6), up: true })
  edges.push({ from: ids[1], to: ids[3], weight: rand(2, 6), up: true })

  const source = 'A', dest = ids[rand(2, 3)]
  const shortest = dijkstra({ nodes: ids.map(id => ({ id, label: id })), edges }, source, dest)!
  const required = findNonShortest({ nodes: ids.map(id => ({ id, label: id })), edges }, source, dest, shortest.cost)
  // Fallback: if no non-shortest exists, retry with different randomization
  if (!required) return makeScenario()

  return { nodes, graph: { nodes: ids.map(id => ({ id, label: id })), edges }, source, dest, required }
}

const HINTS = [
  'OSPF/ECMP cannot do this — the controller is choosing a longer path on purpose (maybe to avoid a congested link, or because of a business policy).',
  'The required path always includes at least one intermediate node that the shortest path skips. Look for the longer way around.',
]

export function TrafficEngineeringMode({ level, onComplete }: Props) {
  const [scenarioKey, setScenarioKey] = useState(0)
  const scenario = useMemo(() => makeScenario(), [scenarioKey])
  const [path, setPath]       = useState<string[]>([])
  useEffect(() => { setPath([scenario.source]) }, [scenario])
  const [hintIdx, setHintIdx] = useState(0)

  function reset() { setScenarioKey(k => k + 1); setHintIdx(0) }

  function clickNode(id: string) {
    if (path[path.length - 1] === id) {
      // backtrack one step on re-click of current head
      if (path.length > 1) setPath(p => p.slice(0, -1))
      return
    }
    // Must be adjacent
    const adj = scenario.graph.edges.some((e) =>
      (e.from === path[path.length - 1] && e.to === id) ||
      (e.to   === path[path.length - 1] && e.from === id),
    )
    if (!adj) return
    if (path.includes(id)) return
    setPath(p => [...p, id])
  }

  const matches = path.length === scenario.required.length
              && path.every((n, i) => n === scenario.required[i])
  const reachedDest = path[path.length - 1] === scenario.dest
  const passed      = matches && reachedDest

  const highlight = new Set(path.slice(0, -1).map((n, i) => edgeKey(n, path[i + 1])))

  return (
    <div className="noc-card p-6 flex flex-col gap-4">
      <p className="text-noc-muted text-xs uppercase tracking-widest">Traffic Engineering · Non-Shortest Path</p>
      <h2 className="text-noc-bright text-lg font-semibold">{level.title}</h2>
      <p className="text-noc-text text-sm">{level.intent}</p>

      <div className="flex gap-2 flex-wrap">
        <Badge variant="idle">Source: {scenario.source} → Dest: {scenario.dest}</Badge>
        <Badge variant="idle">Required path: {scenario.required.join(' → ')}</Badge>
        <Badge variant="idle">Your path: {path.join(' → ') || '—'}</Badge>
      </div>

      <GraphCanvas
        nodes={scenario.nodes}
        graph={scenario.graph}
        highlight={highlight}
        selected={path[path.length - 1] ?? null}
        onClickNode={clickNode}
      />

      <p className="text-noc-muted text-xs">
        Click adjacent nodes to extend the path. Click the current head to backtrack one step.
      </p>

      {hintIdx > 0 && (
        <div className="border border-noc-border rounded px-3 py-2 flex flex-col gap-1">
          {HINTS.slice(0, hintIdx).map((h, i) => (
            <p key={i} className="text-noc-muted text-xs">💡 {h}</p>
          ))}
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        <Button size="sm" disabled={!passed} onClick={() => onComplete(true, hintIdx)}>Finish level</Button>
        {hintIdx < HINTS.length && (
          <Button size="sm" variant="ghost" onClick={() => setHintIdx(n => n + 1)}>
            Hint ({hintIdx + 1}/{HINTS.length})
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={reset}>New scenario</Button>
      </div>
    </div>
  )
}
