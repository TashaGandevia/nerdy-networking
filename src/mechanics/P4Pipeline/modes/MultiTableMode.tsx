// E-L04 Multi-Table Pipeline
// Player composes the ingress control block by ordering tables. Two tables
// (ipv4_lpm, mac_fwd) must both apply; order matters because ipv4_lpm picks
// the egress port and mac_fwd rewrites L2 headers on egress.

import { useEffect, useMemo, useState } from 'react'
import type { Level } from '@/types'
import { Button } from '@/components/ui/Button'
import { Badge }  from '@/components/ui/Badge'

interface Props { level: Level; onComplete: (passed: boolean, hintsUsed: number) => void }

type TableId = 'ipv4_lpm' | 'mac_fwd' | 'vlan_tag' | 'firewall'

interface Scenario {
  required: TableId[]      // correct order
  pool:     TableId[]      // includes a couple of distractors
  rationale: string
}

const TABLE_LABEL: Record<TableId, string> = {
  ipv4_lpm:  'ipv4_lpm.apply()      — pick egress port',
  mac_fwd:   'mac_fwd.apply()       — rewrite src/dst MAC',
  vlan_tag:  'vlan_tag.apply()      — push VLAN tag',
  firewall:  'firewall.apply()      — drop unauthorised',
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
  // Two plausible variants — both have ipv4_lpm before mac_fwd
  const variants: Scenario['required'][] = [
    ['firewall', 'ipv4_lpm', 'mac_fwd'],
    ['ipv4_lpm', 'mac_fwd'],
  ]
  const required = variants[rand(0, variants.length - 1)]
  const pool     = shuffle<TableId>(['ipv4_lpm', 'mac_fwd', 'vlan_tag', 'firewall'])
  return {
    required,
    pool,
    rationale: 'ipv4_lpm picks the egress port from dst_ip; mac_fwd rewrites the L2 addresses for the next hop — so LPM must apply first.',
  }
}

const HINTS = [
  'Each .apply() call hands the packet to the next table in order. Think about which table\'s decision *depends on* another\'s.',
  'Filters/policy belong before forwarding; L2 rewrites belong after the egress port is known.',
]

export function MultiTableMode({ level, onComplete }: Props) {
  const [scenarioKey, setScenarioKey] = useState(0)
  const scenario = useMemo(() => makeScenario(), [scenarioKey])
  const [chain,   setChain]   = useState<TableId[]>([])
  useEffect(() => { setChain([]) }, [scenario])
  const [hintIdx, setHintIdx] = useState(0)

  function reset() { setScenarioKey(k => k + 1); setHintIdx(0) }

  function add(t: TableId) {
    if (chain.includes(t)) return
    setChain(c => [...c, t])
  }
  function remove(i: number) { setChain(c => c.filter((_, ix) => ix !== i)) }
  function move(i: number, dir: -1 | 1) {
    setChain(c => {
      const j = i + dir
      if (j < 0 || j >= c.length) return c
      const out = [...c]; [out[i], out[j]] = [out[j], out[i]]; return out
    })
  }

  const passed = chain.length === scenario.required.length
              && chain.every((t, i) => t === scenario.required[i])

  return (
    <div className="noc-card p-6 flex flex-col gap-4">
      <p className="text-noc-muted text-xs uppercase tracking-widest">P4 control · ingress</p>
      <h2 className="text-noc-bright text-lg font-semibold">{level.title}</h2>
      <p className="text-noc-text text-sm">{level.intent}</p>

      <div>
        <p className="text-noc-muted text-xs mb-1">Tables in scope:</p>
        <div className="flex flex-wrap gap-2">
          {scenario.pool.map((t) => {
            const used = chain.includes(t)
            const isReq = scenario.required.includes(t)
            return (
              <button key={t} onClick={() => add(t)} disabled={used}
                      className={`text-xs px-3 py-1.5 rounded border transition-colors font-mono ${
                        used ? 'border-noc-border text-noc-muted opacity-50'
                             : 'border-noc-border text-noc-text hover:border-link-packet hover:text-link-packet'
                      }`}>
                + {t}{!isReq ? '' : ''}
              </button>
            )
          })}
        </div>
      </div>

      <div className="border border-noc-border rounded p-3">
        <p className="text-noc-bright text-sm font-semibold">control ingress {'{'}</p>
        {chain.length === 0 && (
          <p className="text-noc-muted text-xs italic pl-3">(empty pipeline)</p>
        )}
        {chain.map((t, i) => (
          <div key={i} className="flex items-center gap-2 pl-3 py-1 text-xs font-mono">
            <span className="text-noc-muted">  {i + 1}.</span>
            <span className="text-noc-text flex-1">{TABLE_LABEL[t]};</span>
            <button onClick={() => move(i, -1)} className="text-noc-muted hover:text-noc-text">↑</button>
            <button onClick={() => move(i, +1)} className="text-noc-muted hover:text-noc-text">↓</button>
            <button onClick={() => remove(i)} className="text-link-down">✕</button>
          </div>
        ))}
        <p className="text-noc-bright text-sm font-semibold">{'}'}</p>
      </div>

      <p className={`text-sm ${passed ? 'text-link-up' : 'text-link-down'}`}>
        {passed
          ? '✓ Pipeline matches the required composition.'
          : `Required order: ${scenario.required.join(' → ')}.`}
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
        <Badge variant="idle">Required tables: {scenario.required.length}</Badge>
      </div>
    </div>
  )
}
