// Sandbox page — free-play mode: pick any mechanic, any difficulty, all unlocked from day 1

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MODULES } from '@/data'
import type { MechanicId } from '@/types'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { StarRating } from '@/components/ui/StarRating'
import { useCampaignStore } from '@/store'

const MECHANIC_LABELS: Record<MechanicId, string> = {
  addressSpace:    'Address Space',
  topologyCanvas:  'Topology Canvas',
  routingGraph:    'Routing Graph',
  matchAction:     'Match-Action Table',
  sdnSimulator:    'SDN Controller Lab',
  virtualizationLab: 'Virtualization Lab',
  codeBuilder:      'Code Builder IDE',
  routerInternals: 'Router Internals',
  congestionChart: 'Congestion Chart',
  p4Pipeline:      'P4 Pipeline',
}

/** Sandbox — all levels available, grouped by module, filterable by mechanic. */
export function Sandbox() {
  const navigate     = useNavigate()
  const getBestStars = useCampaignStore((s) => s.getBestStars)
  const isCompleted  = useCampaignStore((s) => s.isCompleted)
  const [filter, setFilter] = useState<MechanicId | 'all'>('all')

  const mechanicIds = Object.keys(MECHANIC_LABELS) as MechanicId[]

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-noc-bright text-xl font-bold">Sandbox</h1>
        <p className="text-noc-muted text-sm mt-1">
          Every mechanic, every difficulty — fully open from day one. Drill any skill on demand.
        </p>
      </div>

      {/* Mechanic filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`text-xs px-3 py-1.5 rounded border transition-colors ${
            filter === 'all'
              ? 'bg-link-packet/15 border-link-packet text-link-packet'
              : 'border-noc-border text-noc-muted hover:text-noc-text'
          }`}
        >
          All
        </button>
        {mechanicIds.map((id) => (
          <button
            key={id}
            onClick={() => setFilter(id)}
            className={`text-xs px-3 py-1.5 rounded border transition-colors ${
              filter === id
                ? 'bg-link-packet/15 border-link-packet text-link-packet'
                : 'border-noc-border text-noc-muted hover:text-noc-text'
            }`}
          >
            {MECHANIC_LABELS[id]}
          </button>
        ))}
      </div>

      {/* Module sections */}
      {MODULES.map((mod) => {
        const levels = filter === 'all'
          ? mod.levels
          : mod.levels.filter((l) => l.mechanic === filter)

        if (levels.length === 0) return null

        return (
          <div key={mod.id} className="flex flex-col gap-3">
            <h2 className="text-noc-text font-semibold text-sm">
              Module {mod.id} — {mod.title}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {levels.map((level) => {
                const stars = getBestStars(level.id)
                return (
                  <Card
                    key={level.id}
                    className="p-3 flex flex-col gap-2"
                    onClick={() => navigate(`/level/${level.id}`)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-noc-text text-sm font-medium leading-snug">{level.title}</p>
                      {level.isBoss && <Badge variant="down">Boss</Badge>}
                    </div>
                    <p className="text-noc-muted text-xs line-clamp-2">{level.intent}</p>
                    <div className="flex items-center justify-between mt-auto pt-1">
                      <Badge variant="idle">{MECHANIC_LABELS[level.mechanic]}</Badge>
                      {level.mechanic === 'sdnSimulator'
                        ? <Badge variant={isCompleted(level.id) ? 'up' : 'idle'}>{isCompleted(level.id) ? 'Completed' : 'NovaNet XP'}</Badge>
                        : <StarRating stars={stars} size="sm" />}
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
