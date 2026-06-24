// A-L04 Long Fat Pipe — On a high-BDP link Reno underperforms; switch to CUBIC.
// Player picks the algorithm; sim runs; pass when CUBIC achieves ≥ 90% utilisation.

import { useMemo, useState } from 'react'
import type { Level } from '@/types'
import type { Algorithm } from '../simulator'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { simulate, utilization } from '../simulator'
import { Chart } from '../Chart'

interface Props {
  level:      Level
  onComplete: (passed: boolean, hintsUsed: number) => void
}

const TARGET_UTIL = 0.90

interface Scenario {
  seed:        number
  totalRtts:   number
  capacity:    number  // packets/RTT
  queueLimit:  number
  ssthresh:    number
}

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function makeScenario(): Scenario {
  const capacity = rand(150, 300)
  return {
    seed:        rand(1, 9999),
    totalRtts:   rand(60, 110),
    capacity,
    queueLimit:  Math.floor(capacity * 1.2),
    ssthresh:    rand(20, 48),
  }
}

export function LongFatPipeMode({ level, onComplete }: Props) {
  const [scenario, setScenario]   = useState<Scenario>(makeScenario)
  const [algo,      setAlgo]      = useState<Algorithm>('reno')
  const [hintsUsed, setHintsUsed] = useState(0)
  const [showHint,  setShowHint]  = useState(false)

  const result = useMemo(() => simulate({
    flows: [{ algorithm: algo, ssthresh: scenario.ssthresh }],
    rtts: scenario.totalRtts,
    capacityPpr: scenario.capacity,
    queueLimit:  scenario.queueLimit,
    seed: scenario.seed,
  }), [algo, scenario])

  function reset() {
    setScenario(makeScenario())
    setAlgo('reno')
    setHintsUsed(0)
    setShowHint(false)
  }

  const util   = utilization(result, scenario.capacity)
  const passed = algo === 'cubic' && util >= TARGET_UTIL

  return (
    <div className="noc-card p-6 flex flex-col gap-4">
      <p className="text-noc-muted text-xs uppercase tracking-widest">Tune mode — long fat pipe</p>
      <h2 className="text-noc-bright text-lg font-semibold">{level.title}</h2>
      <p className="text-noc-text text-sm">{level.intent}</p>

      <div className="flex gap-2 flex-wrap">
        <Badge variant="idle">Capacity {scenario.capacity} pkts/RTT</Badge>
        <Badge variant="idle">{scenario.totalRtts} RTTs (high-BDP)</Badge>
        <Badge variant="idle">Target ≥ {Math.round(TARGET_UTIL * 100)}% utilisation</Badge>
      </div>

      {/* Algorithm picker */}
      <div className="flex gap-2">
        {(['reno', 'cubic'] as Algorithm[]).map((a) => (
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

      <Chart
        flows={result.perFlow}
        totalRtts={scenario.totalRtts}
        events={result.events}
      />

      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
        <div className="border border-noc-border rounded px-3 py-2">
          <p className="text-noc-muted">Algorithm</p>
          <p className="text-noc-bright text-base">{algo.toUpperCase()}</p>
        </div>
        <div className={`border rounded px-3 py-2 ${util >= TARGET_UTIL ? 'border-link-up' : 'border-noc-border'}`}>
          <p className="text-noc-muted">Utilisation</p>
          <p className={`text-base ${util >= TARGET_UTIL ? 'text-link-up' : 'text-noc-bright'}`}>
            {(util * 100).toFixed(1)}%
          </p>
        </div>
      </div>

      {showHint && (
        <p className="text-noc-muted text-xs border border-noc-border rounded px-3 py-2">
          Hint: Reno adds +1 MSS/RTT in congestion avoidance — on a {scenario.capacity}-packet
          pipe, recovering from a single loss takes many RTTs. CUBIC's cubic growth fills
          the pipe in a fraction of that time.
        </p>
      )}

      {passed && (
        <p className="text-link-up text-sm font-medium">
          CUBIC fills the pipe — long-fat-pipe problem solved.
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
