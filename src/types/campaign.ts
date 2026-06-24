// Campaign, act, level, and scoring types

import type { MechanicId } from './mechanic'

/** 1–3 star score on a level */
export type StarCount = 1 | 2 | 3

export interface StarCriteria {
  /** Correct solution reached */
  correctness: boolean
  /** Minimal waste / lowest cost / least delay */
  efficiency: boolean
  /** No hints used */
  independence: boolean
}

export interface Level {
  id: string
  /** Short display title */
  title: string
  /** Player-facing goal description */
  intent: string
  /** Which mechanic engine renders this level */
  mechanic: MechanicId
  /** Opaque config blob passed directly to the mechanic component */
  setup: Record<string, unknown>
  /** Human-readable win condition description */
  winCondition: string
  difficulty: 1 | 2 | 3 | 4 | 5
  isBoss: boolean
}

export interface Act {
  id: string
  /** Display number (1-indexed) */
  number: number
  title: string
  /** Short narrative description — "Stand up a network, then make it modern" */
  description: string
  /** Module(s) this act belongs to */
  moduleIds: string[]
  levels: Level[]
  /**
   * Module mastery threshold (0–1) required for this act to be recommended.
   * The act is always accessible via sandbox; this gates campaign highlighting.
   */
  unlockThreshold: number
}

/** Persisted progress for a single level */
export interface LevelProgress {
  levelId: string
  stars: StarCount | null
  completed: boolean
  hintsUsed: number
  attemptCount: number
}
