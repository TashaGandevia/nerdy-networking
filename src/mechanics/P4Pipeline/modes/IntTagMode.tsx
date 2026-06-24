// E-L05 INT Telemetry Tag
// Player adds an INT header in egress; chooses which fields to include
// (queue_depth, timestamp, switch_id, hop_latency). Pass when the output
// packets carry the required fields and nothing extra.

import { useEffect, useMemo, useState } from 'react'
import type { Level } from '@/types'
import { Button } from '@/components/ui/Button'
import { Badge }  from '@/components/ui/Badge'

interface Props { level: Level; onComplete: (passed: boolean, hintsUsed: number) => void }

type Field = 'queue_depth' | 'timestamp' | 'switch_id' | 'hop_latency' | 'ingress_port'

interface Scenario {
  required: Set<Field>
  pool:     Field[]
  description: string
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
  const variants: { req: Field[]; desc: string }[] = [
    { req: ['queue_depth', 'timestamp'],
      desc: 'Capture per-hop congestion (queue depth) and when the packet arrived.' },
    { req: ['switch_id', 'hop_latency', 'timestamp'],
      desc: 'Capture which switch saw the packet, hop latency, and a timestamp.' },
    { req: ['queue_depth', 'switch_id'],
      desc: 'Minimal INT: identify the switch and report its current queue depth.' },
  ]
  const v = variants[rand(0, variants.length - 1)]
  return {
    required: new Set(v.req),
    pool: shuffle<Field>(['queue_depth', 'timestamp', 'switch_id', 'hop_latency', 'ingress_port']),
    description: v.desc,
  }
}

const HINTS = [
  'INT fields are appended to the packet on egress and re-emitted by the deparser — each one is a separate primitive write.',
  'Read the description above to know exactly which fields are required. Don\'t add fields the description doesn\'t ask for.',
]

export function IntTagMode({ level, onComplete }: Props) {
  const [scenarioKey, setScenarioKey] = useState(0)
  const scenario = useMemo(() => makeScenario(), [scenarioKey])
  const [picked, setPicked] = useState<Set<Field>>(new Set())
  useEffect(() => { setPicked(new Set()) }, [scenario])
  const [hintIdx, setHintIdx] = useState(0)

  function reset() { setScenarioKey(k => k + 1); setHintIdx(0) }

  function toggle(f: Field) {
    setPicked(prev => {
      const next = new Set(prev)
      if (next.has(f)) next.delete(f); else next.add(f)
      return next
    })
  }

  const sameSize = picked.size === scenario.required.size
  const allMatch = [...picked].every(f => scenario.required.has(f))
  const passed   = sameSize && allMatch

  return (
    <div className="noc-card p-6 flex flex-col gap-4">
      <p className="text-noc-muted text-xs uppercase tracking-widest">P4 egress · INT</p>
      <h2 className="text-noc-bright text-lg font-semibold">{level.title}</h2>
      <p className="text-noc-text text-sm">{level.intent}</p>

      <div className="border border-noc-border rounded p-3 text-sm">
        <p className="text-noc-muted text-xs mb-1">Operator request</p>
        <p className="text-noc-text">{scenario.description}</p>
      </div>

      <div>
        <p className="text-noc-muted text-xs mb-1">Available INT fields — click to include:</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {scenario.pool.map((f) => {
            const on = picked.has(f)
            return (
              <button key={f} onClick={() => toggle(f)}
                      className={`text-xs px-3 py-2 rounded border transition-colors text-left font-mono ${
                        on ? 'border-link-packet text-link-packet bg-link-packet/10'
                           : 'border-noc-border text-noc-text hover:border-noc-text'
                      }`}>
                {on ? '☑' : '☐'} {f}
              </button>
            )
          })}
        </div>
      </div>

      <div className="border border-noc-border rounded p-3 text-xs font-mono">
        <p className="text-noc-muted">deparser emits:</p>
        <p className="text-noc-text mt-1">
          {picked.size === 0
            ? '(no INT header)'
            : `hdr.int { ${[...picked].join(', ')} }`}
        </p>
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
        <Badge variant="idle">{picked.size} / {scenario.required.size} fields selected</Badge>
      </div>
    </div>
  )
}
