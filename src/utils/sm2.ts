// SM-2 spaced repetition algorithm implementation
// https://www.supermemo.com/en/archives1990-2015/english/ol/sm2

import type { CardReview } from '@/types'

/**
 * Computes the next review schedule for a card using SM-2.
 *
 * @param review - Current review record (or undefined for a brand-new card)
 * @param quality - Answer quality 0–5 (0–2 = fail, 3–5 = pass; 5 = perfect)
 * @returns Updated CardReview with new ef, interval, n, and dueDate
 */
export function sm2Next(
  review: CardReview | undefined,
  quality: number,
  cardId: string,
): CardReview {
  const ef       = review?.ef       ?? 2.5
  const n        = review?.n        ?? 0
  const interval = review?.interval ?? 0

  let nextEf       = ef
  let nextN        = n
  let nextInterval = interval

  if (quality >= 3) {
    // Correct response — advance repetition
    if (n === 0)      nextInterval = 1
    else if (n === 1) nextInterval = 6
    else              nextInterval = Math.round(interval * ef)

    nextN  = n + 1
    nextEf = ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    nextEf = Math.max(1.3, nextEf)
  } else {
    // Incorrect — reset repetitions, keep interval at 1 day
    nextN        = 0
    nextInterval = 1
    nextEf       = ef // EF unchanged on failure
  }

  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + nextInterval)

  return {
    cardId,
    ef:          nextEf,
    n:           nextN,
    interval:    nextInterval,
    dueDate:     dueDate.toISOString(),
    lastQuality: quality,
  }
}

/**
 * Returns true if a card is due for review today.
 *
 * @param review - The card's review record
 */
export function isDue(review: CardReview): boolean {
  return new Date(review.dueDate) <= new Date()
}

/**
 * Sorts cards into due-first order, then by ascending dueDate.
 *
 * @param reviews - Array of card review records
 */
export function sortByDue(reviews: CardReview[]): CardReview[] {
  const now = new Date()
  return [...reviews].sort((a, b) => {
    const aDue = new Date(a.dueDate) <= now
    const bDue = new Date(b.dueDate) <= now
    if (aDue && !bDue) return -1
    if (!aDue && bDue) return 1
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  })
}
