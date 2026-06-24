// RoutingGraph mechanic — dispatcher.
// Three modes for Module B: Dijkstra (B-L04), Count-to-infinity (B-L05),
// BGP Policy (B-L06). Each mode randomizes its scenario and ships 1-2 hints.

import type { Level } from '@/types'
import { DijkstraMode } from './modes/DijkstraMode'
import { CountToInfinityMode } from './modes/CountToInfinityMode'
import { BGPPolicyMode } from './modes/BGPPolicyMode'
import { TrafficEngineeringMode } from './modes/TrafficEngineeringMode'
import { FailureBossMode } from './modes/FailureBossMode'

interface Props {
  level:      Level
  onComplete: (passed: boolean, hintsUsed: number) => void
}

export function RoutingGraph({ level, onComplete }: Props) {
  switch (level.id) {
    case 'B-L04': return <DijkstraMode           level={level} onComplete={onComplete} />
    case 'B-L05': return <CountToInfinityMode    level={level} onComplete={onComplete} />
    case 'B-L06': return <BGPPolicyMode          level={level} onComplete={onComplete} />
    case 'C-L03': return <TrafficEngineeringMode level={level} onComplete={onComplete} />
    case 'C-L05': return <FailureBossMode        level={level} onComplete={onComplete} />
    default:
      return (
        <div className="noc-card p-6">
          <p className="text-noc-muted text-sm">
            No Routing Graph mode wired for level {level.id}.
          </p>
        </div>
      )
  }
}
