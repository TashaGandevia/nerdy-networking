// TopologyCanvas mechanic — Build-a-Network
// Drag nodes around a canvas, click pairs to wire them, then verify full reachability.
// Templates define the initial node layout; the player draws all the links.

import { useState, useRef, useCallback } from 'react'
import type { Level } from '@/types'
import { Button } from '@/components/ui/Button'
import { Badge }  from '@/components/ui/Badge'

interface TopologyCanvasProps {
  level: Level
  onComplete: (passed: boolean, hintsUsed: number) => void
}

interface Setup {
  template:        string
  maxLinks?:       number   // optional cap on total links
  minRedundancy?:  number   // min link-count per router (0 = no constraint)
}

// ── Node / template types ────────────────────────────────────────────────────

type NodeType = 'router' | 'host' | 'switch'

interface NodeDef {
  id:    string
  label: string
  type:  NodeType
  x:     number
  y:     number
}

interface Template {
  nodes:       NodeDef[]
  description: string
}

const SVG_W = 700
const SVG_H = 400

const TEMPLATES: Record<string, Template> = {
  office: {
    description: 'Connect the three workstations through the office router so they can all talk to each other.',
    nodes: [
      { id: 'r1',  label: 'R1',   type: 'router', x: 350, y: 200 },
      { id: 'h1',  label: 'PC-A', type: 'host',   x: 120, y: 100 },
      { id: 'h2',  label: 'PC-B', type: 'host',   x: 120, y: 300 },
      { id: 'h3',  label: 'PC-C', type: 'host',   x: 580, y: 200 },
    ],
  },
  ring: {
    description: 'Wire the four routers so every router has at least 2 links (giving redundant paths between all hosts).',
    nodes: [
      { id: 'r1', label: 'R1',   type: 'router', x: 210, y: 130 },
      { id: 'r2', label: 'R2',   type: 'router', x: 490, y: 130 },
      { id: 'r3', label: 'R3',   type: 'router', x: 490, y: 300 },
      { id: 'r4', label: 'R4',   type: 'router', x: 210, y: 300 },
      { id: 'h1', label: 'PC-A', type: 'host',   x:  80, y: 215 },
      { id: 'h2', label: 'PC-B', type: 'host',   x: 620, y: 215 },
    ],
  },
  backbone: {
    description: 'Connect the backbone (≤ 9 links total) so every branch can reach HQ through the core routers.',
    nodes: [
      { id: 'c1', label: 'Core1', type: 'router', x: 260, y: 130 },
      { id: 'c2', label: 'Core2', type: 'router', x: 450, y: 130 },
      { id: 'e1', label: 'Edge1', type: 'router', x: 110, y: 255 },
      { id: 'e2', label: 'Edge2', type: 'router', x: 350, y: 270 },
      { id: 'e3', label: 'Edge3', type: 'router', x: 590, y: 255 },
      { id: 'h1', label: 'HQ',      type: 'host', x:  60, y: 360 },
      { id: 'h2', label: 'Branch1', type: 'host', x: 220, y: 370 },
      { id: 'h3', label: 'Branch2', type: 'host', x: 470, y: 370 },
      { id: 'h4', label: 'Branch3', type: 'host', x: 640, y: 360 },
    ],
  },
}

// ── Graph helpers ────────────────────────────────────────────────────────────

function linkKey(a: string, b: string): string {
  return [a, b].sort().join(':')
}

function buildAdj(nodeIds: string[], links: Set<string>): Record<string, string[]> {
  const adj: Record<string, string[]> = Object.fromEntries(nodeIds.map(id => [id, []]))
  links.forEach(k => {
    const [a, b] = k.split(':')
    adj[a]?.push(b)
    adj[b]?.push(a)
  })
  return adj
}

function bfsReach(start: string, adj: Record<string, string[]>): Set<string> {
  const visited = new Set([start])
  const queue   = [start]
  while (queue.length) {
    const curr = queue.shift()!
    for (const nb of adj[curr] ?? []) {
      if (!visited.has(nb)) { visited.add(nb); queue.push(nb) }
    }
  }
  return visited
}

// ── Visual helpers ───────────────────────────────────────────────────────────

const NODE_CLR: Record<NodeType, string> = {
  router: '#58a6ff',
  host:   '#3fb950',
  switch: '#bc8cff',
}

const NODE_R = 22  // radius / half-size for hit area

function nodeCenter(n: NodeDef) { return { cx: n.x, cy: n.y } }

// ── Component ────────────────────────────────────────────────────────────────

interface VerifyResult {
  passed:      boolean
  message:     string
  reachable:   Set<string>   // node ids reachable from first host
  failedPairs: string[]      // human-readable unreachable pairs
}

