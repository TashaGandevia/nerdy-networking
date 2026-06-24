// D-L01 VLAN Port Assignment
// Player tags each switch port to a VLAN. Hosts on the same VLAN can ping
// each other; cross-VLAN traffic is dropped. Live test runs all host pairs.

import { useEffect, useMemo, useState } from 'react'
import type { Level } from '@/types'
import { Button } from '@/components/ui/Button'
import { Badge }  from '@/components/ui/Badge'

interface Props { level: Level; onComplete: (passed: boolean, hintsUsed: number) => void }

interface Host {
  port: number
  name: string
  vlan: number
}
interface Scenario {
  numPorts: number
  hosts:    Host[]
  vlans:    number[]
}

function rand(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min }

function makeScenario(): Scenario {
  const numPorts  = rand(6, 8)
  const vlans     = [10, 20, 30].slice(0, rand(2, 3))
  const hostNames = ['Alice', 'Bob', 'Carol', 'Dan', 'Eve', 'Frank', 'Grace', 'Helen']
  const portsAvailable = Array.from({ length: numPorts }, (_, i) => i + 1)
  for (let i = portsAvailable.length - 1; i > 0; i--) {
    const j = rand(0, i); [portsAvailable[i], portsAvailable[j]] = [portsAvailable[j], portsAvailable[i]]
  }
  const numHosts = Math.max(vlans.length * 2, Math.min(numPorts, rand(4, numPorts)))
  const hosts: Host[] = []
  for (let i = 0; i < numHosts; i++) {
    hosts.push({ port: portsAvailable[i], name: hostNames[i], vlan: vlans[i % vlans.length] })
  }
  return { numPorts, hosts, vlans }
}

const HINTS = [
  'Two hosts can only reach each other if both their access ports are tagged into the same VLAN.',
  'Read each host\'s required VLAN from the badge next to its name, then assign that port to the matching VLAN.',
]

function evaluatePairs(scenario: Scenario, portVlans: Record<number, number>): { passed: boolean; results: string[] } {
  const results: string[] = []
  let ok = true
  for (let i = 0; i < scenario.hosts.length; i++) {
    for (let j = i + 1; j < scenario.hosts.length; j++) {
      const a = scenario.hosts[i], b = scenario.hosts[j]
      const sameVlanRequired = a.vlan === b.vlan
      const sameVlanActual   = portVlans[a.port] === portVlans[b.port] && portVlans[a.port] !== 0
      const passed           = sameVlanRequired === sameVlanActual
      if (!passed) ok = false
      results.push(
        `${a.name} ↔ ${b.name}: ${sameVlanRequired ? 'should reach' : 'should be isolated'} · ` +
        `${sameVlanActual ? 'reachable' : 'isolated'} · ${passed ? '✓' : '✗'}`,
      )
    }
  }
  return { passed: ok, results }
}

export function VlanPortMode({ level, onComplete }: Props) {
  const [scenarioKey, setScenarioKey] = useState(0)
  const scenario = useMemo(() => makeScenario(), [scenarioKey])
  const [portVlans, setPortVlans] = useState<Record<number, number>>({})
  useEffect(() => { setPortVlans({}) }, [scenario])

  const [hintIdx, setHintIdx] = useState(0)

  function reset() { setScenarioKey(k => k + 1); setHintIdx(0) }

  const { passed, results } = evaluatePairs(scenario, portVlans)
  const hostByPort = Object.fromEntries(scenario.hosts.map(h => [h.port, h]))

  return (
    <div className="noc-card p-6 flex flex-col gap-4">
      <p className="text-noc-muted text-xs uppercase tracking-widest">VLAN Port Assignment</p>
      <h2 className="text-noc-bright text-lg font-semibold">{level.title}</h2>
      <p className="text-noc-text text-sm">{level.intent}</p>

      <div className="flex gap-2 flex-wrap">
        <Badge variant="idle">{scenario.numPorts} switch ports</Badge>
        <Badge variant="idle">VLANs: {scenario.vlans.join(', ')}</Badge>
        <Badge variant="idle">{scenario.hosts.length} hosts</Badge>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {Array.from({ length: scenario.numPorts }, (_, i) => i + 1).map((port) => {
          const host = hostByPort[port]
          const v    = portVlans[port] ?? 0
          return (
            <div key={port} className="border border-noc-border rounded p-2 text-xs">
              <p className="text-noc-muted font-mono">Port {port}</p>
              {host ? (
                <p className="text-noc-bright">
                  {host.name}
                  <span className="ml-2 text-noc-muted">(needs VLAN {host.vlan})</span>
                </p>
              ) : (
                <p className="text-noc-muted italic">(no host)</p>
              )}
              <select
                value={v}
                onChange={(e) => setPortVlans((p) => ({ ...p, [port]: parseInt(e.target.value) }))}
                className="mt-1 w-full bg-noc-bg border border-noc-border text-noc-text rounded px-2 py-1"
              >
                <option value={0}>— unassigned —</option>
                {scenario.vlans.map((vl) => (
                  <option key={vl} value={vl}>VLAN {vl}</option>
                ))}
              </select>
            </div>
          )
        })}
      </div>

      <div className="border border-noc-border rounded px-3 py-2 max-h-48 overflow-y-auto text-xs font-mono space-y-0.5">
        {results.map((r, i) => (
          <p key={i} className={r.endsWith('✓') ? 'text-link-up' : 'text-link-down'}>{r}</p>
        ))}
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
