// CongestionChart mechanic — Live CongWin-vs-time visualiser
// Visual: sawtooth chart drawing in real time, bottleneck queue fill, goodput meter.
// Modes: Predict, Tune, Diagnose, Fairness Arena.
// Used by: Module D (Deck 3) — congestion control levels.

import { useEffect, useRef, useState } from 'react'
import type { Level } from '@/types'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

interface CongestionChartProps {
  level: Level
  onComplete: (passed: boolean, hintsUsed: number) => void
}

interface DataPoint { rtt: number; cwnd: number }

// Minimal Reno simulator for the placeholder — runs for 'rtts' rounds
function simulateReno(rtts: number, ssthresh = 16): DataPoint[] {
  const points: DataPoint[] = []
  let cwnd = 1
  let ssth = ssthresh

  for (let t = 0; t < rtts; t++) {
    points.push({ rtt: t, cwnd })

    // Scripted loss at t=10 and t=20 for visual interest
    if (t === 10 || t === 20) {
      ssth = Math.max(2, Math.floor(cwnd / 2))
      cwnd = ssth + 3 // fast recovery
    } else if (cwnd < ssth) {
      cwnd = Math.min(cwnd * 2, ssth) // slow start
    } else {
      cwnd += 1 // congestion avoidance
    }
  }
  return points
}

/**
 * Stub for the Congestion Chart mechanic.
 * Shows a live Reno sawtooth as a placeholder; full implementation will support
 * Predict / Tune / Diagnose / Fairness modes and all algorithms.
 *
 * @param level      - Level config with mode, algorithm, and scenario
 * @param onComplete - Callback fired when the player's solution meets win conditions
 */
export function CongestionChart({ level, onComplete }: CongestionChartProps) {
  const [points, setPoints]   = useState<DataPoint[]>([])
  const [running, setRunning] = useState(false)
  const intervalRef           = useRef<ReturnType<typeof setInterval> | null>(null)
  const allPoints             = useRef<DataPoint[]>([])

  const setup = level.setup as { rtts?: number }
  const totalRtts = setup.rtts ?? 30

  function startSim() {
    allPoints.current = simulateReno(totalRtts)
    setPoints([])
    setRunning(true)
    let i = 0
    intervalRef.current = setInterval(() => {
      i++
      setPoints(allPoints.current.slice(0, i))
      if (i >= allPoints.current.length) {
        clearInterval(intervalRef.current!)
        setRunning(false)
      }
    }, 80)
  }

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current) }, [])

  // Chart dimensions
  const W = 600, H = 180, PAD = { top: 10, right: 20, bottom: 30, left: 40 }
  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top  - PAD.bottom
  const maxCwnd = 40

  function toX(rtt: number)  { return PAD.left + (rtt / (totalRtts - 1)) * innerW }
  function toY(cwnd: number) { return PAD.top  + innerH - (cwnd / maxCwnd) * innerH }

  const polyline = points
    .map((p) => `${toX(p.rtt)},${toY(p.cwnd)}`)
    .join(' ')

  return (
    <div className="noc-card p-6 flex flex-col gap-4">
      <p className="text-noc-muted text-xs uppercase tracking-widest">Mechanic — Congestion Chart</p>
      <h2 className="text-noc-bright text-lg font-semibold">{level.title}</h2>
      <p className="text-noc-text text-sm">{level.intent}</p>

      <div className="flex gap-2 flex-wrap items-center">
        <Badge variant="idle">Mode: {(level.setup as Record<string, string>).mode ?? 'tune'}</Badge>
        <Badge variant="idle">Algorithm: Reno (placeholder)</Badge>
      </div>

      {/* Live chart */}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full border border-noc-border rounded bg-noc-bg"
        aria-label="CongWin vs time chart"
      >
        {/* Axes */}
        <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={H - PAD.bottom} stroke="#30363d" strokeWidth={1} />
        <line x1={PAD.left} y1={H - PAD.bottom} x2={W - PAD.right} y2={H - PAD.bottom} stroke="#30363d" strokeWidth={1} />

        {/* Y-axis labels */}
        {[0, 10, 20, 30, 40].map((v) => (
          <g key={v}>
            <line x1={PAD.left - 4} y1={toY(v)} x2={PAD.left} y2={toY(v)} stroke="#30363d" />
            <text x={PAD.left - 6} y={toY(v) + 1} textAnchor="end" dominantBaseline="middle" fill="#6e7681" fontSize={9} fontFamily="monospace">{v}</text>
          </g>
        ))}

        {/* Axis labels */}
        <text x={PAD.left - 2} y={PAD.top - 2} fill="#6e7681" fontSize={9} fontFamily="monospace">CW</text>
        <text x={W / 2} y={H - 4} textAnchor="middle" fill="#6e7681" fontSize={9} fontFamily="monospace">RTT</text>

        {/* Sawtooth line */}
        {points.length > 1 && (
          <polyline points={polyline} fill="none" stroke="#58a6ff" strokeWidth={2} />
        )}

        {/* Latest CW dot */}
        {points.length > 0 && (
          <circle
            cx={toX(points[points.length - 1].rtt)}
            cy={toY(points[points.length - 1].cwnd)}
            r={3}
            fill="#58a6ff"
          />
        )}
      </svg>

      <div className="flex gap-2">
        <Button size="sm" onClick={startSim} disabled={running}>
          {running ? 'Simulating…' : 'Run simulation'}
        </Button>
      </div>

      <p className="text-noc-muted text-xs border border-noc-border rounded px-3 py-2">
        🚧 Win condition: {level.winCondition}
      </p>

      <button
        className="text-xs text-noc-muted underline self-start"
        onClick={() => onComplete(true, 0)}
      >
        [Dev] Mark complete
      </button>
    </div>
  )
}
