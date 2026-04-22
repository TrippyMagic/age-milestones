# AGENTS.md — Kronoscope

> Reference document for AI agents and contributors.
> Last updated: 23 aprile 2026 — refactor_4 phase 2 slice 2 verified.

## Project overview

Kronoscope is a React 19 + TypeScript SPA built with Vite that lets users enter their birth date (and optionally time) and explore their lifetime expressed through unusual units, perspectives, and timescales. The live deployment is on Vercel.

> **Planning status note (2026-04-23):** this file is aligned to the Fase 0 audit baseline plus the verified Fase 2 slice 2 state, but some structural lists remain high-level summaries. The authoritative refactor_4 documents are:
> - `refactor_docs/refactor_3/PLAN.md` — completed roadmap for the current product baseline
> - `refactor_docs/refactor_4/PLAN.md` — current structural refactor baseline
> - `refactor_docs/refactor_4/DECISIONS.md` — ADR / decision log for refactor_4
> - `refactor_docs/refactor_4/AUDIT_SUMMARY.md` — phase 0 inventory, cleanup boundary, priorities
> - `refactor_docs/refactor_4/ARCHITECTURE_BASELINE.md` — verified runtime architecture snapshot

**Live demo:** <https://age-milestones-live.vercel.app/>

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | React 19 (`react`, `react-dom`) |
| Language | TypeScript 5.7 (strict mode) |
| Bundler / Dev server | Vite 6 with `@vitejs/plugin-react` |
| Routing | `react-router-dom` v7 (BrowserRouter, declarative `<Routes>`) |
| UI primitives | internal `src/ui/` layer + `@radix-ui/react-tabs` for headless tabs |
| Date handling | `dayjs` (with `duration` and `utc` plugins) |
| Animation | `framer-motion` v12 (actively used in timeline/detail/overlay transitions) |
| 3D | `@react-three/fiber` v9, `@react-three/drei` v10 (lazy-loaded, excluded from main bundle) |
| Analytics | `@vercel/analytics` v1 |
| Linting | ESLint 9 flat config (`typescript-eslint`, `react-hooks`, `react-refresh`) |
| Testing | Vitest v1 + `@testing-library/react` + `jsdom` (phase 2 slice 2 verified: 10 files / 79 tests) |
| Styling | Plain CSS via `src/css/index.css` + 9 imported modules; `src/css/ui.css` is the active refactor_4 UI-system stylesheet and `timeline.css` now hosts both the hybrid canvas layer and the global-lane accessible overlay |

---

## Quick commands

```bash
npm install          # install dependencies
npm run dev          # start Vite dev server (HMR)
npm run build        # tsc type-check + Vite production build → dist/
npm run preview      # preview the production build locally
npm run lint         # run ESLint across the project
npm test             # run Vitest tests (phase 2 slice 2 verified: 79 tests across 10 files)
```

---

## Project structure

> **Audit note:** the tree below is a contributor-oriented summary, not a byte-perfect inventory. For the verified Fase 0 state, prefer `refactor_docs/refactor_4/ARCHITECTURE_BASELINE.md`.

