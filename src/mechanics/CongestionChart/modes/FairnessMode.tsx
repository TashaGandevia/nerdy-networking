// A-L05 Fairness Arena — three Reno flows share a bottleneck. Watch AIMD converge
// to R/3, with Jain's index near 1. Toggle RED to see queueing effects change.

import { useMemo, useState } from 'react'
import type { Level } from '@/types'
import type { AQM } from '../simulator'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { simulate, jainFairness, utilization } from '../simulator'
import { Chart } from '../Chart'

interface Props {
  level:      Level
  onComplete: (passed: boolean, hintsUsed: number) => void
}

const TARGET_J  = 0.95
const TOLERANCE = 0.10     // ±10% of fair share per flow

interface Scenario {
  seed:        number
  totalRtts:   number
  capacity:    number     // divisible by 3 for a clean fair share
  queueLimit:  number
  ssthresh:    number
  startRTTs:   [number, number, number]
}

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function makeScenario(): Scenario {
  const capacityBase = rand(20, 40) * 3      // multiple of 3
  return {
    seed:        rand(1, 9999),
    totalRtts:   rand(110, 160),
    capacity:    capacityBase,
    queueLimit:  Math.floor(capacityBase * 0.7),
    ssthresh:    rand(12, 24),
    startRTTs:   [0, rand(4, 8), rand(10, 16)],
  }
}

export function FairnessMode({ level, onComplete }: Props) {
  const [scenario, setScenario]   = useState<Scenario>(makeScenario)
  const [aqm,       setAqm]       = useState<AQM>('none')
  const [hintsUsed, setHintsUsed] = useState(0)
  const [showHint,  setShowHint]  = useState(false)

  const result = useMemo(() => simulate({
    flows: scenario.startRTTs.map((startRTT) => ({
      algorithm: 'reno', startRTT, ssthresh: scenario.ssthresh,
    })),
    rtts:        scenario.totalRtts,
    capacityPpr: scenario.capacity,
    queueLimit:  scenario.queueLimit,
    aqm,
    markThreshold: Math.floor(scenario.queueLimit * 0.6),
    seed: scenario.seed,
  }), [aqm, scenario])

  function reset() {
    setScenario(makeScenario())
    setAqm('none')
    setHintsUsed(0)
    setShowHint(false)
  }

  const fairness  = jainFairness(result)
  const totalUtil = utilization(result, scenario.capacity)
  const fairShare = scenario.capacity / 3

  // Use the second half of the run (after convergence) to measure fairness.
  const halfStart = Math.floor(scenario.totalRtts / 2)
  const perFlow   = result.perFlow.map((f) =>
    f.acked.slice(halfStart).reduce((a, b) => a + b, 0) / (scenario.totalRtts - halfStart),
  )
  const allWithinTolerance = perFlow.every((rate) => Math.abs(rate - fairShare) / fairShare <= TOLERANCE)
  const passed = fairness >= TARGET_J && allWithinTolerance

  return (
    <div className="noc-card p-6 flex flex-col gap-4">
      <p className="text-noc-muted text-xs uppercase tracking-widest">Fairness Arena</p>
      <h2 className="text-noc-bright text-lg font-semibold">{level.title}</h2>
      <p className="text-noc-text text-sm">{level.intent}</p>

      <div className="flex gap-2 flex-wrap">
        <Badge variant="idle">3 Reno flows</Badge>
        <Badge variant="idle">Capacity {scenario.capacity} pkts/RTT (fair share {fairShare.toFixed(0)})</Badge>
        <Badge variant="idle">Pass: Jain ≥ {TARGET_J} & each flow within ±{Math.round(TOLERANCE * 100)}% of R/3</Badge>
      </div>

      {/* AQM toggle */}
      <div className="flex gap-2">
        {(['none', 'red'] as AQM[]).map((m) => (
          <button
            key={m}
            onClick={() => setAqm(m)}
            className={`text-xs px-3 py-1.5 rounded border transition-colors ${
              aqm === m
                ? 'bg-link-packet/15 border-link-packet text-link-packet'
                : 'border-noc-border text-noc-muted hover:text-noc-text'
            }`}
          >
            AQM: {m === 'none' ? 'tail-drop' : 'RED'}
          </button>
        ))}
      </div>

      <Chart
        flows={result.perFlow}
        totalRtts={scenario.totalRtts}
        events={result.events.slice(0, 40)}
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono">
        <div className={`border rounded px-3 py-2 ${fairness >= TARGET_J ? 'border-link-up' : 'border-noc-border'}`}>
          <p className="text-noc-muted">Jain's index</p>
          <p className={`text-base ${fairness >= TARGET_J ? 'text-link-up' : 'text-noc-bright'}`}>
            {fairness.toFixed(3)}
          </p>
        </div>
        <div className="border border-noc-border rounded px-3 py-2">
          <p className="text-noc-muted">Total utilisation</p>
          <p className="text-noc-bright text-base">{(totalUtil * 100).toFixed(1)}%</p>
        </div>
        <div className="border border-noc-border rounded px-3 py-2">
          <p className="text-noc-muted">Per-flow (2nd half)</p>
          <p className="text-noc-bright text-base">
            {perFlow.map((r) => r.toFixed(0)).join(' / ')}
          </p>
        </div>
      </div>

      {showHint && (
        <p className="text-noc-muted text-xs border border-noc-border rounded px-3 py-2">
          Hint: Reno's AIMD converges to a fair share geometrically — but it takes
          many sawtooth cycles. Let it run a long enough horizon. RED spreads losses
          across flows more evenly, helping convergence; tail-drop tends to synchronise
          flows.
        </p>
      )}

      {passed && (
        <p className="text-link-up text-sm font-medium">
          Three Reno flows converged within tolerance of R/3.
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
