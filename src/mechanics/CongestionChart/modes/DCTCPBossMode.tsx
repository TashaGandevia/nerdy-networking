// A-L06 Boss — Datacenter path: 10 Gbps × 1 ms. Reno+tail-drop builds queueing
// latency and may drop. Switch to DCTCP+ECN to hit ≥ 95% goodput, queue < 10
// packets, zero drops.

import { useMemo, useState } from 'react'
import type { Level } from '@/types'
import type { Algorithm, AQM } from '../simulator'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { simulate, utilization } from '../simulator'
import { Chart } from '../Chart'

interface Props {
  level:      Level
  onComplete: (passed: boolean, hintsUsed: number) => void
}

const TARGET_UTIL  = 0.95

interface Scenario {
  seed:         number
  totalRtts:    number
  capacity:     number
  queueLimit:   number
  kMark:        number
  queueTarget:  number    // pass threshold for max queue depth
  startRTTs:    number[]
  ssthresh:     number
}

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function makeScenario(): Scenario {
  const capacity   = rand(40, 80)
  const queueLimit = Math.floor(capacity * 0.7)
  const kMark      = rand(6, 12)
  return {
    seed:        rand(1, 9999),
    totalRtts:   rand(90, 140),
    capacity,
    queueLimit,
    kMark,
    queueTarget: kMark + rand(2, 5),
    startRTTs:   [0, rand(3, 8)],
    ssthresh:    rand(12, 24),
  }
}

export function DCTCPBossMode({ level, onComplete }: Props) {
  const [scenario, setScenario]   = useState<Scenario>(makeScenario)
  const [algo,      setAlgo]      = useState<Algorithm>('reno')
  const [aqm,       setAqm]       = useState<AQM>('none')
  const [hintsUsed, setHintsUsed] = useState(0)
  const [showHint,  setShowHint]  = useState(false)

  const result = useMemo(() => simulate({
    flows: scenario.startRTTs.map((startRTT) => ({
      algorithm: algo, ssthresh: scenario.ssthresh, startRTT,
    })),
    rtts:        scenario.totalRtts,
    capacityPpr: scenario.capacity,
    queueLimit:  scenario.queueLimit,
    aqm,
    markThreshold: scenario.kMark,
    seed: scenario.seed,
  }), [algo, aqm, scenario])

  function reset() {
    setScenario(makeScenario())
    setAlgo('reno')
    setAqm('none')
    setHintsUsed(0)
    setShowHint(false)
  }

  const util       = utilization(result, scenario.capacity)
  const maxQueue   = Math.max(...result.queue.slice(20))      // ignore warm-up
  const drops      = result.events.filter((e) => e.kind !== 'ecn-mark').length
  const passed     = util >= TARGET_UTIL && maxQueue < scenario.queueTarget && drops === 0

  return (
    <div className="noc-card p-6 flex flex-col gap-4">
      <p className="text-noc-muted text-xs uppercase tracking-widest">Boss — datacenter goodput</p>
      <h2 className="text-noc-bright text-lg font-semibold">{level.title}</h2>
      <p className="text-noc-text text-sm">{level.intent}</p>

      <div className="flex gap-2 flex-wrap">
        <Badge variant="idle">{scenario.startRTTs.length} flows · {scenario.capacity} pkts/RTT</Badge>
        <Badge variant="idle">DCTCP K = {scenario.kMark} pkts</Badge>
        <Badge variant="idle">Pass: util ≥ {Math.round(TARGET_UTIL * 100)}% · max queue &lt; {scenario.queueTarget} · 0 drops</Badge>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3">
        <div className="flex gap-2">
          {(['reno', 'dctcp'] as Algorithm[]).map((a) => (
            <button
              key={a}
              onClick={() => setAlgo(a)}
              className={`text-xs px-3 py-1.5 rounded border transition-colors ${
                algo === a
                  ? 'bg-link-packet/15 border-link-packet text-link-packet'
                  : 'border-noc-border text-noc-muted hover:text-noc-text'
              }`}
            >
              {a.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {(['none', 'ecn'] as AQM[]).map((m) => (
            <button
              key={m}
              onClick={() => setAqm(m)}
              className={`text-xs px-3 py-1.5 rounded border transition-colors ${
                aqm === m
                  ? 'bg-link-packet/15 border-link-packet text-link-packet'
                  : 'border-noc-border text-noc-muted hover:text-noc-text'
              }`}
            >
              {m === 'none' ? 'tail-drop' : 'ECN'}
            </button>
          ))}
        </div>
      </div>

      <Chart
        flows={result.perFlow}
        totalRtts={scenario.totalRtts}
        events={result.events}
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono">
        <Metric label="Utilisation" value={`${(util * 100).toFixed(1)}%`} good={util >= TARGET_UTIL} />
        <Metric label="Max queue" value={`${maxQueue}`}                  good={maxQueue < scenario.queueTarget} />
        <Metric label="Drops"      value={`${drops}`}                    good={drops === 0} />
      </div>

      {showHint && (
        <p className="text-noc-muted text-xs border border-noc-border rounded px-3 py-2">
          Hint: Reno waits for loss to cut its window — at this RTT it'll overshoot
          and fill the queue. DCTCP+ECN reacts to the *fraction* of marked packets
          (α) once the queue passes K, so it holds queue depth near K.
        </p>
      )}

      {passed && (
        <p className="text-link-up text-sm font-medium">
          DCTCP+ECN hits the boss target — high goodput, tiny queue, zero drops.
        </p>
      )}

      <div className="flex gap-2 flex-wrap">
        <Button
          size="sm"
          variant="ghost"
          disabled={showHint}
          onClick={() => { setShowHint(true); setHintsUsed((n) => n + 1) }}
        >
          Hint
        </Button>
        <Button size="sm" disabled={!passed} onClick={() => onComplete(true, hintsUsed)}>
          Finish level
        </Button>
        <Button size="sm" variant="ghost" onClick={reset}>
          New scenario
        </Button>
      </div>
    </div>
  )
}

function Metric({ label, value, good }: { label: string; value: string; good: boolean }) {
  return (
    <div className={`border rounded px-3 py-2 ${good ? 'border-link-up' : 'border-noc-border'}`}>
      <p className="text-noc-muted">{label}</p>
      <p className={`text-base ${good ? 'text-link-up' : 'text-noc-bright'}`}>{value}</p>
    </div>
  )
}
