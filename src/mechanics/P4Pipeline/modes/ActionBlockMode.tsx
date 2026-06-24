// E-L03 MAC Rewrite + TTL Decrement
// Player assembles the action body by toggling action blocks in the right
// order: set egress port, rewrite src/dst MAC, decrement TTL. A sample
// packet is run through; output headers are checked field-by-field.

import { useEffect, useMemo, useState } from 'react'
import type { Level } from '@/types'
import { Button } from '@/components/ui/Button'

interface Props { level: Level; onComplete: (passed: boolean, hintsUsed: number) => void }

type Block = 'set_egress' | 'set_src_mac' | 'set_dst_mac' | 'dec_ttl' | 'drop'

interface Scenario {
  /** Required blocks in order. */
  required: Block[]
  packet: {
    srcMacIn:  string
    dstMacIn:  string
    ttlIn:     number
    srcMacOut: string
    dstMacOut: string
    ttlOut:    number
    portOut:   number
  }
}

function rand(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min }
function randomMac(): string {
  return Array.from({ length: 6 }, () => rand(0, 255).toString(16).padStart(2, '0')).join(':')
}

function makeScenario(): Scenario {
  const srcMacIn  = randomMac()
  const dstMacIn  = randomMac()
  const srcMacOut = randomMac()
  const dstMacOut = randomMac()
  const ttlIn     = rand(32, 128)
  return {
    required: ['set_egress', 'set_src_mac', 'set_dst_mac', 'dec_ttl'],
    packet: {
      srcMacIn,  dstMacIn,  ttlIn,
      srcMacOut, dstMacOut, ttlOut: ttlIn - 1, portOut: rand(1, 4),
    },
  }
}

const HINTS = [
  'A P4 action is just a sequence of primitive assignments — toggle the ones you need into your action body.',
  'Decrement TTL by exactly 1; don\'t forget to rewrite both src and dst MAC for a typical L3 hop.',
]

const ALL_BLOCKS: { id: Block; label: string }[] = [
  { id: 'set_egress',  label: 'standard_metadata.egress_spec = port' },
  { id: 'set_src_mac', label: 'hdr.ethernet.srcAddr = srcMac' },
  { id: 'set_dst_mac', label: 'hdr.ethernet.dstAddr = dstMac' },
  { id: 'dec_ttl',     label: 'hdr.ipv4.ttl = hdr.ipv4.ttl - 1' },
  { id: 'drop',        label: 'mark_to_drop(...)' },
]

interface Result {
  portOut?:   number
  srcMacOut?: string
  dstMacOut?: string
  ttlOut?:    number
  dropped:    boolean
}

function runAction(blocks: Block[], scn: Scenario): Result {
  const r: Result = { dropped: false }
  for (const b of blocks) {
    if (b === 'set_egress')  r.portOut    = scn.packet.portOut
    if (b === 'set_src_mac') r.srcMacOut  = scn.packet.srcMacOut
    if (b === 'set_dst_mac') r.dstMacOut  = scn.packet.dstMacOut
    if (b === 'dec_ttl')     r.ttlOut     = scn.packet.ttlIn - 1
    if (b === 'drop')        r.dropped    = true
  }
  return r
}

