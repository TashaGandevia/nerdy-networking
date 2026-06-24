// Persists user edits to Study Zone subsection bodies. Defaults come from
// src/data/studyNotes.ts; this store only stores overrides keyed by subsection id.

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface StudyState {
  /** subsectionId → markdown body. Missing keys fall back to the seed. */
  bodies: Record<string, string>

  setBody:   (id: string, body: string) => void
  resetBody: (id: string) => void
}

export const useStudyStore = create<StudyState>()(
  persist(
    (set) => ({
      bodies: {},
      setBody(id, body) {
        set((s) => ({ bodies: { ...s.bodies, [id]: body } }))
      },
      resetBody(id) {
        set((s) => {
          const next = { ...s.bodies }
          delete next[id]
          return { bodies: next }
        })
      },
    }),
    { name: 'netops-study' },
  ),
)
