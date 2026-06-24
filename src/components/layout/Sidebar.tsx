// Left sidebar — module navigation, mastery rings, streak counter

import { NavLink } from 'react-router-dom'
import { MODULES } from '@/data'
import { useFlashcardStore, useSettingsStore } from '@/store'
import { MasteryMeter } from '@/components/ui/MasteryMeter'

// Module accent colours mapped to Tailwind classes for the ring and active highlight
const MODULE_RING: Record<string, string> = {
  A: 'text-module-a', B: 'text-module-b',
  C: 'text-module-c', D: 'text-module-d', E: 'text-module-e',
}

const NAV_ITEMS = [
  { to: '/',          label: 'Home',       icon: '⌂' },
  { to: '/campaign',  label: 'Campaign',   icon: '▶' },
  { to: '/sandbox',   label: 'Sandbox',    icon: '⚙' },
  { to: '/flashcards',label: 'Flashcards', icon: '◧' },
  { to: '/exam-prep', label: 'Exam Prep',  icon: '⏱' },
]

/** Left navigation sidebar with module mastery rings and streak display. */
export function Sidebar() {
  const getMastery  = useFlashcardStore((s) => s.getMastery)
  const streakDays  = useSettingsStore((s) => s.streakDays)

  return (
    <aside className="flex flex-col w-56 min-h-screen bg-noc-surface border-r border-noc-border shrink-0">
      {/* Logo / title */}
      <div className="px-4 py-5 border-b border-noc-border">
        <p className="text-noc-bright font-bold text-base tracking-wide">NetOps</p>
        <p className="text-noc-muted text-xs mt-0.5">CMPT 471 Study Game</p>
      </div>

      {/* Primary nav */}
      <nav className="flex flex-col gap-0.5 px-2 py-3">
        {NAV_ITEMS.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => [
              'flex items-center gap-3 px-3 py-2 rounded text-sm transition-colors',
              isActive
                ? 'bg-link-packet/15 text-link-packet'
                : 'text-noc-muted hover:text-noc-text hover:bg-noc-border/30',
            ].join(' ')}
          >
            <span className="w-4 text-center shrink-0">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Module mastery rings */}
      <div className="px-4 py-4 border-t border-noc-border mt-2">
        <p className="text-noc-muted text-xs uppercase tracking-widest mb-3">Modules</p>
        <div className="flex flex-col gap-3">
          {MODULES.map((mod) => {
            const cardIds = mod.flashcards.map((c) => c.id)
            const mastery = getMastery(cardIds)
            return (
              <div key={mod.id} className="flex items-center gap-3">
                <MasteryMeter
                  value={mastery}
                  size={36}
                  colorClass={MODULE_RING[mod.id]}
                  showLabel={false}
                />
                <div className="min-w-0">
                  <p className="text-noc-text text-xs font-medium truncate">{mod.title}</p>
                  <p className="text-noc-muted text-xs">{Math.round(mastery * 100)}% mastered</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Streak */}
      <div className="mt-auto px-4 py-4 border-t border-noc-border">
        <div className="flex items-center gap-2">
          <span className="text-link-congested text-lg">🔥</span>
          <div>
            <p className="text-noc-text text-sm font-medium">{streakDays} day streak</p>
            <p className="text-noc-muted text-xs">Keep it up</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
