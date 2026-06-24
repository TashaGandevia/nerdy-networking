// AddressSpace mechanic — interactive subnet carving for Network Layer levels.
// Player adds subnets sized to host counts or required prefixes; we auto-place
// them via best-fit allocation within the parent block and validate VLSM rules.
// Scenarios are randomized; randomization key derives the level variant.

import { useEffect, useMemo, useState } from 'react'
import type { Level } from '@/types'
import { Button } from '@/components/ui/Button'
import { Badge }  from '@/components/ui/Badge'
import {
  parseCIDR, ipToInt, intToIp, broadcastAddress, usableHosts,
} from '@/utils/subnet'

interface Props {
  level:      Level
  onComplete: (passed: boolean, hintsUsed: number) => void
}

// ── Allocation primitives ───────────────────────────────────────────────────

interface Allocation {
  id:        string
  label:     string
  prefix:    number      // chosen by player
  hostsNeed: number      // requirement that drove the prefix (for display only)
  network:   number      // 32-bit, auto-assigned
}

interface FixedAlloc {
  label:   string
  prefix:  number
  network: number
}

/** Smallest power-of-two prefix that fits `hosts` usable addresses. */
function prefixForHosts(hosts: number): number {
  for (let p = 30; p >= 1; p--) {
    if (usableHosts(p) >= hosts) return p
  }
  return 1
}

function size(prefix: number) { return 2 ** (32 - prefix) }

/** Greedy best-fit: place the largest allocations first into the lowest aligned hole. */
function placeAll(
  parentStart: number, parentEnd: number, reserved: FixedAlloc[], queued: { id: string; prefix: number }[],
): { placements: Record<string, number>; success: boolean } {
  // Build sorted free-list from reserved blocks.
  const blocks = [...reserved].sort((a, b) => a.network - b.network)
  let free: { start: number; end: number }[] = []   // end is exclusive
  let cursor = parentStart
  for (const b of blocks) {
    if (b.network > cursor) free.push({ start: cursor, end: b.network })
    cursor = b.network + size(b.prefix)
  }
  if (cursor < parentEnd) free.push({ start: cursor, end: parentEnd })

  // Sort player allocations: largest first.
  const order = [...queued].sort((a, b) => a.prefix - b.prefix)
  const placements: Record<string, number> = {}

  for (const q of order) {
    const sz = size(q.prefix)
    let placed = false
    for (let i = 0; i < free.length; i++) {
      const fb = free[i]
      // Find the lowest aligned address in [fb.start, fb.end - sz]
      const aligned = Math.ceil(fb.start / sz) * sz
      if (aligned + sz <= fb.end) {
        placements[q.id] = aligned
        // Split free block
        const before = aligned > fb.start ? { start: fb.start, end: aligned } : null
        const after  = aligned + sz < fb.end ? { start: aligned + sz, end: fb.end } : null
        free.splice(i, 1, ...(before ? [before] : []), ...(after ? [after] : []))
        placed = true
        break
      }
    }
    if (!placed) return { placements, success: false }
  }
  return { placements, success: true }
}

// ── Scenario generation ─────────────────────────────────────────────────────

interface Scenario {
  kind:         'equal' | 'vlsm' | 'resubnet'
  parent:       string                 // CIDR
  parentStart:  number                 // 32-bit
  parentEnd:    number                 // exclusive
  // Equal mode
  requiredSubnets?: number
  // VLSM mode (department host counts)
  requirements?: { id: string; label: string; hosts: number }[]
  // Resubnet mode adds a fixed pre-allocation
  reserved?:    FixedAlloc[]
  maxWastePct?: number
}

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function makeEqualScenario(): Scenario {
  // /22 or /23 parent → carve into N equal subnets where N ∈ {2,4,8,16}
  const parentPrefix = rand(22, 24)
  const n            = [2, 4, 8][rand(0, 2)]
  const o2 = rand(0, 255), o3 = rand(0, 255)
  const parent = `10.${o2}.${o3 & ~((1 << (32 - parentPrefix - 8)) - 1)}.0/${parentPrefix}`
  const block = parseCIDR(parent)!
  return {
    kind: 'equal',
    parent,
    parentStart: ipToInt(block.network),
    parentEnd:   ipToInt(block.network) + size(block.prefix),
    requiredSubnets: n,
  }
}

const DEPT_NAMES = [
  'Sales', 'Eng', 'HR', 'IT', 'Ops', 'Mktg', 'Legal', 'Support',
  'Finance', 'R&D', 'QA', 'DevOps', 'Design', 'Lab',
]

