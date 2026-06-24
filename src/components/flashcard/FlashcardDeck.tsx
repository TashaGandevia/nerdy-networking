// Flashcard deck session — cycles through due cards, tracks session progress

import { useState, useMemo } from 'react'
import type { Flashcard } from '@/types'
import { FlashcardCard } from './FlashcardCard'
import { useFlashcardStore } from '@/store'
import { Button } from '@/components/ui/Button'

interface FlashcardDeckProps {
  /** Cards available in this session (already filtered/ordered by caller) */
  cards: Flashcard[]
  /** Called when the session is complete */
  onComplete?: (reviewed: number) => void
}

/**
 * Manages a review session over a pre-filtered set of flashcards.
 * Cycles through cards, records SM-2 results, and shows a completion screen.
 *
 * @param cards      - Ordered list of cards to review
 * @param onComplete - Callback with the number of cards reviewed
 */
export function FlashcardDeck({ cards, onComplete }: FlashcardDeckProps) {
  const [index,    setIndex]    = useState(0)
  const [reviewed, setReviewed] = useState(0)
  const recordReview = useFlashcardStore((s) => s.recordReview)

  const current = useMemo(() => cards[index], [cards, index])

  function handleRate(quality: number) {
    recordReview(current.id, quality)
    const next = reviewed + 1
    setReviewed(next)

    if (index + 1 < cards.length) {
      setIndex(index + 1)
    } else {
      onComplete?.(next)
    }
  }

  if (cards.length === 0) {
    return (
      <div className="text-center text-noc-muted py-12">
        <p className="text-lg">No cards due right now.</p>
        <p className="text-sm mt-1">Check back later or explore the sandbox.</p>
      </div>
    )
  }

  if (index >= cards.length) {
    return (
      <div className="text-center py-12 flex flex-col items-center gap-4">
        <p className="text-link-up text-xl font-semibold">Session complete!</p>
        <p className="text-noc-muted">Reviewed {reviewed} cards.</p>
        <Button variant="secondary" onClick={() => { setIndex(0); setReviewed(0) }}>
          Review again
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      {/* Progress bar */}
      <div className="w-full max-w-2xl">
        <div className="flex justify-between text-xs text-noc-muted mb-1">
          <span>{index + 1} / {cards.length}</span>
          <span>{reviewed} reviewed</span>
        </div>
        <div className="h-1 bg-noc-border rounded-full overflow-hidden">
          <div
            className="h-full bg-link-packet rounded-full transition-all duration-300"
            style={{ width: `${((index) / cards.length) * 100}%` }}
          />
        </div>
      </div>

      <FlashcardCard card={current} onRate={handleRate} />
    </div>
  )
}
