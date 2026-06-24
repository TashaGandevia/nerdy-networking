// RouterInternals mechanic — Crossbar switch simulator
// Demonstrates HOL (Head-of-Line) blocking vs. VOQ (Virtual Output Queuing)
// with a step-by-step animated 3×3 input-queued crossbar.

import { useReducer, useEffect, useRef, useMemo, useState } from 'react'
import type { Level } from '@/types'
import { Button } from '@/components/ui/Button'
import { Badge }  from '@/components/ui/Badge'

interface RouterInternalsProps {
  level: Level
  onComplete: (passed: boolean, hintsUsed: number) => void
}

interface Setup {
  /** 'hol' = only HOL mode, 'voq' = only VOQ, 'both' = user can toggle */
  mode: 'hol' | 'voq' | 'both'
  /** queues[inputIdx] = ordered list of destination port indices */
  queues: number[][]
  /** Fraction of totalPackets that must be delivered to pass (0 = always pass) */
  targetThroughput: number
  /** Simulation ends after this many slots */
  maxSlots: number
}

// ── Per-level scenario randomizers ─────────────────────────────────────────

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function makeAdversarial(): number[][] {
  // 3 inputs, 3 outputs; I0 always wants O0; I1 wants O0 first (HOL),
  // then a different port repeatedly; I2 wants the third port repeatedly.
  const len      = rand(4, 6)
  const i1Tail   = rand(1, 2)            // 1 or 2
  const i2Port   = i1Tail === 1 ? 2 : 1  // whichever I1 doesn't use
  return [
    Array(len).fill(0),
    [0, ...Array(len - 1).fill(i1Tail)],
    Array(len).fill(i2Port),
  ]
}

function makeUniform(): number[][] {
  // 3 inputs × 3 outputs, each input wants each output equally — adversarial for FIFO
  const cycles = rand(2, 3)
  const cycle0 = [0, 1, 2]
  const cycle1 = [1, 2, 0]
  const cycle2 = [2, 0, 1]
  return [
    Array.from({ length: cycles * 3 }, (_, i) => cycle0[i % 3]),
    Array.from({ length: cycles * 3 }, (_, i) => cycle1[i % 3]),
    Array.from({ length: cycles * 3 }, (_, i) => cycle2[i % 3]),
  ]
}

function randomizeSetup(base: Setup, levelId: string): Setup {
  // B-L08 = adversarial HOL demo; B-L09 = same pattern with VOQ toggle;
  // B-L10 = uniform crossbar boss; others fall back to the level's authored queues.
  if (levelId === 'B-L08' || levelId === 'B-L09') {
    const queues = makeAdversarial()
    return {
      ...base,
      queues,
      maxSlots: levelId === 'B-L08' ? queues[0].length + rand(1, 2) : queues[0].length + rand(2, 3),
    }
  }
  if (levelId === 'B-L10') {
    const queues = makeUniform()
    return { ...base, queues, maxSlots: queues[0].length + rand(2, 4) }
  }
  return base
}

const HINTS: Record<string, string[]> = {
  'B-L08': [
    'In FIFO mode each input has one queue — the head packet blocks everything behind it, even if those packets could go elsewhere.',
    'Watch what happens to Input 1: it gets matched on slot 1, but only one packet per slot — the rest of its queue is stuck behind any new head packet.',
  ],
  'B-L09': [
    'VOQ gives each input a separate queue per output, so the scheduler can pick *any* matchable packet rather than only the head.',
    'In each slot you want a maximum matching: at most one packet per input and one per output, but as many pairs as possible.',
  ],
  'B-L10': [
    'Under uniform traffic, every input wants every output equally — FIFO peaks at ~58% throughput due to head-of-line blocking.',
    'VOQ pairs inputs and outputs greedily each slot; with a good matching, throughput approaches 100%.',
  ],
}

// Blue / Green / Orange — one colour per output port (up to 3)
const PORT_CLR = ['#58a6ff', '#3fb950', '#f78166'] as const

// ── Scheduling algorithms ────────────────────────────────────────────────────

function holStep(queues: number[][]): {
  newQueues: number[][]
  matched: [number, number][]
  blocked: number[]
} {
  const usedOut = new Set<number>()
  const matched: [number, number][] = []
  const blocked: number[] = []

  queues.forEach((q, i) => {
    if (q.length === 0) return
    const dst = q[0]
    if (!usedOut.has(dst)) { matched.push([i, dst]); usedOut.add(dst) }
    else blocked.push(i)
  })

  const matchedIn = new Set(matched.map(([i]) => i))
  return {
    newQueues: queues.map((q, i) => (matchedIn.has(i) ? q.slice(1) : q)),
    matched,
    blocked,
  }
}