function makeVlsmScenario(): Scenario {
  // /23 or /22 parent, 3-4 departments with varied host counts.
  const parentPrefix = rand(22, 23)
  const n            = rand(3, 4)
  const usedNames    = new Set<string>()
  const requirements = Array.from({ length: n }, (_, i) => {
    let name = DEPT_NAMES[rand(0, DEPT_NAMES.length - 1)]
    while (usedNames.has(name)) name = DEPT_NAMES[rand(0, DEPT_NAMES.length - 1)]
    usedNames.add(name)
    // Pick a host count from a realistic distribution.
    const hosts = [10, 20, 30, 50, 80, 100, 150, 200, 300][rand(0, 8)]
    return { id: `r-${i}`, label: name, hosts }
  })
  const o3 = rand(0, 255) & ~((1 << (32 - parentPrefix - 8)) - 1)
  const parent = `172.${16 + rand(0, 15)}.${o3}.0/${parentPrefix}`
  const block  = parseCIDR(parent)!
  return {
    kind: 'vlsm',
    parent,
    parentStart: ipToInt(block.network),
    parentEnd:   ipToInt(block.network) + size(block.prefix),
    requirements,
  }
}

function makeResubnetScenario(): Scenario {
  // /24 parent with two existing /26 allocations.
  const o2 = rand(0, 255), o3 = rand(0, 255)
  const parent = `10.${o2}.${o3}.0/24`
  const block  = parseCIDR(parent)!
  const start  = ipToInt(block.network)
  const reserved: FixedAlloc[] = [
    { label: 'Existing-A', prefix: 26, network: start },
    { label: 'Existing-B', prefix: 26, network: start + 64 },
  ]
  const addHosts = [30, 40, 50, 60][rand(0, 3)]
  return {
    kind: 'resubnet',
    parent,
    parentStart: start,
    parentEnd:   start + 256,
    reserved,
    requirements: [{ id: 'new', label: `New dept (${addHosts} hosts)`, hosts: addHosts }],
    maxWastePct: 10,
  }
}

function makeScenario(levelId: string): Scenario {
  if (levelId === 'B-L01') return makeEqualScenario()
  if (levelId === 'B-L07') return makeResubnetScenario()
  return makeVlsmScenario()    // B-L02 (default)
}

// ── Component ───────────────────────────────────────────────────────────────

const HINTS: Record<string, string[]> = {
  'B-L01': [
    'Splitting a parent block into N equal subnets adds log₂(N) bits to the prefix.',
    'Each subnet needs its own network + broadcast — those count against your host budget.',
  ],
  'B-L02': [
    'Pick a prefix per department that leaves enough usable hosts: usable = 2^(32−prefix) − 2.',
    'Place the largest department first; smaller ones can squeeze into the gaps.',
  ],
  'B-L07': [
    'The two existing /26 blocks already cover the first half — you have to fit in what is left.',
    'The biggest single block you can carve out of the remaining /25 is one /25 — no bigger.',
  ],
}