export function TopologyCanvas({ level, onComplete }: TopologyCanvasProps) {
  const setup    = level.setup as Setup
  const template = TEMPLATES[setup.template] ?? TEMPLATES['office']
  const maxLinks = setup.maxLinks
  const minRed   = setup.minRedundancy ?? 0

  // Mutable node positions (start from template)
  const [nodes,   setNodes]  = useState<NodeDef[]>(() => template.nodes.map(n => ({ ...n })))
  const [links,   setLinks]  = useState<Set<string>>(() => new Set())
  const [selected, setSelected] = useState<string | null>(null)
  const [verify,   setVerify]   = useState<VerifyResult | null>(null)
  const [passed,   setPassed]   = useState(false)

  // Drag tracking via refs (no re-render needed mid-drag)
  const dragRef = useRef<{ id: string; ox: number; oy: number; px: number; py: number } | null>(null)
  const didDragRef = useRef(false)

  const svgRef = useRef<SVGSVGElement>(null)

  // Convert client coords → SVG coords
  function toSVG(clientX: number, clientY: number) {
    const el = svgRef.current
    if (!el) return { x: clientX, y: clientY }
    const rect = el.getBoundingClientRect()
    const scaleX = SVG_W / rect.width
    const scaleY = SVG_H / rect.height
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY }
  }

  function onPointerDownNode(e: React.PointerEvent, id: string) {
    e.stopPropagation()
    const { x, y } = toSVG(e.clientX, e.clientY)
    const node = nodes.find(n => n.id === id)!
    dragRef.current  = { id, ox: node.x, oy: node.y, px: x, py: y }
    didDragRef.current = false
    ;(e.target as Element).setPointerCapture(e.pointerId)
  }

  function onPointerMoveNode(e: React.PointerEvent) {
    if (!dragRef.current) return
    const { x, y } = toSVG(e.clientX, e.clientY)
    const dx = x - dragRef.current.px
    const dy = y - dragRef.current.py
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) didDragRef.current = true
    if (!didDragRef.current) return
    const id = dragRef.current.id
    setNodes(prev => prev.map(n =>
      n.id === id ? { ...n, x: dragRef.current!.ox + dx, y: dragRef.current!.oy + dy } : n
    ))
  }

  function onPointerUpNode(e: React.PointerEvent, id: string) {
    e.stopPropagation()
    dragRef.current = null
    if (didDragRef.current) { didDragRef.current = false; return }  // was a drag, not a click

    // Click logic: select/wire
    setVerify(null)
    if (selected === null) {
      setSelected(id)
    } else if (selected === id) {
      setSelected(null)
    } else {
      // Toggle link between selected and id
      const key = linkKey(selected, id)
      setLinks(prev => {
        const next = new Set(prev)
        if (next.has(key)) next.delete(key)
        else if (!maxLinks || next.size < maxLinks) next.add(key)
        return next
      })
      setSelected(null)
    }
  }

  function onPointerDownCanvas() {
    setSelected(null)
  }

  // ── Verify ────────────────────────────────────────────────────────────────

  const handleVerify = useCallback(() => {
    const hosts   = nodes.filter(n => n.type === 'host')
    const nodeIds = nodes.map(n => n.id)
    const adj     = buildAdj(nodeIds, links)

    if (hosts.length === 0) { setVerify({ passed: true, message: 'No hosts to connect.', reachable: new Set(), failedPairs: [] }); return }

    const reachable = bfsReach(hosts[0].id, adj)
    const failed    = hosts.filter(h => !reachable.has(h.id))

    // Check minRedundancy (link count per router)
    const routers = nodes.filter(n => n.type === 'router')
    const underLinked = minRed > 0
      ? routers.filter(r => (adj[r.id]?.length ?? 0) < minRed)
      : []

    const ok = failed.length === 0 && underLinked.length === 0

    const failedPairs: string[] = [
      ...failed.map(h => `${hosts[0].label} cannot reach ${h.label}`),
      ...underLinked.map(r => `${r.label} has fewer than ${minRed} links`),
    ]

    const result: VerifyResult = {
      passed: ok,
      reachable,
      failedPairs,
      message: ok
        ? 'All hosts are reachable — topology is valid!'
        : `Connectivity check failed: ${failedPairs[0]}${failedPairs.length > 1 ? ` (+${failedPairs.length - 1} more)` : ''}`,
    }
    setVerify(result)
    if (ok && !passed) {
      setPassed(true)
      onComplete(true, 0)
    }
  }, [nodes, links, minRed, passed, onComplete])

  function handleReset() {
    setNodes(template.nodes.map(n => ({ ...n })))
    setLinks(new Set())
    setSelected(null)
    setVerify(null)
    setPassed(false)
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]))
  const hosts   = nodes.filter(n => n.type === 'host')

  return (
    <div className="flex flex-col gap-4 w-full max-w-4xl">
      {/* Header */}
      <div className="noc-card p-4 flex flex-col gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="idle">Topology Canvas</Badge>
          <Badge variant="neutral">{links.size} link{links.size !== 1 ? 's' : ''}{maxLinks ? ` / ${maxLinks} max` : ''}</Badge>
          {minRed > 0 && <Badge variant="neutral">Min {minRed} links/router</Badge>}
          <span className="text-noc-muted text-xs ml-auto">{hosts.length} hosts to connect</span>
        </div>
        <p className="text-noc-text text-sm">{template.description}</p>
        <p className="text-noc-muted text-xs">Click a node to select it, then click another to draw a link. Drag to reposition.</p>
      </div>

      {/* Canvas */}
      <div className="noc-card p-1">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          className="w-full rounded bg-noc-bg cursor-default select-none"
          aria-label="Topology canvas"
          onPointerDown={onPointerDownCanvas}
          onPointerMove={onPointerMoveNode}
        >
          {/* Links */}
          {[...links].map(key => {
            const [aId, bId] = key.split(':')
            const a = nodeMap[aId], b = nodeMap[bId]
            if (!a || !b) return null
            const aReach = verify?.reachable.has(aId)
            const bReach = verify?.reachable.has(bId)
            const linkPassed = verify?.passed
            const stroke = linkPassed ? '#3fb950'
              : (verify && aReach && bReach) ? '#3fb950'
              : verify ? '#f78166'
              : '#4d5566'
            return (
              <line key={key}
                x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                stroke={stroke} strokeWidth={2.5} strokeLinecap="round"
              />
            )
          })}

          {/* Wire-in-progress: line from selected node to... nothing (just a hint ring) */}

          {/* Nodes */}
          {nodes.map(node => {
            const isSelected = selected === node.id
            const clr        = NODE_CLR[node.type]
            const reachOk    = verify?.reachable.has(node.id)
            const borderClr  = verify?.passed ? '#3fb950'
              : isSelected ? '#f0f6fc'
              : reachOk ? '#3fb950'
              : verify ? '#f78166'
              : clr

            return (
              <g
                key={node.id}
                onPointerDown={e => onPointerDownNode(e, node.id)}
                onPointerUp={e => onPointerUpNode(e, node.id)}
                style={{ cursor: 'pointer' }}
              >
                {/* Selection / status glow ring */}
                <circle cx={node.x} cy={node.y} r={NODE_R + 6}
                  fill="none"
                  stroke={isSelected ? '#f0f6fc' : (verify ? borderClr : 'none')}
                  strokeWidth={isSelected ? 2.5 : 1.5}
                  opacity={isSelected ? 0.8 : 0.5}
                />

                {/* Node body */}
                {node.type === 'router' ? (
                  <rect
                    x={node.x - NODE_R} y={node.y - NODE_R}
                    width={NODE_R * 2} height={NODE_R * 2} rx={5}
                    fill="#0d1117" stroke={clr} strokeWidth={2}
                  />
                ) : node.type === 'switch' ? (
                  <polygon
                    points={`${node.x},${node.y - NODE_R} ${node.x + NODE_R},${node.y} ${node.x},${node.y + NODE_R} ${node.x - NODE_R},${node.y}`}
                    fill="#0d1117" stroke={clr} strokeWidth={2}
                  />
                ) : (
                  <circle cx={node.x} cy={node.y} r={NODE_R}
                    fill="#0d1117" stroke={clr} strokeWidth={2} />
                )}

                {/* Label inside */}
                <text
                  x={node.x} y={node.y}
                  textAnchor="middle" dominantBaseline="middle"
                  fill={clr} fontSize={9} fontFamily="monospace" fontWeight="bold"
                  style={{ pointerEvents: 'none' }}
                >
                  {node.label}
                </text>
              </g>
            )
          })}

          {/* Hint when a node is selected */}
          {selected && (
            <text x={SVG_W / 2} y={SVG_H - 10} textAnchor="middle"
              fill="#6e7681" fontSize={11} fontFamily="monospace">
              {nodeMap[selected]?.label} selected — click another node to wire
            </text>
          )}
        </svg>
      </div>

      {/* Controls */}
      <div className="noc-card p-4 flex flex-col gap-3">
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" onClick={handleVerify}>Check Reachability</Button>
          <Button size="sm" variant="secondary" onClick={handleReset}>Reset</Button>
        </div>

        {verify && (
          <div className={`rounded px-3 py-2 text-sm ${
            verify.passed
              ? 'bg-link-up/10 border border-link-up text-link-up'
              : 'bg-link-down/10 border border-link-down text-link-down'
          }`}>
            {verify.passed ? '✓ ' : '✗ '}{verify.message}
            {!verify.passed && verify.failedPairs.length > 0 && (
              <ul className="mt-1 text-xs list-disc list-inside opacity-80">
                {verify.failedPairs.map((p, i) => <li key={i}>{p}</li>)}
              </ul>
            )}
          </div>
        )}

        {/* Legend */}
        <div className="flex gap-4 flex-wrap text-xs text-noc-muted font-mono">
          <span><span style={{ color: '#58a6ff' }}>■</span> Router</span>
          <span><span style={{ color: '#3fb950' }}>●</span> Host</span>
          <span><span style={{ color: '#bc8cff' }}>◆</span> Switch</span>
        </div>
      </div>
    </div>
  )
}
