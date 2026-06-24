// E-L06 Full Pipeline Boss
// Assemble: parser handles eth+ipv4, ingress runs ipv4_lpm + mac_fwd,
// egress appends INT, deparser re-emits all headers. Pass when a 10-packet
// test suite (or whatever count) produces fully-correct outputs.

import { useEffect, useMemo, useState } from 'react'
import type { Level } from '@/types'
import { Button } from '@/components/ui/Button'
import { Badge }  from '@/components/ui/Badge'

interface Props { level: Level; onComplete: (passed: boolean, hintsUsed: number) => void }

type IngressTable = 'ipv4_lpm' | 'mac_fwd' | 'firewall'
type EgressBlock  = 'append_int' | 'recompute_csum'
type DeparserHeader = 'ethernet' | 'ipv4' | 'int'

interface Config {
  parserHandlesEth:  boolean
  parserHandlesIpv4: boolean
  ingressTables:     IngressTable[]
  egressBlocks:      EgressBlock[]
  deparserEmits:     DeparserHeader[]
}

interface Scenario {
  /** N test packets we'll evaluate against. */
  packets: number
}

function rand(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min }

function makeScenario(): Scenario {
  return { packets: rand(8, 12) }
}

const HINTS = [
  'Work left to right: parser → ingress → egress → deparser. Each stage needs the right pieces enabled before the next does anything useful.',
  'For TTL-decrement + LPM to count, ingress needs both ipv4_lpm and mac_fwd. INT lives in egress; the deparser must re-emit it.',
]

function evaluate(cfg: Config, scenario: Scenario): { ok: boolean; details: { label: string; passed: boolean }[] } {
  const ok1 = cfg.parserHandlesEth
  const ok2 = cfg.parserHandlesIpv4
  const ok3 = cfg.ingressTables.includes('ipv4_lpm') && cfg.ingressTables.includes('mac_fwd')
  const ok4 = cfg.ingressTables.indexOf('ipv4_lpm') < cfg.ingressTables.indexOf('mac_fwd')
  const ok5 = cfg.egressBlocks.includes('append_int')
  const ok6 = cfg.deparserEmits.includes('ethernet')
        && cfg.deparserEmits.includes('ipv4')
        && cfg.deparserEmits.includes('int')

  const details = [
    { label: `Parser extracts ethernet`,                       passed: ok1 },
    { label: `Parser extracts ipv4`,                           passed: ok2 },
    { label: `Ingress applies ipv4_lpm + mac_fwd`,             passed: ok3 },
    { label: `Ingress order: ipv4_lpm before mac_fwd`,         passed: ok4 },
    { label: `Egress appends INT header`,                      passed: ok5 },
    { label: `Deparser re-emits ethernet + ipv4 + int`,        passed: ok6 },
  ]
  // Final per-packet check: if all stages OK, all N packets pass.
  const allOk = details.every(d => d.passed)
  details.push({
    label: `Test suite (${scenario.packets} packets)`,
    passed: allOk,
  })
  return { ok: allOk, details }
}

const DEFAULT_CFG: Config = {
  parserHandlesEth: false, parserHandlesIpv4: false,
  ingressTables: [], egressBlocks: [], deparserEmits: [],
}