export function ActionBlockMode({ level, onComplete }: Props) {
  const [scenarioKey, setScenarioKey] = useState(0)
  const scenario = useMemo(() => makeScenario(), [scenarioKey])
  const [chain,   setChain]   = useState<Block[]>([])
  useEffect(() => { setChain([]) }, [scenario])
  const [hintIdx, setHintIdx] = useState(0)

  function reset() { setScenarioKey(k => k + 1); setHintIdx(0) }

  function addBlock(b: Block) {
    if (chain.includes(b)) return
    setChain(c => [...c, b])
  }
  function removeBlock(i: number) { setChain(c => c.filter((_, ix) => ix !== i)) }
  function move(i: number, dir: -1 | 1) {
    setChain(c => {
      const j = i + dir
      if (j < 0 || j >= c.length) return c
      const out = [...c]; [out[i], out[j]] = [out[j], out[i]]; return out
    })
  }

  const result   = runAction(chain, scenario)
  const portOk   = result.portOut    === scenario.packet.portOut
  const srcOk    = result.srcMacOut  === scenario.packet.srcMacOut
  const dstOk    = result.dstMacOut  === scenario.packet.dstMacOut
  const ttlOk    = result.ttlOut     === scenario.packet.ttlOut
  const notDrop  = result.dropped    === false
  const passed   = portOk && srcOk && dstOk && ttlOk && notDrop

  return (
    <div className="noc-card p-6 flex flex-col gap-4">
      <p className="text-noc-muted text-xs uppercase tracking-widest">P4 Action · ipv4_forward</p>
      <h2 className="text-noc-bright text-lg font-semibold">{level.title}</h2>
      <p className="text-noc-text text-sm">{level.intent}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
        <div className="border border-noc-border rounded p-2">
          <p className="text-noc-muted">Input packet</p>
          <p className="text-noc-text">src_mac = {scenario.packet.srcMacIn}</p>
          <p className="text-noc-text">dst_mac = {scenario.packet.dstMacIn}</p>
          <p className="text-noc-text">ttl     = {scenario.packet.ttlIn}</p>
        </div>
        <div className="border border-noc-border rounded p-2">
          <p className="text-noc-muted">Expected output</p>
          <p className="text-noc-text">src_mac = {scenario.packet.srcMacOut}</p>
          <p className="text-noc-text">dst_mac = {scenario.packet.dstMacOut}</p>
          <p className="text-noc-text">ttl     = {scenario.packet.ttlOut} (decremented)</p>
          <p className="text-noc-text">port    = {scenario.packet.portOut}</p>
        </div>
      </div>

      {/* Available blocks */}
      <div>
        <p className="text-noc-muted text-xs mb-1">Drop these primitives into the action body:</p>
        <div className="flex flex-wrap gap-2">
          {ALL_BLOCKS.map(({ id, label }) => {
            const used = chain.includes(id)
            return (
              <button key={id} onClick={() => addBlock(id)} disabled={used}
                      className={`text-xs px-3 py-1.5 rounded border transition-colors font-mono ${
                        used ? 'border-noc-border text-noc-muted opacity-50'
                             : 'border-noc-border text-noc-text hover:border-link-packet hover:text-link-packet'
                      }`}>
                + {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Action body */}
      <div className="border border-noc-border rounded p-3">
        <p className="text-noc-bright text-sm font-semibold mb-2">action ipv4_forward(macAddr_t srcMac, macAddr_t dstMac, egressSpec_t port) {'{'}</p>
        {chain.length === 0 && (
          <p className="text-noc-muted text-xs italic pl-3">(empty — packet falls through unchanged)</p>
        )}
        {chain.map((b, i) => (
          <div key={i} className="flex items-center gap-2 pl-3 py-1 text-xs font-mono">
            <span className="text-noc-muted">  {i + 1}.</span>
            <span className="text-noc-text flex-1">{ALL_BLOCKS.find(ab => ab.id === b)!.label};</span>
            <button onClick={() => move(i, -1)} className="text-noc-muted hover:text-noc-text">↑</button>
            <button onClick={() => move(i, +1)} className="text-noc-muted hover:text-noc-text">↓</button>
            <button onClick={() => removeBlock(i)} className="text-link-down">✕</button>
          </div>
        ))}
        <p className="text-noc-bright text-sm font-semibold mt-2">{'}'}</p>
      </div>

      {/* Output */}
      <div className="border border-noc-border rounded p-3 text-xs font-mono space-y-0.5">
        <p className="text-noc-muted">Output packet:</p>
        <p className={result.dropped ? 'text-link-down' : 'text-noc-text'}>
          dropped = {String(result.dropped)} {notDrop ? '' : ' ✗ should not drop'}
        </p>
        <p className={portOk ? 'text-link-up' : 'text-link-down'}>port    = {result.portOut ?? '—'} {portOk ? '✓' : '✗'}</p>
        <p className={srcOk  ? 'text-link-up' : 'text-link-down'}>src_mac = {result.srcMacOut ?? '—'} {srcOk  ? '✓' : '✗'}</p>
        <p className={dstOk  ? 'text-link-up' : 'text-link-down'}>dst_mac = {result.dstMacOut ?? '—'} {dstOk  ? '✓' : '✗'}</p>
        <p className={ttlOk  ? 'text-link-up' : 'text-link-down'}>ttl     = {result.ttlOut ?? '—'} {ttlOk  ? '✓' : '✗'}</p>
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
