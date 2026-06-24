// Flashcard and spaced-repetition types (SM-2 algorithm)

export type CardType =
  | 'term-definition'   // front: term, back: definition
  | 'diagram-id'        // label a topology, frame, flow table, or pipeline
  | 'which-protocol'    // which algorithm / protocol fits this scenario?
  | 'compare-two'       // compare two concepts (e.g. Reno vs CUBIC)
  | 'fill-table'        // complete a forwarding / flow / match-action table

export interface Flashcard {
  id: string
  front: string
  back: string
  type: CardType
  /** Module tag(s) this card belongs to — used for mastery tracking and exam prep */
  tags: string[]
  /** Optional hint shown after a wrong answer */
  hint?: string
  /** Optional image URL shown on the answer side */
  image?: string
  /** Alt text for the image (required when image is provided) */
  imageAlt?: string
}

/** SM-2 review record stored per card in the flashcard store */
export interface CardReview {
  cardId: string
  /** SM-2 easiness factor (starts at 2.5) */
  ef: number
  /** Repetition count */
  n: number
  /** Inter-repetition interval in days */
  interval: number
  /** Date the card is due next (ISO string) */
  dueDate: string
  /** Last quality rating 0–5 */
  lastQuality: number
}