```
kronoscope/
├── AGENTS.md                        # This file
├── index.html                       # SPA entry point
├── vite.config.ts                   # Vite config (react plugin)
├── tsconfig.json                    # TS project references
├── tsconfig.app.json                # App TS config (strict, ES2020, excludes unused/)
├── tsconfig.node.json               # Node-side TS config (vite.config)
├── eslint.config.js                 # ESLint flat config
├── package.json
├── README.md                        # User-facing quick start
├── refactor_docs/
│   ├── DECISIONS.md                 # Architectural decisions log (historical root doc)
│   ├── FINAL_REPORT.md              # Historical refactoring phase report
│   ├── PLAN.md                      # Historical implementation roadmap
│   ├── REFACTOR_IDEA.md             # Original refactoring proposal
│   ├── refactor_3/
│   │   ├── PLAN.md                  # Completed roadmap for the current product baseline
│   │   └── DECISIONS.md             # Decisions log for refactor_3
│   └── refactor_4/
│       ├── PLAN.md                  # Current structural roadmap: UI system + timeline platform stabilization
│       ├── DECISIONS.md             # ADR log for refactor_4
│       ├── AUDIT_SUMMARY.md         # Phase 0 inventory + cleanup boundary
│       └── ARCHITECTURE_BASELINE.md # Verified runtime architecture snapshot
├── public/
│   ├── bg-time.png
│   ├── default-favicon.png
│   ├── vite.svg
│   └── data/
│       ├── historical-events.json   # 48 historical events (1905–2025)
│       ├── geological-eras.json     # Geological/cosmic drilldown data
│       └── timescale-phenomena.json # ~60 phenomena (Planck → heat death)
└── src/
    ├── main.tsx                     # Providers (BirthDate + Preferences) + BrowserRouter + routes
    ├── vite-env.d.ts                # Vite client types
    ├── ui/
    │   ├── Button.tsx               # New UI-system button primitive (phase 1 slice 1)
    │   ├── Banner.tsx               # Status/warning banner primitive
    │   ├── Field.tsx                # Label + hint + control wrapper
    │   ├── FormActions.tsx          # Shared action-row wrapper
    │   ├── Inline.tsx               # Horizontal layout primitive
    │   ├── Panel.tsx                # Shared surface/panel primitive
    │   ├── Stack.tsx                # Vertical layout primitive
    │   ├── Tabs.tsx                 # Headless tabs wrapper built on Radix Tabs
    │   ├── cx.ts                    # Minimal className helper
    │   └── index.ts                 # Public barrel for the UI slice
    ├── css/
    │   ├── index.css                # Global entry: @import all modules + reset + CSS tokens
    │   ├── ui.css                   # New phase 1 primitive styles (ui-*)
    │   ├── components.css           # Shared UI: cards, buttons, tabs, age-table, chips
    │   ├── Landing.css              # Landing page specific styles
    │   ├── navbar.css               # Navbar + footer
    │   ├── scale-overlay.css        # "But how much is it?" overlay
    │   ├── timeline.css             # All .timeline__* + filter card + Ctrl+scroll hint + responsive
    │   ├── timeline3d.css           # 3D timeline canvas + HTML overlays
    │   ├── timescales.css           # Timescales page (overview, comparator, explorer)
    │   └── wizard.css               # Birth date wizard
    ├── context/
    │   ├── BirthDateContext.tsx     # birthDate + birthTime + clearBirthDate (localStorage: "dob", "dobTime")
    │   ├── PreferencesContext.tsx   # activeCategories, show3D, timescalesTab, visibleTimelineLanes + legacy scaleMode (pref_*)
    │   └── UserProfileContext.tsx   # optional personal metrics stored in localStorage ("user_profile")
    ├── hooks/
    │   ├── useBirthWizard.ts        # Open/close wizard + body scroll lock + save to context
    │   ├── useElementSize.ts        # ResizeObserver element dimension hook
    │   ├── useExplorerDrilldown.ts  # Breadcrumb stack navigation for GeoCosmicExplorer
    │   ├── useGeologicalEras.ts     # Fetch + module-level cache for geological-eras.json
    │   ├── useHistoricalEvents.ts   # Fetch + module-level cache for historical-events.json
    │   ├── useMilestone.ts          # Milestone calculation logic (Milestones page)
    │   ├── useOutsideClick.ts       # Detect clicks outside a ref'd element
    │   └── useTimescalePhenomena.ts # Fetch + module-level cache for timescale-phenomena.json
    ├── pages/
    │   ├── Landing.tsx              # Home: intro text + inline BirthDatePicker + CTA to Milestones/Settings
    │   ├── Milestones.tsx           # Main page: AgeTable + Timeline (2D/3D) + category filters
    │   ├── Timescales.tsx           # ✅ Full: Overview + Comparator + Geo/Cosmic Explorer
    │   ├── Settings.tsx             # Canonical DOB/profile surface, now first consumer of src/ui primitives
    │   ├── Personalize.tsx          # Legacy compatibility re-export to Settings; runtime route redirects to /settings
    │   └── About.tsx                # About page (landingIntro paragraphs)
    ├── components/
    │   ├── AgeTable.tsx             # Live-ticking table (1 s interval, all 6 perspectives)
    │   ├── BirthDatePicker.tsx      # Shared inline DOB/time picker; first shared form primitive consumer
    │   ├── BirthDateWizard.tsx      # Legacy/orphan wizard component kept for audit/pruning, not mounted in runtime
    │   ├── scaleOverlay.tsx         # "But how much is it?" popup + dot-grid + equivalences
    │   ├── Timeline.tsx             # Backward-compat re-export barrel → timeline/Timeline
    │   ├── 3d/
    │   │   ├── EventMarker3D.tsx    # R3F event sphere + Html label
    │   │   ├── Timeline3D.tsx       # R3F Canvas scene (OrbitControls, markers, axis tube)
    │   │   └── Timeline3DWrapper.tsx# Lazy-loading shell + WebGL check + fallbacks
    │   ├── common/
    │   │   ├── Footer.tsx           # Page footer
    │   │   ├── Headers.tsx          # <Title> and <Navbar> components
    │   │   ├── MockCard.tsx         # Placeholder card for WIP pages
    │   │   └── scaleHint.tsx        # "?" button that opens scaleOverlay
    │   ├── timeline/
    │   │   ├── Timeline.tsx         # Viewport state, pan/zoom, pinch, grouping, selection, render orchestration
    │   │   ├── TimelineGlobalLaneCanvas.tsx # First phase-2 hybrid canvas backdrop for the global lane
    │   │   ├── TimelineGlobalLaneOverlay.tsx # Accessible HTML hit-target overlay for the global lane canvas
    │   │   ├── EventElement.tsx     # Dot marker + hover label; uses event.color ?? accent
    │   │   ├── SubTimeline.tsx      # Legacy/orphan grouped-events surface; not mounted in current runtime
    │   │   ├── TimelineControls.tsx # +/−/↺ zoom + reset + Ctrl+scroll hint label
    │   │   ├── TimelineDetailPanel.tsx # Active selected-item details panel (mobile sheet / desktop inline)
    │   │   ├── buildRenderItems.ts  # Compatibility re-export toward timeline-core/buildRenderItems
    │   │   ├── index.ts             # Public barrel (default + TimelineEvent + types)
    │   │   └── types.ts             # TimelineEvent (color?), Accent, RenderItem, consts
    │   ├── timeline-core/
    │   │   ├── buildRenderItems.ts  # Extracted pure grouping/positioning logic for the new timeline core
    │   │   ├── buildTimelineScene.ts# Lane/tick/focus scene builder used by active runtime Timeline
    │   │   ├── interaction.ts       # Selection payloads, interactive targets, geometry + aria metadata for hybrid lanes
    │   │   └── index.ts             # Public barrel for phase-2 core helpers
    │   ├── timescales/
    │   │   ├── EraCard.tsx          # Era card with linear proportional bar
    │   │   ├── GeoCosmicExplorer.tsx# Geological drilldown + cosmic milestones sub-tabs
    │   │   ├── PhenomenaComparator.tsx # Two-phenomenon comparison with absolute log bars
    │   │   ├── PhenomenaSearch.tsx  # Search + category-filter picker for phenomena
    │   │   └── TimescaleOverview.tsx# Vertical SVG log ruler, collision-aware labels
        │   └── unused/                  # Excluded from TS compilation; only constants.ts still leaks via type import
        │       ├── constants.ts         # Legacy constants; Unit type still imported by useMilestone.ts
    │       ├── MilestonePicker.tsx
    │       ├── MorePanel.tsx
    │       ├── ResultBlock.tsx
    │       └── TimezoneSelect.tsx
    ├── types/
    │   ├── events.ts                # EventCategory, CATEGORY_META colors, HistoricalEvent types
    │   ├── geological.ts            # GeologicalUnit, CosmicMilestone, GeoExplorerData, RANK_LABELS
    │   └── phenomena.ts             # TimescalePhenomenon, PhenomenonCategory, log range consts
    ├── utils/
    │   ├── format.ts                # formatNice / formatBig / formatSmall / formatDisplay
    │   ├── formatDuration.ts        # formatDuration, formatMya, formatMyaDuration, formatRatioValue
    │   ├── perspectivesConstants.ts # TAB_ROWS: 6 perspective tab definitions
    │   ├── scaleConstants.ts        # SCALES, equivalence builders, KIND_BY_LABEL
    │   ├── scaleTransform.ts        # Lin/log ratio math, applyZoom, viewportToRange, generateTicks
    │   └── webgl.ts                 # WEB_GL_SUPPORTED — evaluated once at module load
    └── tests/
        ├── format.test.ts           # Vitest: formatNice, formatBig, formatSmall
        └── scaleTransform.test.ts   # Vitest: clamp, linearRatio, logRatio, applyZoom, ticks
```

