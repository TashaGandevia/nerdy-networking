// Home page — daily session loop: warm-up flashcards, play prompt, streak display

import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { MODULES, ALL_FLASHCARDS, CAMPAIGN_ACTS } from '@/data'
import { useFlashcardStore, useSettingsStore } from '@/store'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { MasteryMeter } from '@/components/ui/MasteryMeter'
import { Badge } from '@/components/ui/Badge'

const MODULE_RING: Record<string, string> = {
  A: 'text-module-a', B: 'text-module-b',
  C: 'text-module-c', D: 'text-module-d', E: 'text-module-e',
}

const MODULE_ACCENT: Record<string, string> = {
  A: 'bg-module-a', B: 'bg-module-b',
  C: 'bg-module-c', D: 'bg-module-d', E: 'bg-module-e',
}

/** Home dashboard — daily warm-up prompt, module overview, and streak. */
export function Home() {
  const navigate     = useNavigate()
  const getMastery   = useFlashcardStore((s) => s.getMastery)
  const getDueCardIds = useFlashcardStore((s) => s.getDueCardIds)
  const streakDays   = useSettingsStore((s) => s.streakDays)

  const allCardIds = useMemo(() => ALL_FLASHCARDS.map((c) => c.id), [])
  const dueCount   = useMemo(() => getDueCardIds(allCardIds).length, [getDueCardIds, allCardIds])
  const nextAct    = CAMPAIGN_ACTS[0]

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8">
      {/* Header */}
      <div>
        <h1 className="text-noc-bright text-2xl font-bold">Welcome to NetOps</h1>
        <p className="text-noc-muted text-sm mt-1">
          CMPT 471 study game — from a startup ISP to a hyperscaler.
        </p>
      </div>

      {/* Daily session prompt */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Flashcard warm-up */}
        <Card accentColor="bg-link-packet" className="p-5 flex flex-col gap-3">
          <p className="text-noc-muted text-xs uppercase tracking-widest">Daily warm-up</p>
          <p className="text-noc-bright font-semibold">
            {dueCount > 0 ? `${dueCount} cards due` : 'All caught up!'}
          </p>
          <p className="text-noc-muted text-xs">5–10 cards from your weakest tags</p>
          <Button
            size="sm"
            variant={dueCount > 0 ? 'primary' : 'ghost'}
            onClick={() => navigate('/flashcards')}
          >
            {dueCount > 0 ? 'Start review' : 'Browse cards'}
          </Button>
        </Card>

        {/* Campaign */}
        <Card accentColor="bg-module-b" className="p-5 flex flex-col gap-3">
          <p className="text-noc-muted text-xs uppercase tracking-widest">Campaign</p>
          <p className="text-noc-bright font-semibold">Act {nextAct.number}: {nextAct.title}</p>
          <p className="text-noc-muted text-xs">{nextAct.description}</p>
          <Button size="sm" variant="secondary" onClick={() => navigate('/campaign')}>
            Continue
          </Button>
        </Card>

        {/* Streak */}
        <Card accentColor="bg-link-congested" className="p-5 flex flex-col gap-3">
          <p className="text-noc-muted text-xs uppercase tracking-widest">Streak</p>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔥</span>
            <p className="text-noc-bright text-2xl font-bold">{streakDays}</p>
            <p className="text-noc-muted text-sm">days</p>
          </div>
          <Button size="sm" variant="ghost" onClick={() => navigate('/exam-prep')}>
            Exam Prep →
          </Button>
        </Card>
      </div>

      {/* Module overview */}
      <div>
        <h2 className="text-noc-text font-semibold mb-4">Modules</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {MODULES.map((mod) => {
            const cardIds = mod.flashcards.map((c) => c.id)
            const mastery = getMastery(cardIds)
            return (
              <Card
                key={mod.id}
                accentColor={MODULE_ACCENT[mod.id]}
                className="p-4 flex gap-3 items-start"
                onClick={() => navigate('/flashcards', { state: { moduleId: mod.id } })}
              >
                <MasteryMeter
                  value={mastery}
                  size={44}
                  colorClass={MODULE_RING[mod.id]}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-noc-text text-sm font-medium truncate">{mod.title}</p>
                    <Badge variant="idle">{mod.id}</Badge>
                  </div>
                  <p className="text-noc-muted text-xs mt-0.5 leading-snug line-clamp-2">
                    {mod.description}
                  </p>
                  <p className="text-noc-muted text-xs mt-1">
                    {mod.flashcards.length} cards · {mod.levels.length} levels
                  </p>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
