// Single flashcard with answer input, flip-to-reveal, and SM-2 quality rating buttons

import { useState, useEffect, useRef, useMemo } from 'react'
import type { Flashcard } from '@/types'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

interface FlashcardCardProps {
  card: Flashcard
  /**
   * Called when the user submits a quality rating.
   * @param quality - SM-2 quality 0–5 (0–2 fail, 3–5 pass)
   */
  onRate: (quality: number) => void
}

const QUALITY_BUTTONS = [
  { label: 'Blackout', quality: 0, variant: 'danger'    as const },
  { label: 'Hard',     quality: 2, variant: 'secondary' as const },
  { label: 'Good',     quality: 3, variant: 'secondary' as const },
  { label: 'Easy',     quality: 5, variant: 'primary'   as const },
]

/**
 * Flashcard with flip-to-reveal mechanic and SM-2 quality rating.
 * Resets to hidden whenever the card prop changes (i.e. on progression).
 * Optionally renders an image on the answer side when card.image is set.
 *
 * @param card   - The flashcard data to display
 * @param onRate - Callback with the player's quality rating (triggers SM-2 update)
 */
export function FlashcardCard({ card, onRate }: FlashcardCardProps) {
  const [flipped, setFlipped]       = useState(false)
  const [userAnswer, setUserAnswer] = useState('')
  const textareaRef                 = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setFlipped(false)
    setUserAnswer('')
  }, [card.id])

  function handleReveal() {
    if (!flipped) setFlipped(true)
  }

  // Tokenise into [word, nonWord] runs, preserving original text exactly
  function tokenise(text: string): string[] {
    return text.split(/(\b\w+\b)/)
  }

  // Set of normalised words present in both answers
  const matchedWords = useMemo(() => {
    const normalise = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
    const userWords = new Set(userAnswer.split(/\b/).map(normalise).filter(Boolean))
    const backWords = new Set(card.back.split(/\b/).map(normalise).filter(Boolean))
    return new Set([...userWords].filter((w) => backWords.has(w)))
  }, [userAnswer, card.back])

  function renderHighlighted(text: string) {
    return tokenise(text).map((token, i) => {
      const norm = token.toLowerCase().replace(/[^a-z0-9]/g, '')
      if (norm && matchedWords.has(norm)) {
        return (
          <mark key={i} className="bg-link-packet/25 text-noc-bright rounded px-0.5">
            {token}
          </mark>
        )
      }
      return token
    })
  }

  return (
    <div className="flex flex-col gap-4 w-full max-w-2xl mx-auto">
      {/* Card face */}
      <div className="noc-card p-6 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-2">
          <Badge variant="idle">{card.type}</Badge>
          <div className="flex gap-1 flex-wrap justify-end">
            {card.tags.map((t) => (
              <Badge key={t} variant="neutral">{t}</Badge>
            ))}
          </div>
        </div>

        <p className="text-noc-bright text-lg leading-relaxed">{card.front}</p>

        {/* Answer input — always visible before flip, read-only after */}
        {!flipped ? (
          <div className="flex flex-col gap-2">
            <textarea
              ref={textareaRef}
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleReveal()
              }}
              placeholder="Type your answer here…"
              rows={3}
              className="w-full rounded border border-noc-border bg-noc-surface text-noc-text placeholder-noc-muted text-sm p-3 resize-none focus:outline-none focus:border-link-packet"
            />
            <Button variant="primary" size="sm" onClick={handleReveal} className="self-end">
              Reveal answer
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Side-by-side comparison */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <p className="text-xs font-semibold text-noc-muted uppercase tracking-wide">Your answer</p>
                <div className="rounded border border-noc-border bg-noc-surface p-3 text-sm text-noc-text whitespace-pre-wrap min-h-[60px]">
                  {userAnswer.trim() ? renderHighlighted(userAnswer) : <span className="text-noc-muted italic">No answer entered</span>}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-xs font-semibold text-link-packet uppercase tracking-wide">Correct answer</p>
                <div className="rounded border border-link-packet/40 bg-noc-surface p-3 text-sm text-noc-text whitespace-pre-wrap min-h-[60px]">
                  {renderHighlighted(card.back)}
                </div>
              </div>
            </div>

            {card.image && (
              <img
                src={card.image}
                alt={card.imageAlt ?? ''}
                className="rounded border border-noc-border max-h-64 object-contain self-center"
              />
            )}

            {card.hint && (
              <p className="text-noc-muted text-sm italic">Hint: {card.hint}</p>
            )}
          </div>
        )}
      </div>

      {/* Rating buttons — only shown after flip */}
      {flipped && (
        <div className="flex gap-2 justify-center flex-wrap">
          {QUALITY_BUTTONS.map(({ label, quality, variant }) => (
            <Button
              key={quality}
              variant={variant}
              size="sm"
              onClick={() => onRate(quality)}
            >
              {label}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}
