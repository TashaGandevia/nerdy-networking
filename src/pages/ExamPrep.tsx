// Exam Prep page — pulls weakest tags across all modules into a timed mixed set + boss rush

import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ALL_FLASHCARDS, CAMPAIGN_ACTS } from '@/data'
import { useFlashcardStore } from '@/store'
import { FlashcardDeck } from '@/components/flashcard/FlashcardDeck'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

type ExamMode = 'idle' | 'flashcards' | 'boss-rush'

/** Exam Prep — timed weak-tag flashcard set and boss-level rush for pre-exam cramming. */
export function ExamPrep() {
  const navigate   = useNavigate()
  const [mode, setMode] = useState<ExamMode>('idle')

  const getDueCardIds = useFlashcardStore((s) => s.getDueCardIds)
  const getMastery    = useFlashcardStore((s) => s.getMastery)

  // Build a set of the weakest cards (lowest mastery tags) across all modules
  const weakCards = useMemo(() => {
    const allIds  = ALL_FLASHCARDS.map((c) => c.id)
    const dueIds  = new Set(getDueCardIds(allIds))
    // Prioritise due cards, then cards not yet fully learned
    return ALL_FLASHCARDS
      .filter((c) => dueIds.has(c.id) || getMastery([c.id]) < 0.5)
      .slice(0, 30) // cap at 30 for a timed session
  }, [getDueCardIds, getMastery])

  const bossLevels = useMemo(
    () => CAMPAIGN_ACTS.flatMap((a) => a.levels.filter((l) => l.isBoss)),
    [],
  )

  if (mode === 'flashcards') {
    return (
      <div className="max-w-2xl mx-auto flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-noc-bright text-xl font-bold">Exam Prep — Weak Tags</h1>
          <Button variant="ghost" size="sm" onClick={() => setMode('idle')}>← Back</Button>
        </div>
        <FlashcardDeck
          cards={weakCards}
          onComplete={() => setMode('idle')}
        />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-8">
      <div>
        <h1 className="text-noc-bright text-xl font-bold">Exam Prep</h1>
        <p className="text-noc-muted text-sm mt-1">
          Your weakest tags, all modules, timed — or blast through every boss level.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Weak-tag flashcard set */}
        <Card accentColor="bg-link-packet" className="p-5 flex flex-col gap-3">
          <p className="text-noc-muted text-xs uppercase tracking-widest">Mixed review</p>
          <h2 className="text-noc-bright font-semibold">Weak Tags Set</h2>
          <p className="text-noc-muted text-xs">
            {weakCards.length} cards from your lowest-mastery topics across all modules.
          </p>
          <Button size="sm" onClick={() => setMode('flashcards')} disabled={weakCards.length === 0}>
            {weakCards.length === 0 ? 'Nothing weak — great!' : `Start (${weakCards.length} cards)`}
          </Button>
        </Card>

        {/* Boss rush */}
        <Card accentColor="bg-link-down" className="p-5 flex flex-col gap-3">
          <p className="text-noc-muted text-xs uppercase tracking-widest">Boss Rush</p>
          <h2 className="text-noc-bright font-semibold">All Boss Levels</h2>
          <p className="text-noc-muted text-xs">
            {bossLevels.length} boss challenges — one per act, back-to-back.
          </p>
          <Button variant="danger" size="sm" onClick={() => setMode('boss-rush')}>
            Start Boss Rush
          </Button>
        </Card>
      </div>

      {/* Boss rush level list */}
      {mode === 'boss-rush' && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-noc-text font-semibold">Boss Levels</h2>
            <Button variant="ghost" size="sm" onClick={() => setMode('idle')}>← Back</Button>
          </div>
          {bossLevels.map((level) => (
            <Card
              key={level.id}
              accentColor="bg-link-down"
              className="p-4 flex items-center justify-between gap-4"
              onClick={() => navigate(`/level/${level.id}`)}
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-noc-bright font-medium">{level.title}</p>
                  <Badge variant="down">Boss</Badge>
                </div>
                <p className="text-noc-muted text-xs mt-0.5">{level.intent}</p>
              </div>
              <span className="text-noc-muted text-xs shrink-0">{'●'.repeat(level.difficulty)}</span>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