---

## Architecture & key concepts

### Routing

| Path | Page | Status |
|---|---|---|
| `/` | Landing | ✅ Complete |
| `/milestones` | Milestones | ✅ Complete (main feature) |
| `/timescales` | Timescales | ✅ Complete (Overview + Comparator + Explorer) |
| `/settings` | Settings | ✅ Complete (canonical DOB/profile surface) |
| `/personalize` | Redirect to `/settings` | ↪ Legacy compatibility path |
| `/about` | About | ✅ Complete |

### State management

Three React Contexts (no external state library):

- **`BirthDateContext`** — `birthDate`, `setBirthDate`, `birthTime`, `setBirthTime`. Persisted in `localStorage` (`"dob"`, `"dobTime"`).
- **`PreferencesContext`** — `activeCategories`, `show3D`, `timescalesTab`, `visibleTimelineLanes`, plus legacy persisted `scaleMode`. Persisted with `pref_*` keys.
- **`UserProfileContext`** — optional personal metrics used to refine estimate ranges; persisted under `"user_profile"`.

Providers wrap the router in `main.tsx`: `BirthDateProvider` → `PreferencesProvider` → `UserProfileProvider` → `BrowserRouter`.

### Birth date input system

The active runtime uses `BirthDatePicker`, an inline date/time picker shared by `Landing` and `Settings`.

