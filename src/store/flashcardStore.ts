// Zustand store for spaced-repetition flashcard state, persisted to localStorage

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CardReview } from '@/types'
import { sm2Next, isDue, sortByDue } from '@/utils/sm2'

interface FlashcardState {
  /** SM-2 review records keyed by card ID */
  reviews: Record<string, CardReview>

  /**
   * Records the result of a card review.
   *
   * @param cardId - The card that was reviewed
   * @param quality - SM-2 quality rating 0–5
   */
  recordReview: (cardId: string, quality: number) => void

  /**
   * Returns all card IDs that are due for review today,
   * optionally filtered to a set of tags.
   *
   * @param allCardIds - Full set of card IDs to consider
   * @param tags - If provided, only cards matching at least one tag are returned
   */
  getDueCardIds: (allCardIds: string[], tags?: string[]) => string[]

  /**
   * Returns the mastery ratio (0–1) for a given set of card IDs.
   * Mastery = fraction of cards that have been reviewed at least once
   * and have ef ≥ 2.0 (well-learned).
   *
   * @param cardIds - Set of card IDs to evaluate
   */
  getMastery: (cardIds: string[]) => number

  /** Resets all review history (used for testing / sandbox reset) */
  resetAll: () => void
}

export const useFlashcardStore = create<FlashcardState>()(
  persist(
    (set, get) => ({
      reviews: {},

      recordReview(cardId, quality) {
        const current = get().reviews[cardId]
        const next    = sm2Next(current, quality, cardId)
        set((s) => ({ reviews: { ...s.reviews, [cardId]: next } }))
      },

      getDueCardIds(allCardIds, _tags) {
        const { reviews } = get()
        const due = allCardIds.filter((id) => {
          const r = reviews[id]
          return !r || isDue(r)
        })
        const sorted = sortByDue(
          due.map((id) => reviews[id]).filter(Boolean) as CardReview[],
        )
        const sortedIds = new Set(sorted.map((r) => r.cardId))
        // New cards (no review record yet) go at the end
        return [
          ...sorted.map((r) => r.cardId),
          ...due.filter((id) => !sortedIds.has(id)),
        ]
      },

      getMastery(cardIds) {
        if (cardIds.length === 0) return 0
        const { reviews } = get()
        const learned = cardIds.filter((id) => {
          const r = reviews[id]
          return r && r.ef >= 2.0 && r.n >= 2
        })
        return learned.length / cardIds.length
      },

      resetAll() {
        set({ reviews: {} })
      },
    }),
    { name: 'netops-flashcards' },
  ),
)
