// Content module registry and campaign act sequence
// To add a new deck: import its module here and add it to MODULES and CAMPAIGN_ACTS

import type { ContentModule } from '@/types'
import type { Act } from '@/types'
import { moduleA } from './modules/moduleA'
import { moduleB } from './modules/moduleB'
import { moduleC } from './modules/moduleC'
import { moduleD } from './modules/moduleD'
import { moduleE } from './modules/moduleE'
import { moduleF } from './modules/moduleF'

/** All content modules in display order */
export const MODULES: ContentModule[] = [moduleA, moduleB, moduleC, moduleD, moduleE, moduleF]

/** Lookup by module ID */
export const MODULE_BY_ID: Record<string, ContentModule> = Object.fromEntries(
  MODULES.map((m) => [m.id, m]),
)

/**
 * Campaign act sequence — "Stand up a network, then make it modern."
 * Order is data; re-sequences automatically as modules are added.
 * unlockThreshold: fraction of prerequisite module mastery needed to highlight this act.
 */
export const CAMPAIGN_ACTS: Act[] = [
  {
    id: 'act-1', number: 1,
    title:       'Congestion Control',
    description: 'Watch the sawtooth draw live. Maximize goodput without collapse.',
    moduleIds:   ['A'],
    levels:      moduleA.levels,
    unlockThreshold: 0,
  },
  {
    id: 'act-2', number: 2,
    title:       'Addressing',
    description: 'Rent your first address block and carve it for the team.',
    moduleIds:   ['B'],
    levels:      moduleB.levels.filter((l) => l.mechanic === 'addressSpace'),
    unlockThreshold: 0.3,
  },
  {
    id: 'act-3', number: 3,
    title:       'Topology',
    description: 'Wire up routers, assign gateways, prove reachability.',
    moduleIds:   ['B'],
    levels:      moduleB.levels.filter((l) => l.mechanic === 'topologyCanvas'),
    unlockThreshold: 0.4,
  },
  {
    id: 'act-4', number: 4,
    title:       'Intra-AS Routing',
    description: 'Run Dijkstra and Bellman-Ford; handle link failures and count-to-infinity.',
    moduleIds:   ['B'],
    levels:      moduleB.levels.filter((l) => l.mechanic === 'routingGraph' && !l.id.includes('BGP') && l.id < 'B-L06'),
    unlockThreshold: 0.5,
  },
  {
    id: 'act-5', number: 5,
    title:       'Inter-AS Routing (BGP)',
    description: 'Configure BGP export policies so traffic follows business relationships.',
    moduleIds:   ['B'],
    levels:      moduleB.levels.filter((l) => l.id === 'B-L06'),
    unlockThreshold: 0.5,
  },
  {
    id: 'act-6', number: 6,
    title:       'Inside the Router',
    description: 'Scheduling, switching fabric, HOL blocking, and VOQ.',
    moduleIds:   ['B'],
    levels:      moduleB.levels.filter((l) => l.mechanic === 'routerInternals'),
    unlockThreshold: 0.5,
  },
  {
    id: 'act-7', number: 7,
    title:       'SDN',
    description: 'Become the controller. Separate planes, install flow rules, engineer traffic.',
    moduleIds:   ['C'],
    levels:      moduleC.levels,
    unlockThreshold: 0.6,
  },
  {
    id: 'act-8', number: 8,
    title:       'Virtualize',
    description: 'VLANs, tunnels, and multi-tenant isolation on shared infrastructure.',
    moduleIds:   ['D'],
    levels:      moduleD.levels,
    unlockThreshold: 0.6,
  },
  {
    id: 'act-9', number: 9,
    title:       'Program the Dataplane',
    description: 'Build a P4 pipeline from parser to deparser. Tag INT, forward, verify.',
    moduleIds:   ['E'],
    levels:      moduleE.levels,
    unlockThreshold: 0.7,
  },
]

/** All flashcards across all modules — used for exam prep and global search */
export const ALL_FLASHCARDS = MODULES.flatMap((m) => m.flashcards)

/** All levels across all modules — used for sandbox free-play lookup */
export const ALL_LEVELS = MODULES.flatMap((m) => m.levels)
