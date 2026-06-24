// C-L05 Link Failure Boss
// A core link fails. Player (acting as SDN controller) must:
//   (1) restore connectivity by routing every flow on an alternate up-path;
//   (2) place a "priority" tenant flow on a *non-shortest* path, while
//   (3) the other flows still share remaining capacity.
// Implemented as: assign every flow a path (clicked); pass when restored
// connectivity + priority on the designated alternate path.

import { useEffect, useMemo, useState } from 'react'
import type { Level } from '@/types'
import { Button } from '@/components/ui/Button'
import { Badge }  from '@/components/ui/Badge'
import { dijkstra, type Graph } from '@/utils/graph'
import { GraphCanvas, edgeKey, type NodePos } from '../GraphCanvas'

interface Props { level: Level; onComplete: (passed: boolean, hintsUsed: number) => void }

interface FlowDef {
  id:        string
  src:       string
  dst:       string
  priority:  boolean
}

interface Scenario {
  nodes:     NodePos[]
  graph:     Graph
  flows:     FlowDef[]
  /** Edge that fails (still in graph but with up=false). */
  failed:    { from: string; to: string }
}

const LABELS = ['A', 'B', 'C', 'D', 'E']
function rand(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min }

function makeScenario(): Scenario {
  const n   = 5
  const ids = LABELS.slice(0, n)
  const cx = 320, cy = 160, R = 110
  const nodes: NodePos[] = ids.map((id, i) => ({
    id, label: id,
    x: cx + R * Math.cos(2 * Math.PI * i / n - Math.PI / 2),
    y: cy + R * Math.sin(2 * Math.PI * i / n - Math.PI / 2),
  }))
  const edges: Graph['edges'] = []
  for (let i = 0; i < n; i++) {
    edges.push({ from: ids[i], to: ids[(i + 1) % n], weight: rand(1, 4), up: true })
  }
  edges.push({ from: ids[0], to: ids[2], weight: rand(2, 5), up: true })
  edges.push({ from: ids[1], to: ids[3], weight: rand(2, 5), up: true })

  // Fail a random ring link
  const failIdx = rand(0, n - 1)
  const failed  = { from: ids[failIdx], to: ids[(failIdx + 1) % n] }
  for (const e of edges) {
    if ((e.from === failed.from && e.to === failed.to) || (e.from === failed.to && e.to === failed.from)) {
      e.up = false
    }
  }

  const flows: FlowDef[] = [
    { id: 'tenant-X', src: ids[0], dst: ids[2], priority: true  },
    { id: 'best-effort-1', src: ids[1], dst: ids[3], priority: false },
    { id: 'best-effort-2', src: ids[0], dst: ids[4], priority: false },
  ]
  return { nodes, graph: { nodes: ids.map(id => ({ id, label: id })), edges }, flows, failed }
}

const HINTS = [
  'After the link fails, recompute Dijkstra on the up-edges — that\'s where best-effort flows belong.',
  'Tenant-X is the priority flow: route it on an alternate path that doesn\'t reuse the busiest segment of the shortest route.',
]

