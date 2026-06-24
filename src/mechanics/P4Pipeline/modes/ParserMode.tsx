// E-L01 Build the Parser
// Player connects parser states (start → ethernet → ipv4 → tcp/udp) by
// choosing the next state for each transition condition. Test packets are
// run through the constructed FSM; pass when every packet extracts the
// expected headers.

import { useEffect, useMemo, useState } from 'react'
import type { Level } from '@/types'
import { Button } from '@/components/ui/Button'
import { Badge }  from '@/components/ui/Badge'

interface Props { level: Level; onComplete: (passed: boolean, hintsUsed: number) => void }

type State    = 'start' | 'ethernet' | 'ipv4' | 'tcp' | 'udp' | 'accept'
type EthCase  = '0x0800' | '0x86DD' | 'other'   // etherType
type IpCase   = '6' | '17' | 'other'             // ipv4 protocol

interface Scenario {
  /** Test packets — each carries fields we feed through the parser. */
  packets: { id: string; eth: EthCase; proto: IpCase; expected: State[] }[]
}

function rand(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min }

function expectedHeaders(eth: EthCase, proto: IpCase): State[] {
  const out: State[] = ['ethernet']
  if (eth !== '0x0800') return out
  out.push('ipv4')
  if (proto === '6')  out.push('tcp')
  if (proto === '17') out.push('udp')
  return out
}

function makeScenario(): Scenario {
  const eths:   EthCase[] = ['0x0800', '0x0800', '0x0800', '0x86DD', 'other']
  const protos: IpCase[]  = ['6', '17', 'other']
  const n = rand(4, 5)
  const packets = Array.from({ length: n }, (_, i) => {
    const eth   = eths[rand(0, eths.length - 1)]
    const proto = protos[rand(0, protos.length - 1)]
    return { id: `pkt-${i + 1}`, eth, proto, expected: expectedHeaders(eth, proto) }
  })
  // Ensure variety
  if (!packets.some(p => p.eth === '0x0800' && p.proto === '6')) {
    packets[0] = { ...packets[0], eth: '0x0800', proto: '6', expected: expectedHeaders('0x0800', '6') }
  }
  return { packets }
}

// ── Player-defined transitions ─────────────────────────────────────────────

interface Transitions {
  // ethernet etherType branches
  ethOnIpv4:   State
  ethOnOther:  State
  // ipv4 protocol branches
  ipOnTcp:     State
  ipOnUdp:     State
  ipOnOther:   State
}

const DEFAULT_TRANS: Transitions = {
  ethOnIpv4:  'accept', ethOnOther: 'accept',
  ipOnTcp:    'accept', ipOnUdp:    'accept', ipOnOther: 'accept',
}

function runParser(pkt: Scenario['packets'][number], t: Transitions): State[] {
  const out: State[] = ['ethernet']
  let next: State
  if (pkt.eth === '0x0800') next = t.ethOnIpv4
  else                       next = t.ethOnOther
  if (next === 'accept' || next !== 'ipv4') return out
  out.push('ipv4')
  let n2: State
  if (pkt.proto === '6')       n2 = t.ipOnTcp
  else if (pkt.proto === '17') n2 = t.ipOnUdp
  else                          n2 = t.ipOnOther
  if (n2 === 'tcp' || n2 === 'udp') out.push(n2)
  return out
}

const HINTS = [
  'A parser is a state machine — each state inspects a header field and decides which state runs next.',
  'EtherType 0x0800 means "IPv4 follows"; IPv4 protocol 6 = TCP, 17 = UDP. Everything else should accept early.',
]

