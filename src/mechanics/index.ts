// Mechanic component registry — maps MechanicId to its React component
// Import from here so Level.tsx doesn't need to know each mechanic's path.

import type { ComponentType } from 'react'
import type { Level } from '@/types'
import type { MechanicId } from '@/types'

import { AddressSpace }    from './AddressSpace/AddressSpace'
import { TopologyCanvas }  from './TopologyCanvas/TopologyCanvas'
import { RoutingGraph }    from './RoutingGraph/RoutingGraph'
import { MatchAction }     from './MatchAction/MatchAction'
import { RouterInternals } from './RouterInternals/RouterInternals'
import { CongestionChart } from './CongestionChart/CongestionChart'
import { P4Pipeline }      from './P4Pipeline/P4Pipeline'

export interface MechanicProps {
  level:      Level
  onComplete: (passed: boolean, hintsUsed: number) => void
}

export const MECHANIC_REGISTRY: Record<MechanicId, ComponentType<MechanicProps>> = {
  addressSpace:    AddressSpace,
  topologyCanvas:  TopologyCanvas,
  routingGraph:    RoutingGraph,
  matchAction:     MatchAction,
  routerInternals: RouterInternals,
  congestionChart: CongestionChart,
  p4Pipeline:      P4Pipeline,
}
