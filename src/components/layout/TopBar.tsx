// Top bar — page title, current act label, and quick settings toggle

import { useLocation } from 'react-router-dom'
import { useSettingsStore } from '@/store'
import { Button } from '@/components/ui/Button'

const ROUTE_TITLES: Record<string, string> = {
  '/':           'Home',
  '/campaign':   'Campaign',
  '/sandbox':    'Sandbox',
  '/flashcards': 'Flashcards',
  '/exam-prep':  'Exam Prep',
}

/** Top navigation bar displaying the current page title and settings shortcuts. */
export function TopBar() {
  const { pathname } = useLocation()
  const title = ROUTE_TITLES[pathname] ?? 'NetOps'

  const soundEnabled = useSettingsStore((s) => s.soundEnabled)
  const toggleSound  = useSettingsStore((s) => s.toggleSound)

  return (
    <header className="h-12 flex items-center justify-between px-5 border-b border-noc-border bg-noc-surface shrink-0">
      <h1 className="text-noc-bright font-semibold text-sm tracking-wide">{title}</h1>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSound}
          title={soundEnabled ? 'Mute sound' : 'Enable sound'}
          aria-label={soundEnabled ? 'Mute sound' : 'Enable sound'}
        >
          {soundEnabled ? '🔊' : '🔇'}
        </Button>
      </div>
    </header>
  )
}
