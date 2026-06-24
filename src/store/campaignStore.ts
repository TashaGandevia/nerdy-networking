// Zustand store for campaign progress — level stars, act unlocks, persisted to localStorage

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { LevelProgress, StarCount } from '@/types'

interface CampaignState {
  /** Level progress records keyed by level ID */
  levels: Record<string, LevelProgress>

  /**
   * Records the result of a completed level attempt.
   * Only updates stars if the new result is better than the previous best.
   *
   * @param levelId - The level that was played
   * @param stars - Star count earned (1–3)
   * @param hintsUsed - Number of hints used this attempt
   */
  completeLevel: (levelId: string, stars: StarCount, hintsUsed: number) => void

  /**
   * Increments the attempt counter for a level without recording a star result.
   * Called when a player abandons or fails a level.
   *
   * @param levelId - The level being attempted
   */
  recordAttempt: (levelId: string) => void

  /**
   * Returns the best star count for a level, or null if never completed.
   *
   * @param levelId - Level ID to query
   */
  getBestStars: (levelId: string) => StarCount | null

  /**
   * Returns true if a level has been completed at least once.
   *
   * @param levelId - Level ID to query
   */
  isCompleted: (levelId: string) => boolean

  /** Resets all campaign progress */
  resetAll: () => void
}

export const useCampaignStore = create<CampaignState>()(
  persist(
    (set, get) => ({
      levels: {},

      completeLevel(levelId, stars, hintsUsed) {
        const existing = get().levels[levelId]
        const bestStars = existing?.stars ?? 0
        set((s) => ({
          levels: {
            ...s.levels,
            [levelId]: {
              levelId,
              completed:    true,
              stars:        (Math.max(bestStars, stars) as StarCount),
              hintsUsed:    Math.min(existing?.hintsUsed ?? hintsUsed, hintsUsed),
              attemptCount: (existing?.attemptCount ?? 0) + 1,
            },
          },
        }))
      },

      recordAttempt(levelId) {
        const existing = get().levels[levelId]
        set((s) => ({
          levels: {
            ...s.levels,
            [levelId]: {
              levelId,
              completed:    existing?.completed ?? false,
              stars:        existing?.stars ?? null,
              hintsUsed:    existing?.hintsUsed ?? 0,
              attemptCount: (existing?.attemptCount ?? 0) + 1,
            },
          },
        }))
      },

      getBestStars(levelId) {
        return get().levels[levelId]?.stars ?? null
      },

      isCompleted(levelId) {
        return get().levels[levelId]?.completed ?? false
      },

      resetAll() {
        set({ levels: {} })
      },
    }),
    { name: 'netops-campaign' },
  ),
)
