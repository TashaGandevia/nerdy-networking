// E-L02 LPM Forwarding Table
// Player adds entries to an ipv4_lpm table. Each entry: prefix → port.
// We run test packets through longest-prefix-match and check they hit the
// expected egress port. Random scenario assigns prefixes + dest IPs each play.

import { useEffect, useMemo, useState } from 'react'
import type { Level } from '@/types'
import { Button } from '@/components/ui/Button'
import { Badge }  from '@/components/ui/Badge'

interface Props { level: Level; onComplete: (passed: boolean, hintsUsed: number) => void }

interface PrefixSpec {
  cidr:   string   // e.g. "10.0.1.0/24"
  port:   number
}

interface Packet {
  id:           string
  dst:          string
  expectedPort: number   // 0 = should be dropped (no match)
}

interface Scenario {
  prefixes: PrefixSpec[]    // ground truth
  packets:  Packet[]
}

function rand(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min }

function ipToInt(ip: string): number {
  return ip.split('.').reduce((acc, o) => (acc << 8) | parseInt(o, 10), 0) >>> 0
}

function matches(ip: string, cidr: string): boolean {
  const [net, plenStr] = cidr.split('/')
  const plen           = parseInt(plenStr, 10)
  const mask           = plen === 0 ? 0 : (~0 << (32 - plen)) >>> 0
  return ((ipToInt(ip) & mask) >>> 0) === ((ipToInt(net) & mask) >>> 0)
}

function lpm(ip: string, entries: PrefixSpec[]): number | null {
  let best: PrefixSpec | null = null
  let bestPlen = -1
  for (const e of entries) {
    const plen = parseInt(e.cidr.split('/')[1], 10)
    if (matches(ip, e.cidr) && plen > bestPlen) { best = e; bestPlen = plen }
  }
  return best ? best.port : null
}

function makeScenario(): Scenario {
  const o2 = rand(0, 255)
  const prefixes: PrefixSpec[] = [
    { cidr: `10.${o2}.1.0/24`,   port: 1 },
    { cidr: `10.${o2}.2.0/24`,   port: 2 },
    { cidr: `10.${o2}.0.0/16`,   port: 3 },     // broader; LPM should prefer /24s when they match
  ]
  const packets: Packet[] = [
    { id: 'p1', dst: `10.${o2}.1.${rand(2, 250)}`, expectedPort: 1 },
    { id: 'p2', dst: `10.${o2}.2.${rand(2, 250)}`, expectedPort: 2 },
    { id: 'p3', dst: `10.${o2}.${rand(3, 9)}.${rand(2, 250)}`, expectedPort: 3 },
    { id: 'p4', dst: `192.168.${rand(0, 255)}.${rand(2, 250)}`, expectedPort: 0 },     // no match
  ]
  return { prefixes, packets }
}

const HINTS = [
  'Longest-prefix match: if two entries match the same packet, the one with the longer prefix wins.',
  'You need a default-drop for IPs that match none of the prefixes — leave it out and unmatched packets just have no decision (which counts as drop here).',
]

interface Entry { id: string; cidr: string; port: number }

export function LpmTableMode({ level, onComplete }: Props) {
  const [scenarioKey, setScenarioKey] = useState(0)
  const scenario = useMemo(() => makeScenario(), [scenarioKey])
  const [entries, setEntries] = useState<Entry[]>([])
  useEffect(() => { setEntries([]) }, [scenario])
  const [hintIdx, setHintIdx] = useState(0)

  function reset() { setScenarioKey(k => k + 1); setHintIdx(0) }

  const portOptions = [1, 2, 3, 4]
  const cidrOptions = scenario.prefixes.map(p => p.cidr)

  function addEntry() {
    setEntries(es => [...es, { id: `e-${Date.now()}`, cidr: cidrOptions[0], port: 1 }])
  }
  function updateEntry(id: string, patch: Partial<Entry>) {
    setEntries(es => es.map(e => e.id === id ? { ...e, ...patch } : e))
  }
  function removeEntry(id: string) {
    setEntries(es => es.filter(e => e.id !== id))
  }

  const results = scenario.packets.map(p => {
    const port = lpm(p.dst, entries.map(e => ({ cidr: e.cidr, port: e.port }))) ?? 0
    return { pkt: p, got: port, ok: port === p.expectedPort }
  })
  const passed = results.every(r => r.ok)

  return (
    <div className="noc-card p-6 flex flex-col gap-4">
      <p className="text-noc-muted text-xs uppercase tracking-widest">P4 Ingress · ipv4_lpm</p>
      <h2 className="text-noc-bright text-lg font-semibold">{level.title}</h2>
      <p className="text-noc-text text-sm">{level.intent}</p>

      <div className="flex gap-2 flex-wrap">
        <Badge variant="idle">Available prefixes: {cidrOptions.join(', ')}</Badge>
        <Badge variant="idle">Available ports: {portOptions.join(', ')}</Badge>
      </div>

      {/* Editor */}
      <div className="border border-noc-border rounded p-3 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="text-noc-bright text-sm font-semibold">ipv4_lpm entries</p>
          <Button size="sm" variant="ghost" onClick={addEntry}>+ Add entry</Button>
        </div>
        {entries.length === 0 && (
          <p className="text-noc-muted text-xs italic">No entries — all packets dropped.</p>
        )}
        {entries.map(e => (
          <div key={e.id} className="border border-noc-border rounded px-3 py-2 grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center text-xs font-mono">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-noc-muted">match dst_ip lpm</span>
              <select value={e.cidr} onChange={(ev) => updateEntry(e.id, { cidr: ev.target.value })}
                      className="bg-noc-bg border border-noc-border text-noc-text rounded px-2 py-0.5">
                {cidrOptions.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <span className="text-noc-muted">→ forward(port=</span>
              <select value={e.port} onChange={(ev) => updateEntry(e.id, { port: parseInt(ev.target.value) })}
                      className="bg-noc-bg border border-noc-border text-noc-text rounded px-2 py-0.5">
                {portOptions.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <span className="text-noc-muted">)</span>
            </div>
            <button onClick={() => removeEntry(e.id)} className="text-link-down hover:text-noc-bright">✕</button>
            <span />
            <span />
          </div>
        ))}
      </div>

      {/* Test packets */}
      <div className="border border-noc-border rounded overflow-hidden">
        <table className="w-full text-xs font-mono">
          <thead className="bg-noc-bg text-noc-muted">
            <tr>
              <th className="text-left px-2 py-1">Packet</th>
              <th className="text-left px-2 py-1">dst_ip</th>
              <th className="text-right px-2 py-1">expected</th>
              <th className="text-right px-2 py-1">got</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {results.map((r, i) => (
              <tr key={i} className="border-t border-noc-border">
                <td className="px-2 py-1">{r.pkt.id}</td>
                <td className="px-2 py-1">{r.pkt.dst}</td>
                <td className="px-2 py-1 text-right">{r.pkt.expectedPort === 0 ? 'drop' : `port ${r.pkt.expectedPort}`}</td>
                <td className="px-2 py-1 text-right">{r.got === 0 ? 'drop' : `port ${r.got}`}</td>
                <td className={`px-2 py-1 ${r.ok ? 'text-link-up' : 'text-link-down'}`}>{r.ok ? '✓' : '✗'}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
        <Badge variant="idle">{results.filter(r => r.ok).length} / {results.length} correct</Badge>
      </div>
    </div>
  )
}
