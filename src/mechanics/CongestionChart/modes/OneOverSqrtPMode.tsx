// A-L03 Tune — Verify Reno throughput ≈ 0.75·MSS/(RTT·√p) by sweeping loss rate.
// The player runs experiments at one or more loss rates; once the measured/formula
// ratio falls within ±5%, the level passes.

import { useMemo, useState } from 'react'
import type { Level } from '@/types'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { simulate, utilization } from '../simulator'
import { Chart } from '../Chart'

interface Props {
  level:      Level
  onComplete: (passed: boolean, hintsUsed: number) => void
}

const TOLERANCE = 0.20                  // ±20% — formula is asymptotic

interface Experiment {
  lossRate:  number
  predicted: number   // packets/RTT
  measured:  number   // packets/RTT
  ratio:     number   // measured / predicted
  passed:    boolean
}

interface Scenario {
  totalRtts: number
  capacity:  number
  seeds:     number[]   // multiple seeds to denoise the measurement
}

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function makeScenario(): Scenario {
  const seeds: number[] = []
  for (let i = 0; i < 5; i++) seeds.push(rand(1, 9999))
  return {
    totalRtts: rand(100, 160),
    capacity:  rand(80, 140),
    seeds,
  }
}

function runOnce(lossProb: number, scenario: Scenario) {
  const goodputs = scenario.seeds.map((seed) => {
    const r = simulate({
      flows: [{ algorithm: 'reno', ssthresh: 64 }],
      rtts: scenario.totalRtts,
      capacityPpr: scenario.capacity,
      queueLimit:  1000,           // avoid queue-overflow losses; only random loss
      lossProb,
      seed,
    })
    return utilization(r, scenario.capacity) * scenario.capacity    // packets/RTT
  })
  return goodputs.reduce((a, b) => a + b, 0) / goodputs.length
}

export function OneOverSqrtPMode({ level, onComplete }: Props) {
  const [scenario, setScenario]   = useState<Scenario>(makeScenario)
  const [lossRate, setLossRate]   = useState(() => 0.005 + Math.random() * 0.02)
  const [history,  setHistory]    = useState<Experiment[]>([])
  const [hintsUsed, setHintsUsed] = useState(0)
  const [showHint, setShowHint]   = useState(false)

  function reset() {
    setScenario(makeScenario())
    setLossRate(0.005 + Math.random() * 0.02)
    setHistory([])
    setHintsUsed(0)
    setShowHint(false)
  }

  function runExperiment() {
    const measured  = runOnce(lossRate, scenario)
    const predicted = 0.75 / Math.sqrt(lossRate)   // packets/RTT (MSS=1, RTT=1)
    const ratio     = measured / predicted
    const passed    = Math.abs(ratio - 1) <= TOLERANCE
    setHistory((h) => [...h, { lossRate, predicted, measured, ratio, passed }])
  }

  const passed = history.some((e) => e.passed)

  // Show the most recent trace
  const lastRun = useMemo(() => {
    if (history.length === 0) return null
    return simulate({
      flows: [{ algorithm: 'reno', ssthresh: 64 }],
      rtts: scenario.totalRtts,
      capacityPpr: scenario.capacity,
      queueLimit:  1000,
      lossProb:    history[history.length - 1].lossRate,
      seed: scenario.seeds[0],
    })
  }, [history, scenario])

  return (
    <div className="noc-card p-6 flex flex-col gap-4">
      <p className="text-noc-muted text-xs uppercase tracking-widest">Tune mode</p>
      <h2 className="text-noc-bright text-lg font-semibold">{level.title}</h2>
      <p className="text-noc-text text-sm">{level.intent}</p>

      <div className="flex gap-2 flex-wrap">
        <Badge variant="idle">Reno</Badge>
        <Badge variant="idle">{scenario.totalRtts} RTTs · {scenario.capacity} pkts/RTT</Badge>
        <Badge variant="idle">Formula: 0.75·MSS / (RTT·√p)</Badge>
        <Badge variant="idle">Pass when measured / predicted ∈ [{(1 - TOLERANCE).toFixed(2)}, {(1 + TOLERANCE).toFixed(2)}]</Badge>
      </div>

      {/* Loss rate slider */}
      <div className="flex flex-col gap-2">
        <label className="text-noc-text text-xs flex items-center justify-between">
          <span>Random per-packet loss probability</span>
          <span className="font-mono text-noc-bright">
            p = {(lossRate * 100).toFixed(2)}%
          </span>
        </label>
        <input
          type="range"
          min={0.001} max={0.05} step={0.001}
          value={lossRate}
          onChange={(e) => setLossRate(parseFloat(e.target.value))}
          className="accent-link-packet"
        />
      </div>

      {lastRun && (
        <Chart
          flows={lastRun.perFlow}
          totalRtts={scenario.totalRtts}
          events={lastRun.events.slice(0, 60)}     // cap markers for readability
        />
      )}

      {/* Experiment history */}
      {history.length > 0 && (
        <div className="border border-noc-border rounded overflow-hidden">
          <table className="w-full text-xs font-mono">
            <thead className="bg-noc-bg text-noc-muted">
              <tr>
                <th className="text-left px-2 py-1">p</th>
                <th className="text-right px-2 py-1">Predicted</th>
                <th className="text-right px-2 py-1">Measured</th>
                <th className="text-right px-2 py-1">Ratio</th>
                <th className="text-right px-2 py-1">Result</th>
              </tr>
            </thead>
            <tbody>
              {history.map((e, i) => (
                <tr key={i} className="border-t border-noc-border">
                  <td className="px-2 py-1">{(e.lossRate * 100).toFixed(2)}%</td>
                  <td className="px-2 py-1 text-right">{e.predicted.toFixed(2)}</td>
                  <td className="px-2 py-1 text-right">{e.measured.toFixed(2)}</td>
                  <td className="px-2 py-1 text-right">{(e.ratio * 100).toFixed(0)}%</td>
                  <td className={`px-2 py-1 text-right ${e.passed ? 'text-link-up' : 'text-link-down'}`}>
                    {e.passed ? 'PASS' : 'off'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showHint && (
        <p className="text-noc-muted text-xs border border-noc-border rounded px-3 py-2">
          Hint: the formula is asymptotic — very low p (≪ 1%) or very high p (≫ 5%)
          diverges. Try the middle of the slider (~1–2%) where Reno's sawtooth has many
          full cycles inside {scenario.totalRtts} RTTs.
        </p>
      )}

      {passed && (
        <p className="text-link-up text-sm font-medium">
          Formula confirmed — measurement matched 0.75/√p within tolerance.
        </p>
      )}

      <div className="flex gap-2 flex-wrap">
        <Button size="sm" onClick={runExperiment}>Run experiment</Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={showHint}
          onClick={() => { setShowHint(true); setHintsUsed((n) => n + 1) }}
        >
          Hint
        </Button>
        <Button
          size="sm"
          disabled={!passed}
          onClick={() => onComplete(true, hintsUsed)}
        >
          Finish level
        </Button>
        <Button size="sm" variant="ghost" onClick={reset}>
          New scenario
        </Button>
      </div>
    </div>
  )
}