function voqStep(voq: number[][]): {
  newVoq: number[][]
  matched: [number, number][]
  blocked: number[]
} {
  const usedOut = new Set<number>()
  const usedIn  = new Set<number>()
  const matched: [number, number][] = []

  for (let i = 0; i < voq.length; i++) {
    for (let d = 0; d < voq[i].length; d++) {
      if (voq[i][d] > 0 && !usedIn.has(i) && !usedOut.has(d)) {
        matched.push([i, d]); usedIn.add(i); usedOut.add(d); break
      }
    }
  }

  const blocked: number[] = []
  for (let i = 0; i < voq.length; i++) {
    if (!usedIn.has(i) && voq[i].some(c => c > 0)) blocked.push(i)
  }

  const newVoq = voq.map(row => [...row])
  matched.forEach(([i, d]) => { newVoq[i][d] = Math.max(0, newVoq[i][d] - 1) })
  return { newVoq, matched, blocked }
}

// ── Reducer ──────────────────────────────────────────────────────────────────

interface SimState {
  mode: 'hol' | 'voq'
  holQ: number[][]
  voqQ: number[][]
  slot: number
  delivered: number
  animMatched: [number, number][]
  animBlocked: number[]
  log: string[]
  done: boolean
}

type Action =
  | { type: 'STEP' }
  | { type: 'RESET'; mode: 'hol' | 'voq' }
  | { type: 'CLEAR_ANIM' }

function initState(setup: Setup, mode: 'hol' | 'voq'): SimState {
  const numOut = Math.max(...setup.queues.flat(), 2) + 1
  const voqQ: number[][] = setup.queues.map(() => Array<number>(numOut).fill(0))
  setup.queues.forEach((q, i) => q.forEach(d => voqQ[i][d]++))
  return {
    mode,
    holQ: setup.queues.map(q => [...q]),
    voqQ,
    slot: 0, delivered: 0,
    animMatched: [], animBlocked: [], log: [], done: false,
  }
}

function makeReducer(setup: Setup, maxSlots: number, totalPackets: number) {
  return (state: SimState, action: Action): SimState => {
    switch (action.type) {
      case 'RESET':      return initState(setup, action.mode)
      case 'CLEAR_ANIM': return { ...state, animMatched: [], animBlocked: [] }
      case 'STEP': {
        if (state.done) return state

        let matched: [number, number][] = []
        let blocked: number[] = []
        let newHolQ = state.holQ
        let newVoqQ = state.voqQ
        let delta   = 0

        if (state.mode === 'hol') {
          const r = holStep(state.holQ)
          ;({ matched, blocked } = r); newHolQ = r.newQueues; delta = matched.length
        } else {
          const r = voqStep(state.voqQ)
          ;({ matched, blocked } = r); newVoqQ = r.newVoq; delta = matched.length
        }

        const slot      = state.slot + 1
        const delivered = state.delivered + delta
        const done      = slot >= maxSlots || delivered >= totalPackets

        const entry = `Slot ${slot}: ${
          matched.map(([i, d]) => `I${i}→O${d}`).join(', ') || '—'
        }${blocked.length ? `  |  HOL-blocked: ${blocked.map(i => `I${i}`).join(', ')}` : ''}`

        return {
          ...state,
          holQ: newHolQ, voqQ: newVoqQ,
          slot, delivered,
          animMatched: matched, animBlocked: blocked,
          log: [...state.log.slice(-4), entry],
          done,
        }
      }
      default: return state
    }
  }
}

// ── Component ────────────────────────────────────────────────────────────────

