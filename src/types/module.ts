// Content module type — one per lecture deck, mostly data

import type { Flashcard } from './flashcard'
import type { MechanicId } from './mechanic'
import type { Level } from './campaign'

export type ModuleId = 'A' | 'B' | 'C' | 'D' | 'E' | 'F'

export interface ContentModule {
  id: ModuleId
  title: string
  /** Source deck label, e.g. "Deck 1 — Network Layer" */
  sourceDeck: string
  /** Short description shown on the module card */
  description: string
  /** Tailwind color class for this module's accent (matches module.* tokens) */
  accentClass: string
  flashcards: Flashcard[]
  /** Which mechanic engines this module uses */
  mechanics: MechanicId[]
  levels: Level[]
}