As of refactor_4 Fase 1 slice 1, `BirthDatePicker` and `Settings` are the first runtime consumers of the new internal `src/ui/` layer.

`BirthDateWizard` and `useBirthWizard` still exist in the repository but were classified as orphan/legacy during the refactor_4 Fase 0 audit and are not mounted by current routes.

### Perspectives & AgeTable

Six tabbed perspectives defined in `perspectivesConstants.ts`:

- **Classic** — Years, Months, Weeks, Days, Hours, Minutes, Seconds, Nanoseconds
- **Biological** — Breaths, Heartbeats, Blood pumped, Calories, Dog years, etc.
- **Everyday** — Steps, Words spoken, Showers, Laughs, etc.
- **Nerdy** — Smartphone unlocks, Keystrokes, Bitcoin blocks, etc.
- **Cosmic** — Lunar cycles, Martian years, Jovian years, Galactic motion km, etc.
- **Eons** — Universe age portion, Earth age portion, Homo sapiens portion, etc.

`AgeTable` re-calculates all values every second. Dog years use a piecewise AKC-style formula.

### Timeline (2D)

Active runtime is now split between `src/components/timeline/` and the new `src/components/timeline-core/` foundation introduced in refactor_4 Fase 2 slice 1.

| Module | Responsibility |
|---|---|
| `timeline-core/buildTimelineScene.ts` | Pure scene builder: ticks, canonical lane order, lane tops, focus ratio, render items per lane |
| `timeline-core/buildRenderItems.ts` | Pure grouping + left-percent positioning logic extracted from the legacy timeline folder |
| `timeline-core/interaction.ts` | Pure interaction contract: selection payloads, target geometry, aria/title metadata, detail-item mapping |
| `Timeline.tsx` | Viewport state, pan/zoom, pinch, detail panel orchestration, personal-lane DOM path + global hybrid wiring |
| `TimelineGlobalLaneCanvas.tsx` | First hybrid canvas runtime layer for the dense global lane, rendered beneath DOM hit-targets |
| `TimelineGlobalLaneOverlay.tsx` | Accessible overlay buttons for the global lane; keyboard/focus/select path above canvas |
| `EventElement.tsx` | Single event dot + hover label; `--marker-color` = `event.color ?? accentColors[accent]` |
| `SubTimeline.tsx` | Legacy/orphan grouped-events panel; not part of the active rendered surface |
| `TimelineControls.tsx` | +/−/↺ zoom buttons and Ctrl+scroll hint label |
| `TimelineDetailPanel.tsx` | Active selected-item details panel |
| `buildRenderItems.ts` | Compatibility bridge to keep legacy imports stable while the engine moves into `timeline-core/` |

**Scale mode status:** the public log toggle has been removed. `PreferencesContext` still persists `scaleMode` as legacy state, but the active timeline currently uses an internal linear mode and treats scale cleanup as refactor_4 debt.

**Phase 2 slice 2 status:** the active 2D timeline now consumes scene + interaction data from `timeline-core`. The `global` lane uses a hybrid path (`TimelineGlobalLaneCanvas` + `TimelineGlobalLaneOverlay`), while the `personal` lane still uses the DOM marker path.