export function RouterInternals({ level, onComplete }: RouterInternalsProps) {
  const baseSetup = level.setup as unknown as Setup
  const [scenarioKey, setScenarioKey] = useState(0)
  const setup = useMemo(() => randomizeSetup(baseSetup, level.id), [baseSetup, level.id, scenarioKey])
  const hints = HINTS[level.id] ?? []
  const [hintIdx, setHintIdx] = useState(0)

  const modes        = setup.mode === 'both' ? (['hol', 'voq'] as const) : [setup.mode as 'hol' | 'voq']
  const totalPackets = useMemo(() => setup.queues.reduce((s, q) => s + q.length, 0), [setup])
  const maxSlots     = setup.maxSlots ?? 8
  const target       = setup.targetThroughput ?? 0
  const numOut       = useMemo(() => Math.max(...setup.queues.flat(), 2) + 1, [setup])

  const reducer  = useMemo(() => makeReducer(setup, maxSlots, totalPackets), [setup, maxSlots, totalPackets])
  const [state, dispatch] = useReducer(reducer, undefined, () => initState(setup, modes[0]))

  const runningRef = useRef(false)
  const [, forceRender] = useReducer(x => x + 1, 0)
  // Track running in a ref so the interval callback always sees the latest value
  const setRunningState = (v: boolean) => { runningRef.current = v; forceRender() }

  const completedRef = useRef(false)

  useEffect(() => {
    if (state.done && !completedRef.current) {
      completedRef.current = true
      runningRef.current   = false
      const throughput = totalPackets > 0 ? state.delivered / totalPackets : 1
      onComplete(throughput >= target, hintIdx)
    }
  }, [state.done])

  // When the scenario regenerates, reset sim state.
  useEffect(() => {
    completedRef.current = false
    runningRef.current   = false
    dispatch({ type: 'RESET', mode: modes[0] })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setup])

  function newScenario() {
    setScenarioKey(k => k + 1)
    setHintIdx(0)
  }

  // Clear anim overlay after 400 ms
  useEffect(() => {
    if (state.animMatched.length === 0 && state.animBlocked.length === 0) return
    const id = setTimeout(() => dispatch({ type: 'CLEAR_ANIM' }), 400)
    return () => clearTimeout(id)
  }, [state.slot])

  // Auto-play loop
  const stepRef = useRef<() => void>(() => {})
  stepRef.current = () => { if (!state.done) dispatch({ type: 'STEP' }) }

  useEffect(() => {
    if (!runningRef.current) return
    const id = setInterval(() => {
      if (!runningRef.current || state.done) { clearInterval(id); setRunningState(false); return }
      stepRef.current()
    }, 650)
    return () => clearInterval(id)
  }, [runningRef.current, state.done])

  function handleModeSwitch(m: 'hol' | 'voq') {
    setRunningState(false)
    completedRef.current = false
    dispatch({ type: 'RESET', mode: m })
  }

  function handleReset() {
    setRunningState(false)
    completedRef.current = false
    dispatch({ type: 'RESET', mode: state.mode })
  }

  const throughputPct = totalPackets > 0
    ? Math.round((state.delivered / totalPackets) * 100)
    : 0

  // ── SVG crossbar constants ─────────────────────────────────────────────
  const SVG_W = 580, SVG_H = 260
  const IN_X  = 10,  IN_W = 140, PORT_H = 54, PORT_GAP = 18
  const CB_X  = 170, CB_W = 220, CB_Y = 10, CB_H = SVG_H - 20
  const OUT_X = 410, OUT_W = 140

  const portY = (i: number) => CB_Y + 10 + i * (PORT_H + PORT_GAP)
  const portMidY = (i: number) => portY(i) + PORT_H / 2

  // ── Packet chips ──────────────────────────────────────────────────────
  function HolQueue({ q, inputIdx }: { q: number[]; inputIdx: number }) {
    const isBlocked = state.animBlocked.includes(inputIdx)
    const isMatched = state.animMatched.some(([i]) => i === inputIdx)
    const display   = q.slice(0, 7)
    return (
      <g>
        <rect
          x={IN_X} y={portY(inputIdx)} width={IN_W} height={PORT_H} rx={5}
          fill="#0d1117"
          stroke={isBlocked ? '#f78166' : isMatched ? '#3fb950' : '#30363d'}
          strokeWidth={isBlocked || isMatched ? 2 : 1}
        />
        <text x={IN_X + 6} y={portY(inputIdx) + 13} fill="#6e7681" fontSize={9} fontFamily="monospace">
          In {inputIdx}
        </text>
        {display.map((dst, j) => (
          <g key={j}>
            <rect
              x={IN_X + 6 + j * 18} y={portY(inputIdx) + 20} width={15} height={22} rx={3}
              fill={PORT_CLR[dst] ?? '#6e7681'}
              opacity={j === 0 && isBlocked ? 0.4 : 0.85}
            />
            <text
              x={IN_X + 6 + j * 18 + 7.5} y={portY(inputIdx) + 32}
              textAnchor="middle" dominantBaseline="middle"
              fill="#0d1117" fontSize={8} fontFamily="monospace" fontWeight="bold"
            >
              {dst}
            </text>
          </g>
        ))}
        {q.length > 7 && (
          <text x={IN_X + IN_W - 8} y={portY(inputIdx) + 33} textAnchor="end" fill="#6e7681" fontSize={9} fontFamily="monospace">
            +{q.length - 7}
          </text>
        )}
        {isBlocked && (
          <text x={IN_X + 6} y={portY(inputIdx) + PORT_H - 6} fill="#f78166" fontSize={8} fontFamily="monospace">
            HOL BLOCKED
          </text>
        )}
      </g>
    )
  }

  function VoqQueue({ subQ, inputIdx }: { subQ: number[]; inputIdx: number }) {
    const isBlocked = state.animBlocked.includes(inputIdx)
    const isMatched = state.animMatched.some(([i]) => i === inputIdx)
    return (
      <g>
        <rect
          x={IN_X} y={portY(inputIdx)} width={IN_W} height={PORT_H} rx={5}
          fill="#0d1117"
          stroke={isBlocked ? '#f78166' : isMatched ? '#3fb950' : '#30363d'}
          strokeWidth={isBlocked || isMatched ? 2 : 1}
        />
        <text x={IN_X + 6} y={portY(inputIdx) + 13} fill="#6e7681" fontSize={9} fontFamily="monospace">
          In {inputIdx}
        </text>
        {subQ.map((cnt, d) => (
          <g key={d}>
            <text x={IN_X + 6} y={portY(inputIdx) + 22 + d * 11} fill={PORT_CLR[d] ?? '#6e7681'} fontSize={8} fontFamily="monospace">
              →O{d}:
            </text>
            {Array.from({ length: Math.min(cnt, 6) }).map((_, j) => (
              <rect key={j}
                x={IN_X + 34 + j * 9} y={portY(inputIdx) + 14 + d * 11} width={7} height={8} rx={2}
                fill={PORT_CLR[d] ?? '#6e7681'} opacity={0.8}
              />
            ))}
            {cnt > 6 && (
              <text x={IN_X + 34 + 7 * 9} y={portY(inputIdx) + 20 + d * 11} fill="#6e7681" fontSize={7} fontFamily="monospace">+{cnt - 6}</text>
            )}
          </g>
        ))}
      </g>
    )
  }

  return (
    <div className="flex flex-col gap-4 w-full max-w-3xl">
      {/* Header */}
      <div className="noc-card p-4 flex flex-col gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="idle">Router Internals</Badge>
          {modes.length > 1 && modes.map(m => (
            <button
              key={m}
              onClick={() => handleModeSwitch(m)}
              className={`text-xs px-3 py-1 rounded border font-mono uppercase tracking-wider transition-colors ${
                state.mode === m
                  ? 'border-link-packet text-link-packet bg-link-packet/10'
                  : 'border-noc-border text-noc-muted hover:border-noc-text'
              }`}
            >
              {m === 'hol' ? 'FIFO / HOL' : 'VOQ'}
            </button>
          ))}
          {modes.length === 1 && (
            <Badge variant={state.mode === 'hol' ? 'down' : 'idle'}>
              {state.mode === 'hol' ? 'FIFO / HOL mode' : 'VOQ mode'}
            </Badge>
          )}
          <span className="text-noc-muted text-xs ml-auto font-mono">
            Slot {state.slot}/{maxSlots} &nbsp;·&nbsp; Delivered {state.delivered}/{totalPackets} &nbsp;·&nbsp; {throughputPct}%
          </span>
        </div>
        <p className="text-noc-text text-sm">{level.intent}</p>
      </div>

      {/* Crossbar SVG */}
      <div className="noc-card p-2">
        <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full" aria-label="Crossbar switch diagram">
          {/* Crossbar fabric */}
          <rect x={CB_X} y={CB_Y} width={CB_W} height={CB_H} rx={8}
            fill="#0d1117" stroke="#30363d" strokeWidth={2} strokeDasharray="5 3" />
          <text x={CB_X + CB_W / 2} y={SVG_H / 2 - 6} textAnchor="middle" fill="#30363d" fontSize={13} fontFamily="monospace">CROSSBAR</text>
          <text x={CB_X + CB_W / 2} y={SVG_H / 2 + 10} textAnchor="middle" fill="#30363d" fontSize={10} fontFamily="monospace">FABRIC</text>

          {/* Wires: input → crossbar */}
          {setup.queues.map((_, i) => (
            <line key={`wi-${i}`}
              x1={IN_X + IN_W} y1={portMidY(i)} x2={CB_X} y2={portMidY(i)}
              stroke="#30363d" strokeWidth={1.5} />
          ))}

          {/* Wires: crossbar → output */}
          {Array.from({ length: numOut }).map((_, d) => (
            <line key={`wo-${d}`}
              x1={CB_X + CB_W} y1={portMidY(d)} x2={OUT_X} y2={portMidY(d)}
              stroke="#30363d" strokeWidth={1.5} />
          ))}

          {/* Active connection paths (shown during anim) */}
          {state.animMatched.map(([i, d]) => {
            const x1 = CB_X, y1 = portMidY(i)
            const x2 = CB_X + CB_W, y2 = portMidY(d)
            return (
              <path key={`conn-${i}-${d}`}
                d={`M${x1},${y1} C${x1 + 60},${y1} ${x2 - 60},${y2} ${x2},${y2}`}
                fill="none" stroke={PORT_CLR[d] ?? '#6e7681'} strokeWidth={2.5} opacity={0.8}
              />
            )
          })}

          {/* Input queues */}
          {state.mode === 'hol'
            ? state.holQ.map((q, i) => <HolQueue key={i} q={q} inputIdx={i} />)
            : state.voqQ.map((subQ, i) => <VoqQueue key={i} subQ={subQ} inputIdx={i} />)
          }

          {/* Output ports */}
          {Array.from({ length: numOut }).map((_, d) => {
            const isActive = state.animMatched.some(([, od]) => od === d)
            return (
              <g key={`out-${d}`}>
                <rect x={OUT_X} y={portY(d)} width={OUT_W} height={PORT_H} rx={5}
                  fill="#0d1117"
                  stroke={isActive ? PORT_CLR[d] : '#30363d'}
                  strokeWidth={isActive ? 2 : 1}
                />
                <text x={OUT_X + 8} y={portY(d) + 13} fill="#6e7681" fontSize={9} fontFamily="monospace">
                  Out {d}
                </text>
                <text x={OUT_X + 8} y={portY(d) + 37}
                  fill={PORT_CLR[d] ?? '#6e7681'} fontSize={20} fontFamily="monospace" fontWeight="bold">
                  ■
                </text>
                <text x={OUT_X + 28} y={portY(d) + 37}
                  fill="#c9d1d9" fontSize={14} fontFamily="monospace" fontWeight="bold">
                  ×{state.delivered > 0 || state.slot > 0
                    ? /* show per-output count from log is complex; show total delivered on last row only */ ''
                    : '0'}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      {/* Controls */}
      <div className="noc-card p-4 flex flex-col gap-3">
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" onClick={() => dispatch({ type: 'STEP' })} disabled={state.done || runningRef.current}>
            Next Slot
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setRunningState(!runningRef.current)}
            disabled={state.done}
          >
            {runningRef.current ? '⏸ Pause' : '▶ Run'}
          </Button>
          <Button size="sm" variant="secondary" onClick={handleReset}>
            Reset
          </Button>
          <Button size="sm" variant="ghost" onClick={newScenario}>
            New scenario
          </Button>
          {hintIdx < hints.length && (
            <Button size="sm" variant="ghost" onClick={() => setHintIdx(n => n + 1)}>
              Hint ({hintIdx + 1}/{hints.length})
            </Button>
          )}

          {/* Throughput bar */}
          <div className="flex-1 flex items-center gap-2 min-w-[140px]">
            <span className="text-xs text-noc-muted font-mono whitespace-nowrap">Throughput</span>
            <div className="flex-1 h-2 bg-noc-border rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${throughputPct}%`,
                  background: throughputPct >= target * 100 ? '#3fb950' : '#f78166',
                }}
              />
            </div>
            <span className="text-xs font-mono text-noc-muted">{throughputPct}%</span>
          </div>
        </div>

        {hintIdx > 0 && (
          <div className="border border-noc-border rounded px-3 py-2 flex flex-col gap-1">
            {hints.slice(0, hintIdx).map((h, i) => (
              <p key={i} className="text-noc-muted text-xs">💡 {h}</p>
            ))}
          </div>
        )}

        {/* Log */}
        <div className="bg-noc-bg border border-noc-border rounded px-3 py-2 min-h-[60px]">
          {state.log.length === 0
            ? <p className="text-noc-muted text-xs font-mono">Press "Next Slot" or "Run" to start.</p>
            : state.log.map((entry, i) => (
              <p key={i} className={`text-xs font-mono ${i === state.log.length - 1 ? 'text-noc-bright' : 'text-noc-muted'}`}>
                {entry}
              </p>
            ))
          }
        </div>

        {state.done && (
          <div className={`rounded px-3 py-2 text-sm font-semibold ${
            state.delivered / totalPackets >= target
              ? 'bg-link-up/10 border border-link-up text-link-up'
              : 'bg-link-down/10 border border-link-down text-link-down'
          }`}>
            {state.delivered / totalPackets >= target
              ? `✓ Passed — ${throughputPct}% throughput (target: ${Math.round(target * 100)}%)`
              : `✗ Low throughput — ${throughputPct}% delivered (need ${Math.round(target * 100)}%)`
            }
          </div>
        )}
      </div>
    </div>
  )
}