function pathExists(graph: Graph, path: string[]): boolean {
  for (let i = 0; i < path.length - 1; i++) {
    const e = graph.edges.find((ed) =>
      ed.up && ((ed.from === path[i] && ed.to === path[i + 1]) || (ed.to === path[i] && ed.from === path[i + 1])),
    )
    if (!e) return false
  }
  return true
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

export function FailureBossMode({ level, onComplete }: Props) {
  const [scenarioKey, setScenarioKey] = useState(0)
  const scenario = useMemo(() => makeScenario(), [scenarioKey])
  const [paths, setPaths] = useState<Record<string, string[]>>({})
  const [activeFlowId, setActiveFlowId] = useState<string>('')
  useEffect(() => {
    const init: Record<string, string[]> = {}
    for (const f of scenario.flows) init[f.id] = [f.src]
    setPaths(init)
    setActiveFlowId(scenario.flows[0].id)
  }, [scenario])

  const [hintIdx, setHintIdx] = useState(0)

  function reset() { setScenarioKey(k => k + 1); setHintIdx(0) }

  function clickNode(id: string) {
    if (!activeFlowId) return
    setPaths(prev => {
      const cur = prev[activeFlowId] ?? []
      const head = cur[cur.length - 1]
      if (head === id) {
        // backtrack
        return cur.length > 1 ? { ...prev, [activeFlowId]: cur.slice(0, -1) } : prev
      }
      const adj = scenario.graph.edges.some((e) =>
        e.up && ((e.from === head && e.to === id) || (e.to === head && e.from === id)),
      )
      if (!adj || cur.includes(id)) return prev
      return { ...prev, [activeFlowId]: [...cur, id] }
    })
  }

  // Evaluate each flow
  const tenantX     = scenario.flows.find(f => f.priority)!
  const shortestX   = dijkstra(scenario.graph, tenantX.src, tenantX.dst)
  const flowResults = scenario.flows.map((f) => {
    const p          = paths[f.id] ?? [f.src]
    const reachable  = p[p.length - 1] === f.dst && pathExists(scenario.graph, p)
    const isPriority = f.priority
    const cost       = pathCost(scenario.graph, p)
    const shortest   = dijkstra(scenario.graph, f.src, f.dst)
    const nonShortest = shortest ? cost > shortest.cost : false
    return { flow: f, reachable, isPriority, nonShortest, cost }
  })

  const allReachable        = flowResults.every(r => r.reachable)
  const priorityNonShortest = flowResults.find(r => r.isPriority)?.nonShortest === true
  const passed              = allReachable && priorityNonShortest

  const highlight = new Set<string>()
  for (const [, path] of Object.entries(paths)) {
    for (let i = 0; i < path.length - 1; i++) highlight.add(edgeKey(path[i], path[i + 1]))
  }

  return (
    <div className="noc-card p-6 flex flex-col gap-4">
      <p className="text-noc-muted text-xs uppercase tracking-widest">SDN Controller · Link Failure Boss</p>
      <h2 className="text-noc-bright text-lg font-semibold">{level.title}</h2>
      <p className="text-noc-text text-sm">{level.intent}</p>

      <div className="flex gap-2 flex-wrap">
        <Badge variant="down">Link DOWN: {scenario.failed.from} ↔ {scenario.failed.to}</Badge>
        <Badge variant="idle">Shortest tenant-X cost (intact graph): {shortestX?.cost ?? 'n/a'}</Badge>
      </div>

      <GraphCanvas
        nodes={scenario.nodes}
        graph={scenario.graph}
        highlight={highlight}
        selected={paths[activeFlowId]?.[paths[activeFlowId]!.length - 1] ?? null}
        onClickNode={clickNode}
      />

      {/* Flow selector */}
      <div className="flex flex-col gap-2">
        {scenario.flows.map((f) => {
          const r = flowResults.find(x => x.flow.id === f.id)!
          const active = activeFlowId === f.id
          return (
            <button
              key={f.id}
              onClick={() => setActiveFlowId(f.id)}
              className={`text-left border rounded px-3 py-2 text-xs transition-colors ${
                active ? 'border-link-packet' : 'border-noc-border hover:border-noc-text'
              }`}
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className={`font-mono ${f.priority ? 'text-link-packet' : 'text-noc-text'}`}>
                  {f.priority && '★ '}{f.id} · {f.src} → {f.dst}
                </span>
                <span className="text-noc-muted">
                  path: {(paths[f.id] ?? [f.src]).join(' → ')} (cost {r.cost})
                </span>
                <span className={`font-mono ${r.reachable ? 'text-link-up' : 'text-link-down'}`}>
                  {r.reachable ? '✓ reachable' : '✗ unreachable'}
                </span>
                {f.priority && (
                  <span className={`font-mono ${r.nonShortest ? 'text-link-up' : 'text-link-down'}`}>
                    {r.nonShortest ? '✓ non-shortest' : '✗ on shortest'}
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      <p className="text-noc-muted text-xs">
        Pick a flow above, then click adjacent nodes to extend its path. Click the current head to backtrack.
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
