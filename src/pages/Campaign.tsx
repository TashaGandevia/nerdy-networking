// Campaign page — 9-act guided path with mastery-gated soft unlocks and level cards

import { useNavigate } from 'react-router-dom'
import { CAMPAIGN_ACTS, MODULES } from '@/data'
import { useFlashcardStore, useCampaignStore } from '@/store'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { StarRating } from '@/components/ui/StarRating'
import { MasteryMeter } from '@/components/ui/MasteryMeter'

const MODULE_RING: Record<string, string> = {
  A: 'text-module-a', B: 'text-module-b',
  C: 'text-module-c', D: 'text-module-d', E: 'text-module-e',
}

/** Campaign overview — lists all acts and their levels with progress indicators. */
export function Campaign() {
  const navigate    = useNavigate()
  const getMastery  = useFlashcardStore((s) => s.getMastery)
  const getBestStars = useCampaignStore((s) => s.getBestStars)

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-8">
      <div>
        <h1 className="text-noc-bright text-xl font-bold">Campaign</h1>
        <p className="text-noc-muted text-sm mt-1">
          Stand up a network, then make it modern. Acts unlock as module mastery grows.
        </p>
      </div>

      {CAMPAIGN_ACTS.map((act) => {
        // Compute mastery across all modules for this act
        const actCardIds = act.moduleIds.flatMap((mid) => {
          const mod = MODULES.find((m) => m.id === mid)
          return mod?.flashcards.map((c) => c.id) ?? []
        })
        const mastery   = getMastery(actCardIds)
        const unlocked  = mastery >= act.unlockThreshold
        const ringClass = MODULE_RING[act.moduleIds[0]] ?? 'text-link-packet'

        return (
          <div key={act.id} className="flex flex-col gap-3">
            {/* Act header */}
            <div className="flex items-center gap-3">
              <MasteryMeter value={mastery} size={40} colorClass={ringClass} showLabel={false} />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-noc-muted text-xs font-mono">Act {act.number}</span>
                  {!unlocked && act.unlockThreshold > 0 && (
                    <Badge variant="idle">
                      Needs {Math.round(act.unlockThreshold * 100)}% mastery
                    </Badge>
                  )}
                  {unlocked && <Badge variant="up">Unlocked</Badge>}
                </div>
                <h2 className="text-noc-bright font-semibold">{act.title}</h2>
                <p className="text-noc-muted text-xs">{act.description}</p>
              </div>
            </div>

            {/* Level cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-1">
              {act.levels.map((level) => {
                const stars = getBestStars(level.id)
                return (
                  <Card
                    key={level.id}
                    className="p-3 flex items-start gap-3"
                    onClick={() => navigate(`/level/${level.id}`)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-noc-text text-sm font-medium truncate">{level.title}</p>
                        {level.isBoss && <Badge variant="down">Boss</Badge>}
                      </div>
                      <p className="text-noc-muted text-xs mt-0.5 line-clamp-2">{level.intent}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <StarRating stars={stars} size="sm" />
                      <span className="text-noc-muted text-xs">
                        {'●'.repeat(level.difficulty)}{'○'.repeat(5 - level.difficulty)}
                      </span>
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
