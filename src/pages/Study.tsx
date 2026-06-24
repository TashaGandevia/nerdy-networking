// Study Zone — browse module subsections, view notes, edit/persist your own.

import { useMemo, useState } from 'react'
import { STUDY_SECTIONS } from '@/data/studyNotes'
import { useStudyStore } from '@/store'
import { Button } from '@/components/ui/Button'
import { Markdown } from '@/components/ui/Markdown'

const MODULE_ACCENT: Record<string, string> = {
  A: 'text-module-a', B: 'text-module-b',
  C: 'text-module-c', D: 'text-module-d', E: 'text-module-e',
}

export function Study() {
  const bodies    = useStudyStore((s) => s.bodies)
  const setBody   = useStudyStore((s) => s.setBody)
  const resetBody = useStudyStore((s) => s.resetBody)

  // Pick first non-empty subsection by default, falling back to first overall.
  const initialId = useMemo(() => {
    for (const sec of STUDY_SECTIONS) {
      for (const sub of sec.subsections) {
        const body = bodies[sub.id] ?? sub.body
        if (body.trim()) return sub.id
      }
    }
    return STUDY_SECTIONS[0]?.subsections[0]?.id ?? ''
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [selectedId, setSelectedId] = useState<string>(initialId)
  const [editing,    setEditing]    = useState(false)
  const [draft,      setDraft]      = useState('')

  const allSubs = STUDY_SECTIONS.flatMap((sec) =>
    sec.subsections.map((sub) => ({ ...sub, moduleId: sec.moduleId, moduleTitle: sec.moduleTitle })),
  )
  const selected = allSubs.find((s) => s.id === selectedId)
  const seedBody = selected?.body ?? ''
  const body     = bodies[selectedId] ?? seedBody
  const isEdited = bodies[selectedId] !== undefined

  function startEdit() {
    setDraft(body)
    setEditing(true)
  }

  function saveEdit() {
    setBody(selectedId, draft)
    setEditing(false)
  }

  function cancelEdit() {
    setEditing(false)
    setDraft('')
  }

  function revertToSeed() {
    resetBody(selectedId)
    setEditing(false)
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 max-w-6xl mx-auto">
      {/* Left: TOC */}
      <aside className="lg:w-72 shrink-0 noc-card p-3 flex flex-col gap-3 max-h-[calc(100vh-7rem)] overflow-y-auto">
        <div>
          <h1 className="text-noc-bright text-lg font-bold">Study Zone</h1>
          <p className="text-noc-muted text-xs mt-1">
            Module notes you can read and edit. Stored locally in your browser.
          </p>
        </div>

        {STUDY_SECTIONS.map((sec) => (
          <div key={sec.moduleId} className="flex flex-col gap-1">
            <p className={`text-xs font-semibold uppercase tracking-wider ${MODULE_ACCENT[sec.moduleId] ?? 'text-noc-muted'}`}>
              {sec.moduleId} — {sec.moduleTitle}
            </p>
            {sec.subsections.map((sub) => {
              const isSelected = sub.id === selectedId
              const hasContent = (bodies[sub.id] ?? sub.body).trim().length > 0
              return (
                <button
                  key={sub.id}
                  onClick={() => { setSelectedId(sub.id); setEditing(false) }}
                  className={`text-left text-xs px-2 py-1.5 rounded transition-colors ${
                    isSelected
                      ? 'bg-link-packet/15 text-link-packet'
                      : 'text-noc-muted hover:text-noc-text hover:bg-noc-border/30'
                  }`}
                >
                  <span className="inline-block w-2 mr-1">{hasContent ? '●' : '○'}</span>
                  {sub.title}
                </button>
              )
            })}
          </div>
        ))}
      </aside>

      {/* Right: content */}
      <section className="flex-1 noc-card p-6 flex flex-col gap-4 min-w-0">
        {selected ? (
          <>
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <p className={`text-xs uppercase tracking-widest ${MODULE_ACCENT[selected.moduleId] ?? 'text-noc-muted'}`}>
                  Module {selected.moduleId} · {selected.moduleTitle}
                </p>
                <h2 className="text-noc-bright text-xl font-bold mt-1">{selected.title}</h2>
                {isEdited && (
                  <p className="text-noc-muted text-xs mt-1">✎ edited locally</p>
                )}
              </div>
              <div className="flex gap-2 flex-wrap">
                {!editing && (
                  <Button size="sm" variant="secondary" onClick={startEdit}>
                    {body.trim() ? 'Edit' : 'Add notes'}
                  </Button>
                )}
                {!editing && isEdited && (
                  <Button size="sm" variant="ghost" onClick={revertToSeed}>
                    Revert to default
                  </Button>
                )}
                {editing && (
                  <>
                    <Button size="sm" onClick={saveEdit}>Save</Button>
                    <Button size="sm" variant="ghost" onClick={cancelEdit}>Cancel</Button>
                  </>
                )}
              </div>
            </div>

            {editing ? (
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="# Heading&#10;&#10;Write your notes here. Supports **bold**, *italic*, `code`, lists, and ``` code blocks."
                className="w-full min-h-[60vh] bg-noc-bg border border-noc-border rounded p-3 text-noc-text text-sm font-mono leading-relaxed focus:outline-none focus:border-link-packet"
              />
            ) : body.trim() ? (
              <Markdown source={body} />
            ) : (
              <div className="border border-dashed border-noc-border rounded p-6 text-center">
                <p className="text-noc-muted text-sm">
                  No notes yet for this subsection. Click <span className="text-noc-text">Add notes</span> to write your own — markdown supported.
                </p>
              </div>
            )}
          </>
        ) : (
          <p className="text-noc-muted">Pick a subsection from the left.</p>
        )}
      </section>
    </div>
  )
}