export function AddressSpace({ level, onComplete }: Props) {
  const [scenarioKey, setScenarioKey] = useState(0)
  const scenario = useMemo(() => makeScenario(level.id), [level.id, scenarioKey])

  const initialQueue: Allocation[] = useMemo(() => {
    if (scenario.kind === 'equal') {
      const n      = scenario.requiredSubnets!
      const newPfx = parseCIDR(scenario.parent)!.prefix + Math.log2(n)
      return Array.from({ length: n }, (_, i) => ({
        id: `s-${i}`, label: `Subnet ${i + 1}`,
        prefix:    newPfx,
        hostsNeed: usableHosts(newPfx),
        network:   -1,
      }))
    }
    return (scenario.requirements ?? []).map((r) => ({
      id: r.id, label: r.label,
      prefix:    prefixForHosts(r.hosts),
      hostsNeed: r.hosts,
      network:   -1,
    }))
  }, [scenario])

  const [allocations, setAllocations] = useState<Allocation[]>(initialQueue)
  useEffect(() => { setAllocations(initialQueue) }, [initialQueue])

  const [hintIdx, setHintIdx] = useState(0)

  function reset() {
    setScenarioKey((k) => k + 1)
    setHintIdx(0)
  }

  // Compute placements
  const placement = useMemo(() => placeAll(
    scenario.parentStart,
    scenario.parentEnd,
    scenario.reserved ?? [],
    allocations.map((a) => ({ id: a.id, prefix: a.prefix })),
  ), [scenario, allocations])

  const placedAllocs = allocations.map((a) => ({ ...a, network: placement.placements[a.id] ?? -1 }))

  // Validation
  const totalUsed = placedAllocs.reduce((s, a) => s + size(a.prefix), 0)
              + (scenario.reserved ?? []).reduce((s, r) => s + size(r.prefix), 0)
  const wastePct  = ((scenario.parentEnd - scenario.parentStart) - totalUsed)
                  / (scenario.parentEnd - scenario.parentStart) * 100

  let validationMessage: string | null = null
  let passed = false
  if (!placement.success) {
    validationMessage = 'Allocations do not fit inside the parent block.'
  } else {
    const undersized = placedAllocs.filter((a) => usableHosts(a.prefix) < a.hostsNeed)
    if (undersized.length > 0) {
      validationMessage = `Too small: ${undersized.map((a) => a.label).join(', ')} need more hosts.`
    } else if (scenario.maxWastePct !== undefined && wastePct > scenario.maxWastePct) {
      validationMessage = `Waste ${wastePct.toFixed(1)}% > target ${scenario.maxWastePct}%.`
    } else if (scenario.kind === 'equal') {
      // Equal mode: every allocation must share the same prefix.
      const prefixes = new Set(placedAllocs.map((a) => a.prefix))
      if (prefixes.size > 1) {
        validationMessage = 'All subnets in equal mode must share the same prefix.'
      } else {
        passed = true
      }
    } else {
      passed = true
    }
  }

  function changePrefix(id: string, delta: number) {
    setAllocations((prev) => prev.map((a) =>
      a.id === id ? { ...a, prefix: Math.max(1, Math.min(30, a.prefix + delta)) } : a,
    ))
  }

  // ── Render ───────────────────────────────────────────────────────────────

  const total      = scenario.parentEnd - scenario.parentStart
  const showHints  = HINTS[level.id] ?? []

  return (
    <div className="noc-card p-6 flex flex-col gap-4">
      <p className="text-noc-muted text-xs uppercase tracking-widest">Address Space</p>
      <h2 className="text-noc-bright text-lg font-semibold">{level.title}</h2>
      <p className="text-noc-text text-sm">{level.intent}</p>

      {/* Parent header */}
      <div className="bg-noc-bg border border-noc-border rounded p-3 font-mono text-sm flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <span className="text-noc-muted text-xs">Parent</span>
        <span className="text-link-packet">{scenario.parent}</span>
        <span className="text-noc-muted text-xs">{total.toLocaleString()} addresses</span>
        {scenario.maxWastePct !== undefined && (
          <span className="text-noc-muted text-xs">target waste ≤ {scenario.maxWastePct}%</span>
        )}
      </div>

      {/* Address bar */}
      <AddressBar
        parentStart={scenario.parentStart}
        parentEnd={scenario.parentEnd}
        reserved={scenario.reserved ?? []}
        allocations={placedAllocs}
      />

      {/* Allocation editor */}
      <div className="flex flex-col gap-2">
        {(scenario.reserved ?? []).map((r, i) => (
          <Row
            key={`fixed-${i}`}
            label={r.label}
            prefix={r.prefix}
            network={r.network}
            locked
          />
        ))}
        {placedAllocs.map((a) => (
          <Row
            key={a.id}
            label={a.label}
            prefix={a.prefix}
            network={a.network}
            hostsNeed={a.hostsNeed}
            onDec={() => changePrefix(a.id, -1)}
            onInc={() => changePrefix(a.id, +1)}
            error={!placement.success || usableHosts(a.prefix) < a.hostsNeed}
          />
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono">
        <Stat label="Allocated"  value={`${totalUsed.toLocaleString()} / ${total.toLocaleString()}`} />
        <Stat label="Waste"      value={`${wastePct.toFixed(1)}%`}
              good={scenario.maxWastePct === undefined || wastePct <= scenario.maxWastePct} />
        <Stat label="Subnets"    value={`${placedAllocs.length + (scenario.reserved?.length ?? 0)}`} />
      </div>

      {validationMessage && !passed && (
        <p className="text-link-down text-sm">{validationMessage}</p>
      )}
      {passed && (
        <p className="text-link-up text-sm font-medium">✓ Plan valid — hit Finish level when ready.</p>
      )}

      {/* Hints */}
      {hintIdx > 0 && (
        <div className="border border-noc-border rounded px-3 py-2 flex flex-col gap-1">
          {showHints.slice(0, hintIdx).map((h, i) => (
            <p key={i} className="text-noc-muted text-xs">💡 {h}</p>
          ))}
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        <Button size="sm" disabled={!passed} onClick={() => onComplete(true, hintIdx)}>
          Finish level
        </Button>
        {hintIdx < showHints.length && (
          <Button size="sm" variant="ghost" onClick={() => setHintIdx((n) => n + 1)}>
            Hint ({hintIdx + 1}/{showHints.length})
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={reset}>New scenario</Button>
      </div>
    </div>
  )
}

// ── Row + Bar + Stat presentational components ─────────────────────────────

function Row({ label, prefix, network, hostsNeed, locked, error, onDec, onInc }: {
  label:      string
  prefix:     number
  network:    number
  hostsNeed?: number
  locked?:    boolean
  error?:     boolean
  onDec?:     () => void
  onInc?:     () => void
}) {
  const ok      = network >= 0
  const netStr  = ok ? intToIp(network) : '—'
  const bcast   = ok ? broadcastAddress(intToIp(network), prefix) : '—'
  const usable  = usableHosts(prefix)
  return (
    <div className={`border rounded px-3 py-2 grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-2 items-center ${
      error ? 'border-link-down' : 'border-noc-border'
    }`}>
      <div className="flex flex-col">
        <span className="text-noc-bright text-sm font-medium">{label}</span>
        <span className="text-noc-muted text-xs font-mono">
          {netStr}/{prefix} · bcast {bcast} · usable {usable.toLocaleString()}{hostsNeed !== undefined ? ` (need ${hostsNeed})` : ''}
        </span>
      </div>
      {!locked && (
        <div className="flex gap-1 items-center">
          <span className="text-noc-muted text-xs font-mono">prefix</span>
          <Button size="sm" variant="ghost" onClick={onDec}>−</Button>
          <span className="text-noc-bright text-xs font-mono w-6 text-center">/{prefix}</span>
          <Button size="sm" variant="ghost" onClick={onInc}>+</Button>
        </div>
      )}
      {locked && (
        <Badge variant="idle">/{prefix}</Badge>
      )}
      <Badge variant={error ? 'down' : 'idle'}>{ok ? 'placed' : 'no fit'}</Badge>
    </div>
  )
}

function Stat({ label, value, good }: { label: string; value: string; good?: boolean }) {
  return (
    <div className={`border rounded px-3 py-2 ${good ? 'border-link-up' : 'border-noc-border'}`}>
      <p className="text-noc-muted">{label}</p>
      <p className={`text-base ${good ? 'text-link-up' : 'text-noc-bright'}`}>{value}</p>
    </div>
  )
}

function AddressBar({ parentStart, parentEnd, reserved, allocations }: {
  parentStart: number
  parentEnd:   number
  reserved:    FixedAlloc[]
  allocations: Allocation[]
}) {
  const W = 640, H = 38
  const span = parentEnd - parentStart
  function toX(addr: number) { return ((addr - parentStart) / span) * W }
  const palette = ['#58a6ff', '#3fb950', '#d29922', '#bc8cff', '#f78166']

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full border border-noc-border rounded bg-noc-bg" aria-label="Address bar">
      <rect x={0} y={6} width={W} height={H - 12} fill="#161b22" />
      {/* Reserved blocks (hatched) */}
      {reserved.map((r, i) => {
        const x = toX(r.network), w = (size(r.prefix) / span) * W
        return (
          <g key={`r-${i}`}>
            <rect x={x} y={6} width={w} height={H - 12} fill="#30363d" />
            <text x={x + w / 2} y={H / 2 + 3} textAnchor="middle" fill="#c9d1d9" fontSize={9} fontFamily="monospace">
              {r.label} /{r.prefix}
            </text>
          </g>
        )
      })}
      {/* Player allocations */}
      {allocations.filter((a) => a.network >= 0).map((a, i) => {
        const x = toX(a.network), w = (size(a.prefix) / span) * W
        const c = palette[i % palette.length]
        return (
          <g key={a.id}>
            <rect x={x} y={6} width={w} height={H - 12} fill={c + '55'} stroke={c} />
            <text x={x + w / 2} y={H / 2 + 3} textAnchor="middle" fill={c} fontSize={9} fontFamily="monospace">
              {a.label} /{a.prefix}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