**Event dot colors:** `TimelineEvent` has an optional `color?: string` field. Historical events from `historical-events.json` receive `color: CATEGORY_META[category].color` in `Milestones.tsx`:
- Historical → `#ef4444` (red)
- Scientific → `#22d3ee` (cyan)
- Technological → `#a855f7` (violet)
- Space → `#38bdf8` (sky blue)
- Cultural → `#34d399` (green)

Personal milestones (birth, today, midpoint, etc.) have no `color` override and use their `accent` value (pinkish/indigo).

**Category filter card:** Chips are wrapped in `.timeline__filter-section` — a card with blur/border and "Filter events" label. Active chips get inline `background` and `borderColor` from their category color. On `≤ 480px`: label hides, chip padding shrinks. On `≤ 720px`: Ctrl+scroll hint hides (`display: none`).

### Timeline (3D)

Lazy-loaded: `Timeline3DWrapper` uses `React.lazy(() => import('./Timeline3D'))` so Three.js is never in the main bundle. A `three-vendor` chunk (~307 kB gzip) is only downloaded when the user activates 3D mode. `WEB_GL_SUPPORTED` is detected once at module init in `webgl.ts`; the toggle button is disabled when WebGL is unavailable.

### Timescales page

Three tabs persisted in `PreferencesContext.timescalesTab`:

| Tab | Component | Description |
|---|---|---|
| Overview | `TimescaleOverview` | Vertical SVG log-scale ruler, Planck time → black hole evaporation, collision-aware labels |
| Compare | `PhenomenaComparator` | Pick two phenomena, see ratio + absolute log-scale bar positions |
| Explorer | `GeoCosmicExplorer` | Two sub-tabs: breadcrumb geological drilldown (Eon→Era→Period→Epoch) + cosmic milestones timeline |

As of refactor_4 Fase 1 slice 2, the top-level Timescales tabs are driven by the new `src/ui/Tabs` primitive backed by `@radix-ui/react-tabs`. `GeoCosmicExplorer` now reuses the same primitive for its local `Geological / Cosmic` sub-tabs.

Data: `public/data/geological-eras.json` (hook: `useGeologicalEras`) and `public/data/timescale-phenomena.json` (hook: `useTimescalePhenomena`) — fetched once with module-level `_cache`.

### Milestones perspectives tabs

As of refactor_4 Fase 1 slice 3, the perspectives tabs in `src/pages/Milestones.tsx` also use `src/ui/Tabs`.

Important behavior preserved during migration:

- progressive unlock via `pref_unlockedPerspectives`
- locked tabs remain discoverable and clickable
- `activationMode="manual"` avoids accidental activation/unlock on keyboard focus alone
- the mobile `perspectives-panel__toggle` remains outside the tabs primitive

### Fase 1 completion status

Refactor 4 Fase 1 is considered complete in the current codebase.

What now runs through `src/ui` in active runtime surfaces:

- `Settings`
- `BirthDatePicker`
- `Landing` actions and DOB warning banner
- `Milestones` perspectives tabs
- `Milestones` DOB-missing banner/actions
- `Timescales` top-level tabs
- `GeoCosmicExplorer` sub-tabs
- `ErrorBoundary` fallback action

Cleanup already started after replacement:

- legacy `.tabs/.tab*` selectors removed from active shared CSS
- legacy `.status-banner*` selectors removed from active shared CSS
- local bridges from page CSS to `.button` reduced where surfaces now use `ui-button`

### Fase 2 current status

Refactor 4 Fase 2 is active and verified through slice 2, but not yet complete.

What now exists in the current timeline stack:

- `Timeline` consumes `buildTimelineScene` from `timeline-core`
- `timeline-core/interaction.ts` emits reusable selection payloads + interactive targets
- `TimelineGlobalLaneCanvas` owns the global-lane visual backdrop
- `TimelineGlobalLaneOverlay` owns keyboard/focus/click selection on the global lane
- the `personal` lane intentionally remains on the DOM marker path in this slice
- component-level tests now cover the global overlay path via `@testing-library/react` + `jsdom`

### Scale overlay

`scaleOverlay.tsx` — "But how much is it?" popup:
- Eased animated counter
- Dot-grid visualisation (max 360 dots)
- Real-world equivalences (e.g., "3.2 Camp Nou stadiums", "0.8 brains worth of neurons")
- Scales: count, volume (L), mass (kg), distance (m), time (s), money (€)

### Number formatting

