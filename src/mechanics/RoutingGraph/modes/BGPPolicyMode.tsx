// B-L06 BGP Policy Boss — Four ASes: your AS, a customer, a peer, and a provider.
// Player picks an export policy per neighbor. Win:
//   1. Customer's traffic reaches its destination through your backbone.
//   2. You do not leak customer routes to your peer or provider.
// (Classic "no transit between non-customers" policy.)

import { useEffect, useMemo, useState } from 'react'
import type { Level } from '@/types'
import { Button } from '@/components/ui/Button'
import { Badge }  from '@/components/ui/Badge'
import type { Graph } from '@/utils/graph'
import { GraphCanvas, type NodePos } from '../GraphCanvas'

interface Props {
  level: Level
  onComplete: (passed: boolean, hintsUsed: number) => void
}

type Relationship = 'customer' | 'peer' | 'provider'
type ExportTo     = 'all' | 'customers-only' | 'none'

interface NeighborConfig {
  id:           string
  label:        string
  relationship: Relationship
  exportTo:     ExportTo
}

interface Scenario {
  nodes:     NodePos[]
  graph:     Graph
  you:       string
  neighbors: NeighborConfig[]
}

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function shuffle<T>(a: T[]): T[] {
  const out = [...a]
  for (let i = out.length - 1; i > 0; i--) {
    const j = rand(0, i)
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

function makeScenario(): Scenario {
  // Always: 1 customer, 1 peer, 1 provider — but randomize which AS plays which role.
  const ases = shuffle(['AS-100', 'AS-200', 'AS-300']) as [string, string, string]
  const roles: Relationship[] = ['customer', 'peer', 'provider']
  return {
    nodes: [
      { id: 'YOU',   label: 'YOU',   x: 320, y: 160 },
      { id: ases[0], label: ases[0], x: 100, y: 80  },
      { id: ases[1], label: ases[1], x: 540, y: 160 },
      { id: ases[2], label: ases[2], x: 100, y: 240 },
    ],
    graph: {
      nodes: [
        { id: 'YOU',   label: 'YOU'   },
        { id: ases[0], label: ases[0] },
        { id: ases[1], label: ases[1] },
        { id: ases[2], label: ases[2] },
      ],
      edges: [
        { from: 'YOU', to: ases[0], weight: 1, up: true },
        { from: 'YOU', to: ases[1], weight: 1, up: true },
        { from: 'YOU', to: ases[2], weight: 1, up: true },
      ],
    },
    you: 'YOU',
    neighbors: ases.map((id, i) => ({
      id, label: id, relationship: roles[i], exportTo: 'none' as ExportTo,
    })),
  }
}

const HINTS = [
  'You earn revenue from customers, you split costs with peers, you pay your provider — the export rule follows the money.',
  '"Valley-free routing" rule of thumb: only re-advertise customer prefixes to *everyone* (you make money on them); only re-advertise peer and provider prefixes to *customers*.',
]

const REL_BADGE: Record<Relationship, { label: string; variant: 'up' | 'idle' | 'down' }> = {
  customer: { label: 'customer',  variant: 'up'   },
  peer:     { label: 'peer',      variant: 'idle' },
  provider: { label: 'provider',  variant: 'down' },
}

function evaluatePolicy(neighbors: NeighborConfig[]): { passed: boolean; reasons: string[] } {
  const reasons: string[] = []
  const customer = neighbors.find((n) => n.relationship === 'customer')!
  const peer     = neighbors.find((n) => n.relationship === 'peer')!
  const provider = neighbors.find((n) => n.relationship === 'provider')!

  // Customer routes must be exported to *all* (so peers/providers can reach customer prefixes).
  if (customer.exportTo !== 'all') {
    reasons.push('You are not advertising customer routes to everyone — customer traffic will be unreachable.')
  }
  // Peer routes leak if exported to provider (you would pay your provider to carry peer traffic).
  if (peer.exportTo === 'all') {
    reasons.push('Peer routes are leaking to your provider — you would be paying to transit peer traffic.')
  }
  // Provider routes leak if exported to peer (similar — and may be a route-leak incident).
  if (provider.exportTo === 'all') {
    reasons.push('Provider routes are leaking to your peer — classic route-leak misconfiguration.')
  }
  // Customer must export get peer + provider routes (export their prefixes back to customer).
  if (peer.exportTo === 'none' && provider.exportTo === 'none') {
    reasons.push('Your customer cannot reach the rest of the Internet — export peer/provider routes to them.')
  }
  return { passed: reasons.length === 0, reasons }
}

export function BGPPolicyMode({ level, onComplete }: Props) {
  const [scenarioKey, setScenarioKey] = useState(0)
  const scenario = useMemo(() => makeScenario(), [scenarioKey])

  const [neighbors, setNeighbors] = useState<NeighborConfig[]>(scenario.neighbors)
  // Reset config when scenario changes
  useEffect(() => { setNeighbors(scenario.neighbors) }, [scenario])

  const [submitted, setSubmitted] = useState(false)
  const [hintIdx,   setHintIdx]   = useState(0)
  const result = evaluatePolicy(neighbors)

  function reset() {
    setScenarioKey((k) => k + 1)
    setSubmitted(false)
    setHintIdx(0)
  }

  function update(id: string, exportTo: ExportTo) {
    setNeighbors((prev) => prev.map((n) => (n.id === id ? { ...n, exportTo } : n)))
  }

  return (
    <div className="noc-card p-6 flex flex-col gap-4">
      <p className="text-noc-muted text-xs uppercase tracking-widest">BGP policy boss</p>
      <h2 className="text-noc-bright text-lg font-semibold">{level.title}</h2>
      <p className="text-noc-text text-sm">{level.intent}</p>

      <div className="flex gap-2 flex-wrap">
        <Badge variant="idle">YOU = your AS</Badge>
        {neighbors.map((n) => (
          <Badge key={n.id} variant={REL_BADGE[n.relationship].variant}>
            {n.label} = {REL_BADGE[n.relationship].label}
          </Badge>
        ))}
      </div>

      <GraphCanvas nodes={scenario.nodes} graph={scenario.graph} />

      <div className="flex flex-col gap-2">
        {neighbors.map((n) => (
          <div key={n.id} className="border border-noc-border rounded px-3 py-2 grid grid-cols-[1fr_auto] gap-2 items-center">
            <div>
              <span className="text-noc-bright font-mono">{n.label}</span>
              <span className="text-noc-muted text-xs ml-2">({REL_BADGE[n.relationship].label})</span>
            </div>
            <select
              value={n.exportTo}
              onChange={(e) => update(n.id, e.target.value as ExportTo)}
              disabled={submitted}
              className="bg-noc-bg border border-noc-border text-noc-text text-xs rounded px-2 py-1"
            >
              <option value="none">Don't export their routes</option>
              <option value="customers-only">Export to customers only</option>
              <option value="all">Export to everyone</option>
            </select>
          </div>
        ))}
      </div>

      {submitted && (
        <div className={`text-sm ${result.passed ? 'text-link-up' : 'text-link-down'}`}>
          {result.passed
            ? 'Policy is valley-free and revenue-safe.'
            : (
              <ul className="list-disc list-inside">
                {result.reasons.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            )}
        </div>
      )}

      {hintIdx > 0 && (
        <div className="border border-noc-border rounded px-3 py-2 flex flex-col gap-1">
          {HINTS.slice(0, hintIdx).map((h, i) => (
            <p key={i} className="text-noc-muted text-xs">💡 {h}</p>
          ))}
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {!submitted && (
          <Button size="sm" onClick={() => setSubmitted(true)}>Submit policy</Button>
        )}
        {submitted && (
          <Button size="sm" disabled={!result.passed} onClick={() => onComplete(true, hintIdx)}>
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
