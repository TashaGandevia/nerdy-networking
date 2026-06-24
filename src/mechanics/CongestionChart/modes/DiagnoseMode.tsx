// A-L02 Diagnose — A finished trace is shown. Player labels each highlighted region
// as slow start / congestion avoidance / fast recovery / timeout. Win = all correct.
// Scenario and regions are randomized each play — answers derived from sim output.

import { useEffect, useMemo, useState } from 'react'
import type { Level } from '@/types'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { simulate } from '../simulator'
import { Chart } from '../Chart'
import { derivePhaseRegions, type Phase, type PhaseRegion } from '../phases'

interface Props {
  level:      Level
  onComplete: (passed: boolean, hintsUsed: number) => void
}

const PHASE_LABEL: Record<Phase, string> = {
  'slow-start':    'Slow start',
  'avoidance':     'Congestion avoidance',
  'fast-recovery': 'Fast recovery',
  'timeout':       'Timeout',
}
const PHASES: Phase[] = ['slow-start', 'avoidance', 'fast-recovery', 'timeout']

interface Scenario {
  seed:         number
  totalRtts:    number
  ssthresh:     number
  capacityPpr:  number
  queueLimit:   number
  losses:       number[]
}

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pickLossRTTs(totalRtts: number): number[] {
  // 2–3 events spread across the timeline, none in the first few RTTs.
  const n = rand(2, 3)
  const rtts: number[] = []
  let cursor = rand(6, 10)
  for (let i = 0; i < n; i++) {
    if (cursor >= totalRtts - 3) break
    rtts.push(cursor)
    cursor += rand(7, 12)
  }
  return rtts
}

function makeScenario(): Scenario {
  const totalRtts = rand(28, 38)
  return {
    seed:        rand(1, 9999),
    totalRtts,
    ssthresh:    rand(6, 12),
    capacityPpr: rand(40, 80),
    queueLimit:  rand(30, 60),
    losses:      pickLossRTTs(totalRtts),
  }
}

export function DiagnoseMode({ level, onComplete }: Props) {
  const [scenario, setScenario]   = useState<Scenario>(makeScenario)
  const [submitted, setSubmitted] = useState(false)
  const [hintsUsed, setHintsUsed] = useState(0)
  const [showHint,  setShowHint]  = useState(false)

  const { result, regions } = useMemo(() => {
    const r = simulate({
      flows: [{ algorithm: 'reno', ssthresh: scenario.ssthresh }],
      rtts: scenario.totalRtts,
      capacityPpr: scenario.capacityPpr,
      queueLimit:  scenario.queueLimit,
      scriptedLossRTTs: scenario.losses,
      seed: scenario.seed,
    })
    return { result: r, regions: derivePhaseRegions(r) }
  }, [scenario])

  const [answers, setAnswers] = useState<Record<string, Phase | null>>({})

  // Reset answers whenever scenario changes
  useEffect(() => {
    setAnswers(Object.fromEntries(regions.map((r) => [r.id, null])))
  }, [regions])

  function reset(s: Scenario) {
    setScenario(s)
    setSubmitted(false)
    setHintsUsed(0)
    setShowHint(false)
  }

  const correct = regions.filter((r: PhaseRegion) => answers[r.id] === r.answer).length
  const passed  = correct === regions.length && regions.length > 0

  return (
    <div className="noc-card p-6 flex flex-col gap-4">
      <p className="text-noc-muted text-xs uppercase tracking-widest">Diagnose mode</p>
      <h2 className="text-noc-bright text-lg font-semibold">{level.title}</h2>
      <p className="text-noc-text text-sm">{level.intent}</p>

      <div className="flex gap-2 flex-wrap">
        <Badge variant="idle">Reno</Badge>
        <Badge variant="idle">{regions.length} regions to label</Badge>
        <Badge variant="idle">{correct} / {regions.length} correct</Badge>
      </div>

      <Chart flows={result.perFlow} totalRtts={scenario.totalRtts} events={result.events} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {regions.map((r) => {
          const ans     = answers[r.id]
          const isRight = submitted && ans === r.answer
          const isWrong = submitted && ans !== r.answer
          return (
            <div
              key={r.id}
              className={`border rounded px-3 py-2 flex flex-col gap-1 ${
                isRight ? 'border-link-up'
                : isWrong ? 'border-link-down'
                : 'border-noc-border'
              }`}
            >
              <p className="text-noc-muted text-xs font-mono">
                RTT {r.fromRtt}–{r.toRtt}
              </p>
              <select
                value={ans ?? ''}
                disabled={submitted}
                onChange={(e) => setAnswers((a) => ({ ...a, [r.id]: e.target.value as Phase }))}
                className="bg-noc-bg border border-noc-border text-noc-text text-xs rounded px-2 py-1"
              >
                <option value="">— pick phase —</option>
                {PHASES.map((p) => (
                  <option key={p} value={p}>{PHASE_LABEL[p]}</option>
                ))}
              </select>
              {submitted && isWrong && (
                <p className="text-link-down text-xs">Actual: {PHASE_LABEL[r.answer]}</p>
              )}
            </div>
          )
        })}
      </div>

      {showHint && !submitted && (
        <p className="text-noc-muted text-xs border border-noc-border rounded px-3 py-2">
          Hint: slow start doubles per RTT; congestion avoidance adds +1 MSS per RTT;
          fast recovery follows a 3-dup-ACK halving (cwnd stays moderate); a timeout
          collapses cwnd back to 1.
        </p>
      )}

      {submitted && (
        <p className={`text-sm font-medium ${passed ? 'text-link-up' : 'text-link-down'}`}>
          {passed
            ? 'All phases labelled correctly.'
            : `${correct} / ${regions.length} correct. Review the wrong ones above.`}
        </p>
      )}

      <div className="flex gap-2 flex-wrap">
        {!submitted && (
          <>
            <Button
              size="sm"
              disabled={Object.values(answers).some((v) => v === null)}
              onClick={() => setSubmitted(true)}
            >
              Submit labels
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
