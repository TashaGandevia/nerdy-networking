// Per-RTT discrete-time congestion simulator backing all Module A levels.
//
// One "tick" = one RTT. Each flow updates cwnd, the bottleneck drains capacity,
// queue overflow drives loss events, and (for DCTCP) ECN marks are emitted when
// queue length exceeds K. Output is a per-RTT time series plus event markers.

export type Algorithm = 'reno' | 'cubic' | 'dctcp'
export type AQM       = 'none' | 'red' | 'ecn'

export type EventKind = 'three-dup-ack' | 'timeout' | 'ecn-mark'

export interface SimEvent {
  rtt: number
  flowIdx: number
  kind: EventKind
}

export interface FlowConfig {
  algorithm:    Algorithm
  /** Initial slow-start threshold (packets). */
  ssthresh?:    number
  /** First RTT at which this flow starts sending. */
  startRTT?:    number
}

export interface SimConfig {
  flows:        FlowConfig[]
  rtts:         number
  /** Bottleneck capacity in packets per RTT. */
  capacityPpr:  number
  /** Max queue length in packets. Overflow triggers loss. */
  queueLimit:   number
  /** Active queue management policy. */
  aqm?:         AQM
  /** DCTCP/RED marking threshold K (in packets). */
  markThreshold?: number
  /** Random per-packet loss probability (Bernoulli, independent of queue). */
  lossProb?:    number
  /** Force a loss event at these RTTs (e.g. for Predict/Diagnose levels). */
  scriptedLossRTTs?: number[]
  /** Seed for deterministic random loss; 0 = unseeded. */
  seed?:        number
}

export interface FlowSeries {
  cwnd:    number[]   // packets, one entry per RTT
  acked:   number[]   // bytes acked this RTT (for goodput)
}

export interface SimResult {
  perFlow:   FlowSeries[]
  queue:     number[]   // queue depth at end of each RTT
  totalAcked: number    // sum across flows × rtts (used for goodput)
  events:    SimEvent[]
}

