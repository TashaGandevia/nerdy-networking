// A-L01 Predict — Click the chart at the RTT where you think the next loss lands.
// A partial trace is shown; the player marks a prediction; the rest is revealed
// on submit. Win = prediction within ±tolerance of the actual event.
// Scenario (revealed cutoff, hidden target, parameters) is randomized each play.

import { useMemo, useState } from 'react'
import type { Level } from '@/types'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { simulate } from '../simulator'
import { Chart } from '../Chart'

interface Props {
  level:      Level
  onComplete: (passed: boolean, hintsUsed: number) => void
}

const TOLERANCE = 1

interface Scenario {
  seed:         number
  totalRtts:    number
  revealAt:     number
  ssthresh:     number
  capacityPpr:  number
  queueLimit:   number
  firstLoss:    number   // visible
  targetLoss:   number   // hidden, the answer
}

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function makeScenario(): Scenario {
  const totalRtts   = rand(36, 48)
  const firstLoss   = rand(7, 11)
  const revealAt    = firstLoss + rand(3, 6)
  const targetLoss  = rand(revealAt + 5, totalRtts - 5)
  return {
    seed:        rand(1, 9999),
    totalRtts,
    revealAt,
    ssthresh:    rand(12, 24),
    capacityPpr: rand(60, 140),
    queueLimit:  rand(40, 90),
    firstLoss,
    targetLoss,
  }
}

export function PredictMode({ level, onComplete }: Props) {
  const [scenario, setScenario]   = useState<Scenario>(makeScenario)
  const [marker,    setMarker]    = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [hintsUsed, setHintsUsed] = useState(0)
  const [showHint,  setShowHint]  = useState(false)

  const result = useMemo(() => simulate({
    flows: [{ algorithm: 'reno', ssthresh: scenario.ssthresh }],
    rtts: scenario.totalRtts,
    capacityPpr: scenario.capacityPpr,
    queueLimit:  scenario.queueLimit,
    scriptedLossRTTs: [scenario.firstLoss, scenario.targetLoss],
    seed: scenario.seed,
  }), [scenario])

  function reset(s: Scenario) {
    setScenario(s)
    setMarker(null)
    setSubmitted(false)
    setHintsUsed(0)
    setShowHint(false)
  }

  const distance = marker === null ? null : Math.abs(marker - scenario.targetLoss)
  const passed   = distance !== null && distance <= TOLERANCE

  return (
    <div className="noc-card p-6 flex flex-col gap-4">
      <p className="text-noc-muted text-xs uppercase tracking-widest">Predict mode</p>
      <h2 className="text-noc-bright text-lg font-semibold">{level.title}</h2>
      <p className="text-noc-text text-sm">{level.intent}</p>

      <div className="flex gap-2 flex-wrap">
        <Badge variant="idle">Reno</Badge>
        <Badge variant="idle">First loss visible at RTT {scenario.firstLoss}</Badge>
        <Badge variant="idle">Capacity {scenario.capacityPpr} pkts/RTT</Badge>
        <Badge variant="idle">Tolerance ±{TOLERANCE} RTT</Badge>
      </div>

      <Chart
        flows={result.perFlow}
        totalRtts={scenario.totalRtts}
        events={result.events}
        revealUntil={submitted ? scenario.totalRtts : scenario.revealAt}
        onClick={submitted ? undefined : (rtt) => setMarker(rtt)}
        marker={marker === null ? null : { rtt: marker, label: `prediction t=${marker}` }}
      />

      {!submitted && (
        <p className="text-noc-muted text-xs">
          Click on the chart where you think the next 3-dup-ACK or timeout occurs.
        </p>
      )}

      {showHint && !submitted && (
        <p className="text-noc-muted text-xs border border-noc-border rounded px-3 py-2">
          Hint: Reno's sawtooth halves at each loss, then grows linearly (+1/RTT).
          Estimate when the rising line reaches the queue/capacity ceiling again.
        </p>
      )}

      {submitted && (
        <p className={`text-sm font-medium ${passed ? 'text-link-up' : 'text-link-down'}`}>
          {passed
            ? `Correct! Loss landed at RTT ${scenario.targetLoss} — you predicted ${marker} (off by ${distance}).`
            : `Loss landed at RTT ${scenario.targetLoss} — you predicted ${marker} (off by ${distance}). Need ≤ ${TOLERANCE}.`}
        </p>
      )}

      <div className="flex gap-2 flex-wrap">
        {!submitted && (
          <>
            <Button size="sm" disabled={marker === null} onClick={() => setSubmitted(true)}>
              Submit prediction
            </Button>
            <Button size="sm" variant="ghost" disabled={showHint} onClick={() => { setShowHint(true); setHintsUsed((n) => n + 1) }}>
              Hint
            </Button>
          </>
        )}
        {submitted && (
          <Button size="sm" onClick={() => onComplete(passed, hintsUsed)}>
            Finish level
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={() => reset(makeScenario())}>
          New scenario
        </Button>
      </div>
    </div>
  )
}
