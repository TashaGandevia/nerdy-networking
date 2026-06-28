// Level page — looks up the level by ID, renders the correct mechanic, handles completion

import { useParams, useNavigate } from 'react-router-dom'
import { ALL_LEVELS } from '@/data'
import { useCampaignStore } from '@/store'
import { MECHANIC_REGISTRY } from '@/mechanics'
import type { StarCount } from '@/types'
import { Button } from '@/components/ui/Button'
import { StarRating } from '@/components/ui/StarRating'
import { Badge } from '@/components/ui/Badge'
import { useEffect, useState } from 'react'

type CompletionState = { passed: boolean; stars: StarCount; hintsUsed: number } | null

/**
 * Level page — resolves level ID from URL params, mounts the appropriate mechanic
 * component, and handles the completion/star-award flow.
 */
export function Level() {
  const { levelId } = useParams<{ levelId: string }>()
  const navigate    = useNavigate()
  const [completion, setCompletion] = useState<CompletionState>(null)

  useEffect(() => {
    setCompletion(null)
  }, [levelId])

  const getBestStars  = useCampaignStore((s) => s.getBestStars)
  const completeLevel = useCampaignStore((s) => s.completeLevel)
  const recordAttempt = useCampaignStore((s) => s.recordAttempt)

  const level = ALL_LEVELS.find((l) => l.id === levelId)

  if (!level) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-noc-muted">Level not found: {levelId}</p>
        <Button variant="ghost" onClick={() => navigate(-1)}>Go back</Button>
      </div>
    )
  }

  // Capture narrowed level so closures below have a guaranteed non-undefined reference
  const safeLevel         = level
  const MechanicComponent = MECHANIC_REGISTRY[safeLevel.mechanic]
  const bestStars         = getBestStars(safeLevel.id)

  /**
   * Called by the mechanic when the player submits a solution.
   * Computes stars from correctness / efficiency / independence, records progress.
   *
   * @param passed     - Whether the solution met the win condition
   * @param hintsUsed  - Number of hints the player consumed
   */
  function handleComplete(passed: boolean, hintsUsed: number) {
    // The SDN GDD rewards 5 / 3 / 2 stars; existing mechanics retain their 3-star scale.
    const starCount: StarCount = passed
      ? safeLevel.mechanic === 'sdnSimulator'
        ? hintsUsed === 0 ? 5 : hintsUsed === 1 ? 3 : 2
        : hintsUsed === 0 ? 3 : hintsUsed <= 1 ? 2 : 1
      : 1

    if (passed) {
      completeLevel(safeLevel.id, starCount, hintsUsed)
    } else {
      recordAttempt(safeLevel.id)
    }

    setCompletion({ passed, stars: starCount, hintsUsed })
  }

  if (completion) {
    return (
      <div className="max-w-lg mx-auto flex flex-col items-center gap-6 pt-12">
        <p className={`text-2xl font-bold ${completion.passed ? 'text-link-up' : 'text-link-down'}`}>
          {completion.passed ? 'Level complete!' : 'Not quite — try again?'}
        </p>

        {completion.passed && safeLevel.mechanic === 'sdnSimulator' ? (
          <div className="rounded-lg border border-module-c/40 bg-module-c/10 px-5 py-3 text-center">
            <p className="text-sm font-semibold text-module-c">NovaNet promotion progress updated</p>
            <p className="mt-1 text-xs text-noc-muted">XP earned · New simulator content unlocked</p>
          </div>
        ) : completion.passed ? <StarRating stars={completion.stars} size="lg" /> : null}

        {bestStars !== null && bestStars < completion.stars && (
          <Badge variant="up">New best!</Badge>
        )}

        <p className="text-noc-muted text-sm text-center">{safeLevel.winCondition}</p>

        <div className="flex gap-3 flex-wrap justify-center">
          <Button onClick={() => setCompletion(null)}>
            {completion.passed && safeLevel.mechanic !== 'sdnSimulator' && completion.stars < 3
              ? 'Try for 3 stars'
              : 'Play again'}
          </Button>
          <Button variant="secondary" onClick={() => navigate(-1)}>
            Back
          </Button>
        </div>
      </div>
    )
  }

  const isSdnLab = safeLevel.mechanic === 'sdnSimulator' || Boolean(safeLevel.setup.questionTopic)

  return (
    <div className={`${isSdnLab ? 'max-w-7xl' : 'max-w-3xl'} mx-auto flex flex-col gap-4`}>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <button
          className="text-noc-muted text-sm hover:text-noc-text transition-colors"
          onClick={() => navigate(-1)}
        >
          ← Back
        </button>
        <span className="text-noc-border">·</span>
        <span className="text-noc-muted text-sm font-mono">{safeLevel.id}</span>
        {safeLevel.isBoss && <Badge variant="down">Boss</Badge>}
      </div>

      {/* Mechanic */}
      <MechanicComponent level={safeLevel} onComplete={handleComplete} />
    </div>
  )
}
