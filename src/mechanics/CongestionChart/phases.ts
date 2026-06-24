// Derive labeled "phase" regions from a Reno cwnd trace.
// Used by Diagnose mode so each randomized scenario auto-generates its answer key.

import type { SimResult, SimEvent } from './simulator'

export type Phase = 'slow-start' | 'avoidance' | 'fast-recovery' | 'timeout'

export interface PhaseRegion {
  id:      string
  fromRtt: number
  toRtt:   number
  answer:  Phase
}

/**
 * Classify each RTT of flow 0 into a phase, then collapse consecutive same-phase
 * RTTs into regions. Heuristics:
 *   - 1 RTT immediately following a 3-dup-ack event = fast-recovery
 *   - 3 RTTs immediately following a timeout event  = timeout (then slow-start)
 *   - cwnd[t+1] ≈ 2·cwnd[t] (with tolerance) = slow-start
 *   - cwnd[t+1] ≈ cwnd[t] + 1                = avoidance
 */
export function derivePhaseRegions(result: SimResult): PhaseRegion[] {
  const cwnd = result.perFlow[0].cwnd
  const N    = cwnd.length
  if (N === 0) return []

  // Map RTT → forced phase from event aftermath
  const forced = new Map<number, Phase>()
  for (const evt of result.events) {
    if (evt.kind === 'three-dup-ack') {
      // The RTT after the event shows recovery behavior
      if (evt.rtt + 1 < N) forced.set(evt.rtt + 1, 'fast-recovery')
    } else if (evt.kind === 'timeout') {
      // Timeout collapses to 1; mark the event RTT and a couple after.
      for (let k = 0; k < 3 && evt.rtt + k < N; k++) {
        forced.set(evt.rtt + k, 'timeout')
      }
    }
  }

  const phases: Phase[] = []
  for (let t = 0; t < N; t++) {
    if (forced.has(t)) { phases.push(forced.get(t)!); continue }
    const cur  = cwnd[t]
    const next = cwnd[t + 1] ?? cur
    if (next >= cur * 1.6) phases.push('slow-start')
    else                   phases.push('avoidance')
  }

  // Collapse runs into regions.
  const regions: PhaseRegion[] = []
  let start = 0
  for (let t = 1; t <= N; t++) {
    if (t === N || phases[t] !== phases[t - 1]) {
      // Drop tiny 1-RTT noise except for fast-recovery (which is genuinely brief)
      const len = t - start
      const ph  = phases[start]
      if (len >= 2 || ph === 'fast-recovery') {
        regions.push({
          id:      `r-${regions.length}`,
          fromRtt: start,
          toRtt:   t - 1,
          answer:  ph,
        })
      } else if (regions.length > 0) {
        // Merge into previous region
        regions[regions.length - 1].toRtt = t - 1
      }
      start = t
    }
  }
  return regions
}

/** Find scripted-loss events whose RTT > `after`. Useful for Predict mode. */
export function eventsAfter(events: SimEvent[], after: number): SimEvent[] {
  return events.filter((e) => e.rtt > after && e.kind !== 'ecn-mark')
}
