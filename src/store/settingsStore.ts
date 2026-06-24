// Zustand store for user settings, streaks, and preferences, persisted to localStorage

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsState {
  /** ISO date string of the last day the user completed their review set */
  lastStreakDate: string | null
  /** Current streak length in days */
  streakDays: number
  /** Whether the player has enabled sound effects */
  soundEnabled: boolean
  /** Whether to show the optional P4 code toggle in the P4 Pipeline mechanic */
  showP4Code: boolean

  /**
   * Records that the user completed their daily review.
   * Increments streak if the last completion was yesterday; resets if older.
   */
  recordDailyReview: () => void

  /** Toggles sound on/off */
  toggleSound: () => void

  /** Toggles the P4 code snippet panel */
  toggleP4Code: () => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      lastStreakDate: null,
      streakDays:    0,
      soundEnabled:  true,
      showP4Code:    false,

      recordDailyReview() {
        const today     = new Date().toISOString().slice(0, 10)
        const { lastStreakDate, streakDays } = get()

        if (lastStreakDate === today) return // already recorded today

        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const wasYesterday = lastStreakDate === yesterday.toISOString().slice(0, 10)

        set({
          lastStreakDate: today,
          streakDays:    wasYesterday ? streakDays + 1 : 1,
        })
      },

      toggleSound()   { set((s) => ({ soundEnabled: !s.soundEnabled })) },
      toggleP4Code()  { set((s) => ({ showP4Code:   !s.showP4Code }))   },
    }),
    { name: 'netops-settings' },
  ),
)
