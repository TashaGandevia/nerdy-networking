// C-L01 Install Your First Flow
// Player adds match-action rules on a single switch so a packet from one host
// reaches another. Live evaluator runs a test packet through the rules.

import { useMemo, useState } from 'react'
import type { Level } from '@/types'
import { Button } from '@/components/ui/Button'

interface Props { level: Level; onComplete: (passed: boolean, hintsUsed: number) => void }

interface Scenario {
  hostA: { name: string; ip: string; port: number }
  hostB: { name: string; ip: string; port: number }
}

interface Rule {
  id:      string
  matchIp: string      // '' = wildcard
  action:  'forward' | 'drop'
  outPort: number      // ignored if drop
}

function rand(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min }

function makeScenario(): Scenario {
  const o3 = rand(0, 255)
  return {
    hostA: { name: 'H-A', ip: `10.0.${o3}.${rand(2, 9)}`,   port: rand(1, 2) },
    hostB: { name: 'H-B', ip: `10.0.${o3}.${rand(10, 99)}`, port: rand(3, 4) },
  }
}

const HINTS = [
  'A rule needs a match (which packets it applies to) and an action (what to do). For a one-way flow, match on the destination IP.',
  'Order matters — the controller installs rules in priority order. A "drop everything" rule must come last.',
]

function evaluate(scenario: Scenario, rules: Rule[]): { delivered: boolean; outPort: number | null; appliedRule: string | null } {
  // Test packet: H-A → H-B (entering on port hostA.port)
  for (const r of rules) {
    if (r.matchIp === '' || r.matchIp === scenario.hostB.ip) {
      if (r.action === 'drop') return { delivered: false, outPort: null, appliedRule: r.id }
      return {
        delivered: r.outPort === scenario.hostB.port,
        outPort:   r.outPort,
        appliedRule: r.id,
      }
    }
  }
  return { delivered: false, outPort: null, appliedRule: null }
}

export function InstallFirstFlowMode({ level, onComplete }: Props) {
  const [scenarioKey, setScenarioKey] = useState(0)
  const scenario = useMemo(() => makeScenario(), [scenarioKey])
  const [rules,   setRules]    = useState<Rule[]>([])
  const [hintIdx, setHintIdx]  = useState(0)

  function reset() {
    setScenarioKey(k => k + 1)
    setRules([])
    setHintIdx(0)
  }

  function addRule() {
    setRules(rs => [...rs, { id: `r-${Date.now()}`, matchIp: scenario.hostB.ip, action: 'forward', outPort: scenario.hostB.port }])
  }
  function updateRule(id: string, patch: Partial<Rule>) {
    setRules(rs => rs.map(r => r.id === id ? { ...r, ...patch } : r))
  }
  function removeRule(id: string) { setRules(rs => rs.filter(r => r.id !== id)) }
  function moveRule(id: string, dir: -1 | 1) {
    setRules(rs => {
      const i = rs.findIndex(r => r.id === id)
      const j = i + dir
      if (i < 0 || j < 0 || j >= rs.length) return rs
      const out = [...rs]
      ;[out[i], out[j]] = [out[j], out[i]]
      return out
    })
  }

  const result = evaluate(scenario, rules)
  const passed = result.delivered

  return (
    <div className="noc-card p-6 flex flex-col gap-4">
      <p className="text-noc-muted text-xs uppercase tracking-widest">Match-Action · Install First Flow</p>
      <h2 className="text-noc-bright text-lg font-semibold">{level.title}</h2>
      <p className="text-noc-text text-sm">{level.intent}</p>

      {/* Scenario header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
        <Card title={`${scenario.hostA.name} (port ${scenario.hostA.port})`} value={scenario.hostA.ip} />
        <Card title={`${scenario.hostB.name} (port ${scenario.hostB.port})`} value={scenario.hostB.ip} />
      </div>

      {/* Switch + rules */}
      <div className="border border-noc-border rounded p-3 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="text-noc-bright text-sm font-semibold">SWITCH-1 flow table</p>
          <Button size="sm" variant="ghost" onClick={addRule}>+ Add rule</Button>
        </div>
        {rules.length === 0 && (
          <p className="text-noc-muted text-xs italic">No rules — packet falls through, no forwarding decision.</p>
        )}
        {rules.map((r, i) => (
          <div key={r.id} className="border border-noc-border rounded px-3 py-2 grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-2 items-center text-xs">
            <span className="text-noc-muted font-mono">#{i + 1}</span>
            <div className="flex flex-wrap items-center gap-1 font-mono">
              <span className="text-noc-muted">match:</span>
              <select value={r.matchIp} onChange={(e) => updateRule(r.id, { matchIp: e.target.value })}
                      className="bg-noc-bg border border-noc-border text-noc-text rounded px-1 py-0.5">
                <option value="">* (any)</option>
                <option value={scenario.hostA.ip}>dst={scenario.hostA.ip}</option>
                <option value={scenario.hostB.ip}>dst={scenario.hostB.ip}</option>
              </select>
              <span className="text-noc-muted">→ action:</span>
              <select value={r.action} onChange={(e) => updateRule(r.id, { action: e.target.value as Rule['action'] })}
                      className="bg-noc-bg border border-noc-border text-noc-text rounded px-1 py-0.5">
                <option value="forward">forward</option>
                <option value="drop">drop</option>
              </select>
              {r.action === 'forward' && (
                <>
                  <span className="text-noc-muted">port</span>
                  <select value={r.outPort} onChange={(e) => updateRule(r.id, { outPort: parseInt(e.target.value) })}
                          className="bg-noc-bg border border-noc-border text-noc-text rounded px-1 py-0.5">
                    {[1, 2, 3, 4].map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </>
              )}
            </div>
            <button onClick={() => moveRule(r.id, -1)} className="text-noc-muted hover:text-noc-text">↑</button>
            <button onClick={() => moveRule(r.id, +1)} className="text-noc-muted hover:text-noc-text">↓</button>
            <button onClick={() => removeRule(r.id)} className="text-link-down hover:text-noc-bright">✕</button>
            <span className={`text-xs font-mono ${result.appliedRule === r.id ? 'text-link-up' : 'text-noc-muted'}`}>
              {result.appliedRule === r.id ? '◀ matched' : ''}
            </span>
          </div>
        ))}
      </div>

      {/* Test packet result */}
      <div className={`border rounded px-3 py-2 text-sm ${
        passed ? 'border-link-up text-link-up' : 'border-link-down text-link-down'
      }`}>
        Test: {scenario.hostA.name} → {scenario.hostB.name} ({scenario.hostB.ip}) ·{' '}
        {result.delivered
          ? `delivered out port ${result.outPort}`
          : result.outPort !== null
            ? `forwarded to wrong port ${result.outPort} (expected ${scenario.hostB.port})`
            : result.appliedRule
              ? 'dropped'
              : 'no matching rule'}
      </div>

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

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div className="border border-noc-border rounded px-3 py-2">
      <p className="text-noc-muted">{title}</p>
      <p className="text-noc-bright text-base">{value}</p>
    </div>
  )
}