export function ParserMode({ level, onComplete }: Props) {
  const [scenarioKey, setScenarioKey] = useState(0)
  const scenario = useMemo(() => makeScenario(), [scenarioKey])
  const [trans, setTrans] = useState<Transitions>(DEFAULT_TRANS)
  useEffect(() => { setTrans(DEFAULT_TRANS) }, [scenario])
  const [hintIdx, setHintIdx] = useState(0)

  function reset() { setScenarioKey(k => k + 1); setHintIdx(0) }

  const results = scenario.packets.map((p) => {
    const got = runParser(p, trans)
    const ok  = got.length === p.expected.length && got.every((s, i) => s === p.expected[i])
    return { pkt: p, got, ok }
  })
  const passed = results.every(r => r.ok)

  function trDropdown(value: State, set: (s: State) => void, options: State[]) {
    return (
      <select value={value} onChange={(e) => set(e.target.value as State)}
              className="bg-noc-bg border border-noc-border text-noc-text text-xs rounded px-2 py-1 font-mono">
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    )
  }

  return (
    <div className="noc-card p-6 flex flex-col gap-4">
      <p className="text-noc-muted text-xs uppercase tracking-widest">P4 Parser FSM</p>
      <h2 className="text-noc-bright text-lg font-semibold">{level.title}</h2>
      <p className="text-noc-text text-sm">{level.intent}</p>

      {/* Transition editor */}
      <div className="border border-noc-border rounded p-3 flex flex-col gap-2 text-xs font-mono">
        <p className="text-noc-bright text-sm font-semibold mb-1">state ethernet</p>
        <div className="flex flex-wrap items-center gap-2 pl-2">
          <span className="text-noc-muted">etherType == 0x0800 →</span>
          {trDropdown(trans.ethOnIpv4, (s) => setTrans(t => ({ ...t, ethOnIpv4: s })), ['ipv4', 'accept'])}
        </div>
        <div className="flex flex-wrap items-center gap-2 pl-2">
          <span className="text-noc-muted">default →</span>
          {trDropdown(trans.ethOnOther, (s) => setTrans(t => ({ ...t, ethOnOther: s })), ['ipv4', 'accept'])}
        </div>

        <p className="text-noc-bright text-sm font-semibold mt-3 mb-1">state ipv4</p>
        <div className="flex flex-wrap items-center gap-2 pl-2">
          <span className="text-noc-muted">protocol == 6 →</span>
          {trDropdown(trans.ipOnTcp, (s) => setTrans(t => ({ ...t, ipOnTcp: s })), ['tcp', 'udp', 'accept'])}
        </div>
        <div className="flex flex-wrap items-center gap-2 pl-2">
          <span className="text-noc-muted">protocol == 17 →</span>
          {trDropdown(trans.ipOnUdp, (s) => setTrans(t => ({ ...t, ipOnUdp: s })), ['tcp', 'udp', 'accept'])}
        </div>
        <div className="flex flex-wrap items-center gap-2 pl-2">
          <span className="text-noc-muted">default →</span>
          {trDropdown(trans.ipOnOther, (s) => setTrans(t => ({ ...t, ipOnOther: s })), ['tcp', 'udp', 'accept'])}
        </div>
      </div>

      {/* Test packets */}
      <div className="border border-noc-border rounded overflow-hidden">
        <table className="w-full text-xs font-mono">
          <thead className="bg-noc-bg text-noc-muted">
            <tr>
              <th className="text-left px-2 py-1">Packet</th>
              <th className="text-left px-2 py-1">etherType</th>
              <th className="text-left px-2 py-1">protocol</th>
              <th className="text-left px-2 py-1">Expected extracted</th>
              <th className="text-left px-2 py-1">Got</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {results.map((r, i) => (
              <tr key={i} className="border-t border-noc-border">
                <td className="px-2 py-1">{r.pkt.id}</td>
                <td className="px-2 py-1">{r.pkt.eth}</td>
                <td className="px-2 py-1">{r.pkt.proto === '6' ? '6 (TCP)' : r.pkt.proto === '17' ? '17 (UDP)' : 'other'}</td>
                <td className="px-2 py-1 text-noc-muted">{r.pkt.expected.join(' + ')}</td>
                <td className="px-2 py-1">{r.got.join(' + ')}</td>
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
        <Badge variant="idle">{results.filter(r => r.ok).length} / {results.length} packets correct</Badge>
      </div>
    </div>
  )
}
