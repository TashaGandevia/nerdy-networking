// C-L04 Service Chain
// A packet flows from a host to a server. The player orders VNFs (firewall,
// NAT, IDS, load-balancer, ...) into a chain; we check that tenant traffic
// passes through the required VNFs in the right order while other traffic
// bypasses. Bypass traffic is enforced by a final "match: rest → bypass" rule.

import { useEffect, useMemo, useState } from 'react'
import type { Level } from '@/types'
import { Button } from '@/components/ui/Button'
import { Badge }  from '@/components/ui/Badge'

interface Props { level: Level; onComplete: (passed: boolean, hintsUsed: number) => void }

type VNF = 'firewall' | 'nat' | 'ids' | 'load-balancer'

const VNF_LABELS: Record<VNF, string> = {
  'firewall':      'Firewall (stateful, drop unauthorised)',
  'nat':           'NAT (private → public rewrite)',
  'ids':           'IDS (deep packet inspection)',
  'load-balancer': 'Load Balancer (pick backend)',
}

interface Scenario {
  /** The required ordered chain for the tenant. */
  required: VNF[]
  /** Pool of available VNFs the player can choose from (shuffled superset). */
  pool:     VNF[]
}

function rand(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min }

function shuffle<T>(a: T[]): T[] {
  const out = [...a]
  for (let i = out.length - 1; i > 0; i--) {
    const j = rand(0, i); [out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

function makeScenario(): Scenario {
  // Pick 2-3 VNFs in a meaningful order. Firewall must precede NAT in classic chains.
  const variants: VNF[][] = [
    ['firewall', 'nat'],
    ['firewall', 'ids', 'nat'],
    ['firewall', 'load-balancer'],
    ['ids', 'load-balancer'],
  ]
  const required = variants[rand(0, variants.length - 1)]
  const pool     = shuffle(['firewall', 'nat', 'ids', 'load-balancer'])
  return { required, pool }
}

const HINTS = [
  'A service chain is an ordered list — packets visit each VNF in the order you arrange them.',
  'Convention: filter / inspect *before* address translation. Firewall and IDS run on the original headers; NAT and LB rewrite them.',
]

export function ServiceChainMode({ level, onComplete }: Props) {
  const [scenarioKey, setScenarioKey] = useState(0)
  const scenario = useMemo(() => makeScenario(), [scenarioKey])
  const [chain, setChain] = useState<VNF[]>([])
  useEffect(() => { setChain([]) }, [scenario])
  const [hintIdx, setHintIdx] = useState(0)

  function reset() { setScenarioKey(k => k + 1); setHintIdx(0) }

  function add(v: VNF) {
    if (chain.includes(v)) return
    setChain((c) => [...c, v])
  }
  function remove(idx: number) { setChain((c) => c.filter((_, i) => i !== idx)) }
  function move(idx: number, dir: -1 | 1) {
    setChain((c) => {
      const j = idx + dir
      if (j < 0 || j >= c.length) return c
      const out = [...c]
      ;[out[idx], out[j]] = [out[j], out[idx]]
      return out
    })
  }

  const passed = chain.length === scenario.required.length
              && chain.every((v, i) => v === scenario.required[i])

  return (
    <div className="noc-card p-6 flex flex-col gap-4">
      <p className="text-noc-muted text-xs uppercase tracking-widest">Match-Action · Service Chain</p>
      <h2 className="text-noc-bright text-lg font-semibold">{level.title}</h2>
      <p className="text-noc-text text-sm">{level.intent}</p>

      <div className="flex gap-2 flex-wrap">
        <Badge variant="idle">Tenant traffic must traverse {scenario.required.length} VNFs</Badge>
      </div>

      {/* Available VNFs */}
      <div>
        <p className="text-noc-muted text-xs mb-1">Available VNFs (click to add):</p>
        <div className="flex flex-wrap gap-2">
          {scenario.pool.map((v) => {
            const used = chain.includes(v)
            return (
              <button
                key={v}
                onClick={() => add(v)}
                disabled={used}
                className={`text-xs px-3 py-1.5 rounded border transition-colors font-mono ${
                  used
                    ? 'border-noc-border text-noc-muted opacity-50'
                    : 'border-noc-border text-noc-text hover:border-link-packet hover:text-link-packet'
                }`}
              >
                + {v}
              </button>
            )
          })}
        </div>
      </div>

      {/* Current chain */}
      <div className="border border-noc-border rounded p-3">
        <p className="text-noc-muted text-xs mb-2">Chain order: HOST →</p>
        {chain.length === 0 && (
          <p className="text-noc-muted text-xs italic">No VNFs yet — packets go directly to the server.</p>
        )}
        <div className="flex flex-col gap-1">
          {chain.map((v, i) => (
            <div key={i} className="flex items-center gap-2 border border-noc-border rounded px-3 py-2">
              <span className="text-noc-muted text-xs font-mono">#{i + 1}</span>
              <span className="text-noc-bright text-sm flex-1 font-mono">{v}</span>
              <span className="text-noc-muted text-xs hidden sm:inline">{VNF_LABELS[v]}</span>
              <button onClick={() => move(i, -1)} className="text-noc-muted hover:text-noc-text">↑</button>
              <button onClick={() => move(i, +1)} className="text-noc-muted hover:text-noc-text">↓</button>
              <button onClick={() => remove(i)}   className="text-link-down hover:text-noc-bright">✕</button>
            </div>
          ))}
        </div>
        {chain.length > 0 && <p className="text-noc-muted text-xs mt-2">→ SERVER</p>}
      </div>

      <p className={`text-sm ${passed ? 'text-link-up' : 'text-link-down'}`}>
        {passed
          ? '✓ Chain matches the required policy.'
          : chain.length === 0
            ? 'Build a chain that visits all required VNFs in order.'
            : `Mismatch — required: ${scenario.required.join(' → ')}.`}
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
