// Flashcards page — spaced-repetition review session, filterable by module

import { useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { MODULES, ALL_FLASHCARDS } from '@/data'
import { useFlashcardStore, useSettingsStore } from '@/store'
import { FlashcardDeck } from '@/components/flashcard/FlashcardDeck'
import { Badge } from '@/components/ui/Badge'

type ModuleFilter = 'all' | 'A' | 'B' | 'C' | 'D' | 'E'

/** Flashcard review page — SM-2 session with module filter tabs. */
export function Flashcards() {
  const location = useLocation()
  const initialModule = (location.state as { moduleId?: ModuleFilter } | null)?.moduleId ?? 'all'

  const [activeModule, setActiveModule] = useState<ModuleFilter>(initialModule)
  const [sessionKey,   setSessionKey]   = useState(0) // increment to restart session

  const getDueCardIds     = useFlashcardStore((s) => s.getDueCardIds)
  const recordDailyReview = useSettingsStore((s) => s.recordDailyReview)

  const filteredCards = useMemo(() => {
    const cards = activeModule === 'all'
      ? ALL_FLASHCARDS
      : ALL_FLASHCARDS.filter((c) => c.tags.includes(activeModule))
    const ids = cards.map((c) => c.id)
    const dueIds = new Set(getDueCardIds(ids))
    // Due cards first, then remaining cards for browsing
    return [
      ...cards.filter((c) => dueIds.has(c.id)),
      ...cards.filter((c) => !dueIds.has(c.id)),
    ]
  }, [activeModule, getDueCardIds])

  function handleSessionComplete(reviewed: number) {
    if (reviewed > 0) recordDailyReview()
  }

  const tabs: { id: ModuleFilter; label: string }[] = [
    { id: 'all', label: 'All' },
    ...MODULES.map((m) => ({ id: m.id as ModuleFilter, label: m.title })),
  ]

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-noc-bright text-xl font-bold">Flashcards</h1>
        <p className="text-noc-muted text-sm mt-1">
          Spaced-repetition review — due cards first, weakest tags resurface automatically.
        </p>
      </div>

      {/* Module filter tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveModule(tab.id); setSessionKey((k) => k + 1) }}
            className={`text-xs px-3 py-1.5 rounded border transition-colors ${
              activeModule === tab.id
                ? 'bg-link-packet/15 border-link-packet text-link-packet'
                : 'border-noc-border text-noc-muted hover:text-noc-text'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Badge variant="idle">{filteredCards.length} cards</Badge>
        <Badge variant={filteredCards.filter((c) => getDueCardIds([c.id]).length > 0).length > 0 ? 'congested' : 'up'}>
          {getDueCardIds(filteredCards.map((c) => c.id)).length} due
        </Badge>
      </div>

      {/* Review session — key forces remount when module filter changes */}
      <FlashcardDeck
        key={`${activeModule}-${sessionKey}`}
        cards={filteredCards}
        onComplete={handleSessionComplete}
      />
    </div>
  )
}