// Tiny seedable PRNG (mulberry32) for deterministic loss.
function makeRng(seed: number) {
  let s = seed | 0
  return () => {
    s = (s + 0x6D2B79F5) | 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// CUBIC constants (RFC 8312). Time is in RTTs (≈ seconds for the visual).
const CUBIC_C    = 0.4
const CUBIC_BETA = 0.7

interface FlowState {
  cfg:        FlowConfig
  cwnd:       number
  ssthresh:   number
  // Reno-style phase
  phase:      'slow-start' | 'avoidance' | 'recovery'
  // CUBIC bookkeeping
  wMax:       number
  tLastLoss:  number
  // DCTCP smoothed marking fraction
  alpha:      number
  markedThisRTT: number
  sentThisRTT:   number
}

function initialState(cfg: FlowConfig): FlowState {
  return {
    cfg,
    cwnd:      1,
    ssthresh:  cfg.ssthresh ?? 64,
    phase:     'slow-start',
    wMax:      10,
    tLastLoss: 0,
    alpha:     0,
    markedThisRTT: 0,
    sentThisRTT:   0,
  }
}

function cubicNext(cwnd: number, wMax: number, tSinceLoss: number): number {
  // K = ∛(W_max·(1−β)/C)
  const K = Math.cbrt((wMax * (1 - CUBIC_BETA)) / CUBIC_C)
  const target = CUBIC_C * Math.pow(tSinceLoss - K, 3) + wMax
  return Math.max(cwnd + 0.5, target)
}

function reactToLoss(s: FlowState, kind: EventKind, rtt: number) {
  if (s.cfg.algorithm === 'cubic') {
    s.wMax      = s.cwnd
    s.cwnd      = Math.max(2, s.cwnd * CUBIC_BETA)
    s.ssthresh  = s.cwnd
    s.tLastLoss = rtt
    s.phase     = 'avoidance'
    return
  }
  // Reno / DCTCP fall back to AIMD on real loss
  if (kind === 'timeout') {
    s.ssthresh = Math.max(2, Math.floor(s.cwnd / 2))
    s.cwnd     = 1
    s.phase    = 'slow-start'
  } else {
    // 3-dup-ACK → fast retransmit + fast recovery
    s.ssthresh = Math.max(2, Math.floor(s.cwnd / 2))
    s.cwnd     = s.ssthresh
    s.phase    = 'avoidance'
  }
}

function growCwnd(s: FlowState, rtt: number) {
  if (s.cfg.algorithm === 'cubic' && s.phase === 'avoidance') {
    s.cwnd = cubicNext(s.cwnd, s.wMax, rtt - s.tLastLoss)
    return
  }
  if (s.phase === 'slow-start') {
    s.cwnd = Math.min(s.cwnd * 2, s.ssthresh)
    if (s.cwnd >= s.ssthresh) s.phase = 'avoidance'
  } else {
    s.cwnd += 1
  }
}

/**
 * Run the simulator. Returns per-flow cwnd, queue depth, and event markers
 * across `rtts` discrete time steps.
 */
export function simulate(cfg: SimConfig): SimResult {
  const rng = makeRng(cfg.seed ?? 1)
  const states = cfg.flows.map(initialState)
  const perFlow: FlowSeries[] = states.map(() => ({ cwnd: [], acked: [] }))
  const queueSeries: number[] = []
  const events: SimEvent[]    = []
  const scripted = new Set(cfg.scriptedLossRTTs ?? [])

  let queue       = 0
  let totalAcked  = 0

  for (let t = 0; t < cfg.rtts; t++) {
    // 1. Each active flow offers cwnd packets into the bottleneck.
    let offered = 0
    states.forEach((s, i) => {
      if (t < (s.cfg.startRTT ?? 0)) { perFlow[i].cwnd.push(0); perFlow[i].acked.push(0); return }
      perFlow[i].cwnd.push(s.cwnd)
      s.sentThisRTT  = Math.round(s.cwnd)
      offered       += s.sentThisRTT
    })

    // 2. Drain bottleneck. Queue accepts up to queueLimit before dropping.
    const arrived      = offered + queue
    const served       = Math.min(arrived, cfg.capacityPpr)
    let   afterService = arrived - served
    let   dropped      = 0

    if (afterService > cfg.queueLimit) {
      dropped      = afterService - cfg.queueLimit
      afterService = cfg.queueLimit
    }

    // 3. ECN marking. DCTCP / ECN mark once queue exceeds K (no drop).
    const K           = cfg.markThreshold ?? Math.floor(cfg.queueLimit / 4)
    const ecnOn       = cfg.aqm === 'ecn'
    let   markedFrac  = 0
    if (ecnOn && afterService > K) {
      markedFrac = Math.min(1, (afterService - K) / Math.max(1, cfg.queueLimit - K))
    }

    // RED random early drop (approximation)
    if (cfg.aqm === 'red' && afterService > K) {
      const p = Math.min(0.5, (afterService - K) / Math.max(1, cfg.queueLimit - K))
      if (rng() < p) {
        dropped     += 1
        afterService = Math.max(0, afterService - 1)
      }
    }

    queue = afterService

    // 4. Apply random Bernoulli loss across served packets.
    const lossProb = cfg.lossProb ?? 0
    let randomLoss = 0
    if (lossProb > 0) {
      for (let n = 0; n < served; n++) if (rng() < lossProb) randomLoss++
    }

    // 5. Assign drops / marks proportionally to flows by their share of offered.
    states.forEach((s, i) => {
      const share        = offered === 0 ? 0 : s.sentThisRTT / offered
      const ackedPackets = Math.max(0, Math.round(s.sentThisRTT * (served / Math.max(1, offered))))
      perFlow[i].acked.push(ackedPackets)
      totalAcked        += ackedPackets

      const flowDropped = Math.round((dropped + randomLoss) * share)
      const flowMarked  = ecnOn ? Math.round(s.sentThisRTT * markedFrac) : 0
      s.markedThisRTT   = flowMarked

      if (flowDropped > 0) {
        // Heuristic: small loss → 3-dup-ACK; large or scripted → timeout.
        const kind: EventKind = (flowDropped >= s.cwnd * 0.5) ? 'timeout' : 'three-dup-ack'
        events.push({ rtt: t, flowIdx: i, kind })
        reactToLoss(s, kind, t)
        return
      }
      if (scripted.has(t)) {
        const kind: EventKind = (t % 2 === 0) ? 'three-dup-ack' : 'timeout'
        events.push({ rtt: t, flowIdx: i, kind })
        reactToLoss(s, kind, t)
        return
      }

      if (s.cfg.algorithm === 'dctcp' && ecnOn) {
        // Smoothed alpha: α ← (1 − g)α + g·F, g = 1/16
        const g  = 1 / 16
        const F  = s.sentThisRTT === 0 ? 0 : flowMarked / s.sentThisRTT
        s.alpha  = (1 - g) * s.alpha + g * F
        if (flowMarked > 0) {
          events.push({ rtt: t, flowIdx: i, kind: 'ecn-mark' })
          s.cwnd = Math.max(2, s.cwnd * (1 - s.alpha / 2))
          return
        }
      }

      growCwnd(s, t)
    })

    queueSeries.push(queue)
  }

  return { perFlow, queue: queueSeries, totalAcked, events }
}

/** Convenience: fraction of bottleneck capacity actually used (0..1). */
export function utilization(r: SimResult, capacityPpr: number): number {
  const rtts = r.queue.length
  if (rtts === 0) return 0
  return r.totalAcked / (capacityPpr * rtts)
}

/** Jain's fairness index over per-flow goodputs. */
export function jainFairness(r: SimResult): number {
  const goodputs = r.perFlow.map((f) => f.acked.reduce((a, b) => a + b, 0))
  const n        = goodputs.length
  if (n === 0) return 1
  const sum      = goodputs.reduce((a, b) => a + b, 0)
  const sumSq    = goodputs.reduce((a, b) => a + b * b, 0)
  if (sumSq === 0) return 1
  return (sum * sum) / (n * sumSq)
}