export function FullPipelineMode({ level, onComplete }: Props) {
  const [scenarioKey, setScenarioKey] = useState(0)
  const scenario = useMemo(() => makeScenario(), [scenarioKey])
  const [cfg, setCfg] = useState<Config>(DEFAULT_CFG)
  useEffect(() => { setCfg(DEFAULT_CFG) }, [scenario])
  const [hintIdx, setHintIdx] = useState(0)

  function reset() { setScenarioKey(k => k + 1); setHintIdx(0) }

  function toggleIngress(t: IngressTable) {
    setCfg(c => ({
      ...c,
      ingressTables: c.ingressTables.includes(t)
        ? c.ingressTables.filter(x => x !== t)
        : [...c.ingressTables, t],
    }))
  }
  function moveIngress(i: number, dir: -1 | 1) {
    setCfg(c => {
      const a = [...c.ingressTables]
      const j = i + dir; if (j < 0 || j >= a.length) return c
      ;[a[i], a[j]] = [a[j], a[i]]
      return { ...c, ingressTables: a }
    })
  }
  function toggleEgress(b: EgressBlock) {
    setCfg(c => ({
      ...c,
      egressBlocks: c.egressBlocks.includes(b)
        ? c.egressBlocks.filter(x => x !== b)
        : [...c.egressBlocks, b],
    }))
  }
  function toggleDeparser(h: DeparserHeader) {
    setCfg(c => ({
      ...c,
      deparserEmits: c.deparserEmits.includes(h)
        ? c.deparserEmits.filter(x => x !== h)
        : [...c.deparserEmits, h],
    }))
  }

  const { ok, details } = evaluate(cfg, scenario)

  return (
    <div className="noc-card p-6 flex flex-col gap-4">
      <p className="text-noc-muted text-xs uppercase tracking-widest">Boss · Full Pipeline</p>
      <h2 className="text-noc-bright text-lg font-semibold">{level.title}</h2>
      <p className="text-noc-text text-sm">{level.intent}</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Parser */}
        <Section title="parser">
          <Toggle on={cfg.parserHandlesEth}  onClick={() => setCfg(c => ({ ...c, parserHandlesEth: !c.parserHandlesEth }))}>
            extract(hdr.ethernet)
          </Toggle>
          <Toggle on={cfg.parserHandlesIpv4} onClick={() => setCfg(c => ({ ...c, parserHandlesIpv4: !c.parserHandlesIpv4 }))}>
            extract(hdr.ipv4)
          </Toggle>
        </Section>

        {/* Ingress */}
        <Section title="control ingress">
          {(['firewall', 'ipv4_lpm', 'mac_fwd'] as IngressTable[]).map((t) => (
            <Toggle key={t} on={cfg.ingressTables.includes(t)} onClick={() => toggleIngress(t)}>
              {t}.apply()
            </Toggle>
          ))}
          {cfg.ingressTables.length > 0 && (
            <div className="border-t border-noc-border mt-1 pt-1">
              <p className="text-noc-muted text-xs">Order:</p>
              {cfg.ingressTables.map((t, i) => (
                <div key={t} className="flex items-center gap-2 text-xs font-mono">
                  <span className="text-noc-muted">  {i + 1}.</span>
                  <span className="text-noc-text flex-1">{t}</span>
                  <button onClick={() => moveIngress(i, -1)} className="text-noc-muted hover:text-noc-text">↑</button>
                  <button onClick={() => moveIngress(i, +1)} className="text-noc-muted hover:text-noc-text">↓</button>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Egress */}
        <Section title="control egress">
          {(['append_int', 'recompute_csum'] as EgressBlock[]).map((b) => (
            <Toggle key={b} on={cfg.egressBlocks.includes(b)} onClick={() => toggleEgress(b)}>
              {b}()
            </Toggle>
          ))}
        </Section>

        {/* Deparser */}
        <Section title="control deparser">
          {(['ethernet', 'ipv4', 'int'] as DeparserHeader[]).map((h) => (
            <Toggle key={h} on={cfg.deparserEmits.includes(h)} onClick={() => toggleDeparser(h)}>
              emit(hdr.{h})
            </Toggle>
          ))}
        </Section>
      </div>

      {/* Results */}
      <div className="border border-noc-border rounded p-3 text-xs font-mono space-y-0.5">
        {details.map((d, i) => (
          <p key={i} className={d.passed ? 'text-link-up' : 'text-link-down'}>
            {d.passed ? '✓' : '✗'} {d.label}
          </p>
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
        <Button size="sm" disabled={!ok} onClick={() => onComplete(true, hintIdx)}>Finish level</Button>
        {hintIdx < HINTS.length && (
          <Button size="sm" variant="ghost" onClick={() => setHintIdx(n => n + 1)}>
            Hint ({hintIdx + 1}/{HINTS.length})
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={reset}>New scenario</Button>
        <Badge variant="idle">{details.filter(d => d.passed).length} / {details.length} checks</Badge>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-noc-border rounded p-3">
      <p className="text-noc-bright text-sm font-semibold mb-2 font-mono">{title}</p>
      <div className="flex flex-col gap-1">{children}</div>
    </div>
  )
}

function Toggle({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
            className={`text-left text-xs px-2 py-1 rounded border transition-colors font-mono ${
              on ? 'border-link-packet text-link-packet bg-link-packet/10'
                 : 'border-noc-border text-noc-text hover:border-noc-text'
            }`}>
      {on ? '☑' : '☐'} {children}
    </button>
  )
}