`utils/format.ts`:
- `formatNice` — "1.5 million", "2 billion"
- `formatBig` — exponential for ≥ 1e15
- `formatSmall` — leading-zero for tiny fractions
- `formatDisplay` — auto-selects based on magnitude

`utils/formatDuration.ts`:
- `formatDuration(s)` — femtoseconds to Gyr
- `formatMya(mya)` — Ga / Ma / ka / Present
- `formatMyaDuration(mya)` — geological span
- `formatRatioValue(ratio)` — human-readable ratio

---

## Conventions & patterns

- **Functional components only** — no class components.
- **Custom hooks** for reusable logic. Data hooks use module-level `_cache` — fetches survive React remounts.
- **No path aliases** — all imports use relative paths.
- **`src/components/unused/`** excluded from TS compilation but still imported at runtime. Do not delete.
- **Italian strings** only in wizard month names; rest of UI is English.
- CSS follows BEM-like naming (`timeline__filter-section__label`, `ts-explorer__detail`).
- **`localStorage` keys:** `"dob"`, `"dobTime"`, `"pref_scaleMode"`, `"pref_eventCategories"`, `"pref_show3D"`, `"pref_timescalesTab"`.

---

## Testing

| File | What is tested |
|---|---|
| `src/tests/aboutLinks.test.ts` | help-link targets for About deep links |
| `src/tests/buildRenderItems.test.ts` | grouping + edge marker behavior |
| `src/tests/buildTimelineInteraction.test.ts` | interaction target contract, selection payloads, aria metadata |
| `src/tests/buildTimelineScene.test.ts` | scene builder lane split, focus clamping, grouping reuse |
| `src/tests/timelineGlobalOverlay.test.tsx` | global overlay activation, detail panel wiring, axis click invariants |
| `src/tests/format.test.ts` | `formatNice`, `formatBig`, `formatSmall` |
| `src/tests/globalLaneNotice.test.ts` | loading / empty / error semantics for the world lane |
| `src/tests/profileCompleteness.test.ts` | Settings/profile completeness warnings |
| `src/tests/scaleTransform.test.ts` | math helpers, zoom, range and tick generation |
| `src/tests/timelineSemantics.test.ts` | lane/semantic timeline invariants |

```bash
npm test
```

---

## Deployment

Deployed on **Vercel**. Build: `tsc -b && vite build` → `dist/` (static SPA).  
`@vercel/analytics` is active. `@vercel/speed-insights` is installed but not mounted in current runtime code.

Bundle sizes (gzip, approximate):
- Main JS: ~87 kB
- Main CSS: ~14 kB
- `three-vendor` (lazy, 3D only): ~307 kB

---

## Gotchas & notes

1. **`src/components/unused/`** is excluded from TypeScript. The whole folder is not safe to delete in one shot because `constants.ts` still leaks via a `Unit` type import in `useMilestone.ts`.
2. **`@react-three/*`** are actively used in `src/components/3d/`. They are lazy-loaded — do not move them into eager imports.
3. **`framer-motion`** is actively used in `Timeline`, `TimelineDetailPanel`, `SubTimeline` and `scaleOverlay`.
4. **BirthDateWizard** exists in the repo but is not part of the mounted runtime surface.
5. **`/personalize`** is now a compatibility redirect to `/settings`, not an active product page.
6. **`EventCategory` colors in `CATEGORY_META`** (`types/events.ts`) are the single source of truth for historical event dot colors AND filter chip colors. Keep them in sync.
7. **Ctrl+scroll hint** (`.timeline__ctrl-scroll-hint`) is hidden on `≤ 720px` — irrelevant on touch.
8. **`scaleTransform.ts`** is the single source of truth for all timeline math (ratio, zoom, ticks). Never duplicate its logic.
9. For new shared form/actions surfaces, prefer `src/ui/` primitives over legacy `.button` / page-scoped field wrappers. The old `.button` class still carries contextual spacing assumptions and should not be the default for refactor_4 work.
10. For new tab systems, prefer `src/ui/Tabs` over legacy `.tabs/.tab` markup. The legacy classes may still style older surfaces, but new work should use the headless primitive first.
11. In `Milestones`, locked perspectives are intentionally **not** disabled. That UX is deliberate: users must be able to discover and activate them to unlock the next perspective layer.
12. `.button*` base styles still exist only because the `unused/` legacy branch has not been pruned yet. Treat them as cleanup debt, not as the preferred active runtime button system.


