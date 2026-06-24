# NetOps — CMPT 471 Study Game

A web-based study tool for SFU's CMPT 471 networking course. Built as exam-prep that rewards *demonstrable skill* — every concept from the lecture decks is exercised in a small interactive simulation, not just memorised.

Five modules, each tied to one lecture deck, each playable as a randomized puzzle:

| # | Module | What you do |
|---|--------|-------------|
| A | Congestion Control & TCP Performance | Watch the AIMD sawtooth draw live; tune Reno / CUBIC / DCTCP; verify the 1/√p law; converge 3 flows to R/3 |
| B | Network Layer | Carve subnets with VLSM; wire topologies; run Dijkstra and Bellman-Ford by hand; set BGP export policy |
| C | Software Defined Networking | Install flow rules; configure one switch as 4 different roles; engineer non-shortest paths; recover from link failures |
| D | Network Virtualization | Assign ports to VLANs; build VXLAN overlays; isolate multi-tenant traffic with overlapping IPs |
| E | Programmable Dataplanes & P4 | Build a parser FSM; populate an LPM table; assemble action blocks; chain ingress tables; add INT telemetry |

## Quick start

```bash
npm install
npm run dev          # http://localhost:5173
```

Other scripts:

```bash
npm run build        # tsc + vite build
npm run lint
npm run preview      # serve the production build locally
```

## What's inside

Each level is a small, self-contained interactive scene:

- **Randomized scenarios.** Every level generates fresh parameters on mount and on the **New scenario** button — different graphs, different prefixes, different test packets each play. You can replay the same level dozens of times without seeing the same puzzle.
- **Live validation.** Most levels validate as you click; you don't hit Submit then wait for feedback. The **Finish level** button stays disabled until your solution passes.
- **Guidance hints.** Each level ships 1–2 hints that nudge toward the right approach without revealing the answer. Hints reduce the star count on completion but never block progress.
- **No external assets.** All visualisations are SVG + plain React. No Mermaid, D3, markdown, or game-engine dependencies.

## Pages

- `/` **Home** — module overview cards with mastery rings.
- `/campaign` **Campaign** — guided act sequence ("Stand up a network, then make it modern"). Acts soft-unlock at ~60 % mastery.
- `/sandbox` **Sandbox** — every level open from day one; free-play any mechanic at any difficulty.
- `/flashcards` **Flashcards** — Leitner-style spaced repetition over all module cards.
- `/study` **Study Zone** — long-form notes per subsection. Seeded content for "Foundations + AIMD"; everything else is a blank editor backed by localStorage.
- `/exam-prep` **Exam Prep** — mixed timed set drawing from your weakest tags.
- `/level/:id` **Level** — mounts the right mechanic for a given level ID.

## Architecture

```
src/
├── App.tsx                    # router + shell
├── data/
│   ├── index.ts               # MODULES registry + CAMPAIGN_ACTS
│   ├── studyNotes.ts          # Study Zone seed content
│   └── modules/               # one file per module (cards + levels)
├── mechanics/                 # the visual engines reused across decks
│   ├── AddressSpace/          # VLSM / CIDR carving
│   ├── TopologyCanvas/        # drag-and-wire topologies
│   ├── RoutingGraph/          # Dijkstra / Bellman-Ford / BGP / TE
│   ├── MatchAction/           # SDN + VLAN + multi-tenant rule tables
│   ├── RouterInternals/       # HOL vs VOQ crossbar sim
│   ├── CongestionChart/       # per-RTT TCP simulator + chart
│   └── P4Pipeline/            # parser + ingress + egress + deparser builder
├── pages/                     # one component per route
├── store/                     # zustand stores (flashcards, campaign, settings, study)
├── components/ui/             # Button, Badge, Card, MasteryMeter, Markdown
└── utils/                     # subnet, graph helpers
```

**Mechanic library, content modules.** Each lecture deck becomes a *content module* (data: flashcards, level configs, mastery thresholds). The interactive engines are *mechanics* shared across decks — for example, the match-action engine backs SDN flow tables, VLAN port assignment, and P4 tables. New decks plug in by referencing existing mechanics; building a new mechanic is reserved for genuinely new visualisations.

**Per-level mode dispatchers.** Most mechanics (RoutingGraph, MatchAction, P4Pipeline, CongestionChart) dispatch on `level.id` to a purpose-built mode component. This keeps each level's logic small and lets the win condition match the level's pedagogy exactly.

**No backend.** Progress (mastery, stars, streak, study notes) persists to `localStorage` via zustand's `persist` middleware.

## Tech stack

- **React 18** + **TypeScript** (strict)
- **Vite** for dev server + bundling
- **React Router** for client routing
- **Zustand** + `persist` for state
- **Tailwind** for styling, with a custom "NOC dashboard" palette (`bg-noc-*`, `text-link-*`)
- SVG for every visualisation — no D3, no canvas libraries

## Design philosophy

- **Competence is the reward.** Stars for correctness, efficiency, and independence (no hints used). No lives, no pay-to-progress, no global leaderboards.
- **Failure teaches.** Wrong moves trigger inline explanations and a retry. Optional auto-generation of review cards for missed concepts.
- **Sandbox is always open.** The campaign is a guided path with soft unlocks; you can drill any sandbox level any time.
- **Shared visual grammar.** Packets are moving dots; link thickness = bandwidth, colour = state; tables are the same match-action grid wherever they appear. Motion shows process — what a static slide can't show.

## Adding content

A new deck = a new file in `src/data/modules/`:

```ts
export const moduleX: ContentModule = {
  id:          'X',
  title:       'Your topic',
  sourceDeck:  'Deck N — Title',
  description: '...',
  accentClass: 'text-module-x',
  mechanics:   ['routingGraph', 'matchAction'],
  flashcards:  [ { id: 'X-01', type: 'term-definition', front: '...', back: '...', tags: ['X', ...] }, ... ],
  levels:      [ { id: 'X-L01', title: '...', intent: '...', mechanic: 'routingGraph', setup: {...}, winCondition: '...', difficulty: 1, isBoss: false }, ... ],
}
```

Then add it to `MODULES` in `src/data/index.ts` and (optionally) append acts to `CAMPAIGN_ACTS`. If the level uses a new mechanic, build it under `src/mechanics/`; otherwise existing mechanics will pick it up by `level.id` (add a case to their dispatcher).

## Status

All 5 modules, all 35 levels playable end-to-end with randomized scenarios and hint flows. Flashcards, Campaign, Sandbox, Study Zone, and Exam Prep all wired. Mastery + streak + study-note edits persist locally.

See [cmpt471-game-design.md](cmpt471-game-design.md) for the full design document and pedagogical rationale.
