# AGENTS.md — Kronoscope

> Reference document for AI agents and contributors.
> Last updated: 22 aprile 2026 — post-refactor_3, with refactor_4 planning baseline added.

## Project overview

Kronoscope is a React 19 + TypeScript SPA built with Vite that lets users enter their birth date (and optionally time) and explore their lifetime expressed through unusual units, perspectives, and timescales. The live deployment is on Vercel.

> **Planning status note (2026-04-22):** parts of this document are historical and may lag behind the latest implementation details. The authoritative roadmap documents are:
> - `refactor_docs/refactor_3/PLAN.md` — completed roadmap for the current product baseline
> - `refactor_docs/refactor_4/PLAN.md` — current structural refactor baseline
> - `refactor_docs/refactor_4/DECISIONS.md` — ADR / decision log for refactor_4

**Live demo:** <https://age-milestones-live.vercel.app/>

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | React 19 (`react`, `react-dom`) |
| Language | TypeScript 5.7 (strict mode) |
| Bundler / Dev server | Vite 6 with `@vitejs/plugin-react` |
| Routing | `react-router-dom` v7 (BrowserRouter, declarative `<Routes>`) |
| Date handling | `dayjs` (with `duration` and `utc` plugins), `date-fns` |
| Animation | `framer-motion` v12 (declared, not yet used in active code) |
| 3D | `@react-three/fiber` v9, `@react-three/drei` v10, `@react-three/rapier` v2 (lazy-loaded, excluded from main bundle) |
| Analytics | `@vercel/analytics` v1 |
| Linting | ESLint 9 flat config (`typescript-eslint`, `react-hooks`, `react-refresh`) |
| Testing | Vitest v1 |
| Styling | Plain CSS (no CSS-in-JS, no Tailwind; 8 thematic modules via `@import`) |

---

## Quick commands

```bash
npm install          # install dependencies
npm run dev          # start Vite dev server (HMR)
npm run build        # tsc type-check + Vite production build → dist/
npm run preview      # preview the production build locally
npm run lint         # run ESLint across the project
npm test             # run Vitest unit tests (45 tests across 2 files)
```

---

## Project structure

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
│       └── DECISIONS.md             # ADR log for refactor_4
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
    ├── css/
    │   ├── index.css                # Global entry: @import all modules + reset + CSS tokens
    │   ├── components.css           # Shared UI: cards, buttons, tabs, age-table, chips
    │   ├── Landing.css              # Landing page specific styles
    │   ├── navbar.css               # Navbar + footer
    │   ├── scale-overlay.css        # "But how much is it?" overlay
    │   ├── timeline.css             # All .timeline__* + filter card + Ctrl+scroll hint + responsive
    │   ├── timeline3d.css           # 3D timeline canvas + HTML overlays
    │   ├── timescales.css           # Timescales page (overview, comparator, explorer)
    │   └── wizard.css               # Birth date wizard
    ├── context/
    │   ├── BirthDateContext.tsx     # birthDate + birthTime (localStorage: "dob", "dobTime")
    │   └── PreferencesContext.tsx   # scaleMode, activeCategories, show3D, timescalesTab (pref_*)
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
    │   ├── Landing.tsx              # Home: intro text + "Dive in" CTA → wizard
    │   ├── Milestones.tsx           # Main page: AgeTable + Timeline (2D/3D) + category filters
    │   ├── Timescales.tsx           # ✅ Full: Overview + Comparator + Geo/Cosmic Explorer
    │   ├── Personalize.tsx          # 🚧 Placeholder (3 × MockCard)
    │   └── About.tsx                # About page (landingIntro paragraphs)
    ├── components/
    │   ├── AgeTable.tsx             # Live-ticking table (1 s interval, all 6 perspectives)
    │   ├── BirthDateWizard.tsx      # 4-step modal: year → month → day → hour
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
    │   │   ├── Timeline.tsx         # Viewport state, pan/zoom, hover, Ctrl+scroll, render
    │   │   ├── EventElement.tsx     # Dot marker + hover label; uses event.color ?? accent
    │   │   ├── SubTimeline.tsx      # Expandable grouped-events panel
    │   │   ├── TimelineControls.tsx # +/−/↺ zoom, Lin/Log toggle, Ctrl+scroll hint label
    │   │   ├── buildRenderItems.ts  # Grouping + left-percent positioning logic
    │   │   ├── index.ts             # Public barrel (default + TimelineEvent + types)
    │   │   └── types.ts             # TimelineEvent (color?), Accent, RenderItem, consts
    │   ├── timescales/
    │   │   ├── EraCard.tsx          # Era card with linear proportional bar
    │   │   ├── GeoCosmicExplorer.tsx# Geological drilldown + cosmic milestones sub-tabs
    │   │   ├── PhenomenaComparator.tsx # Two-phenomenon comparison with absolute log bars
    │   │   ├── PhenomenaSearch.tsx  # Search + category-filter picker for phenomena
    │   │   └── TimescaleOverview.tsx# Vertical SVG log ruler, collision-aware labels
    │   └── unused/                  # Excluded from TS compilation; still imported at runtime
    │       ├── constants.ts         # TIME_UNITS, PRESETS, landingIntro (imported by Landing/About)
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
| `/personalize` | Personalize | 🚧 Placeholder (3 × MockCard) |
| `/about` | About | ✅ Complete |

### State management

Two React Contexts (no external state library):

- **`BirthDateContext`** — `birthDate`, `setBirthDate`, `birthTime`, `setBirthTime`. Persisted in `localStorage` (`"dob"`, `"dobTime"`).
- **`PreferencesContext`** — `scaleMode` ("linear" | "log"), `activeCategories` (Set\<EventCategory\>), `show3D` (boolean), `timescalesTab` ("overview" | "comparator" | "explorer"). Persisted with `pref_*` keys.

Both providers wrap the router in `main.tsx`: `BirthDateProvider` → `PreferencesProvider` → `BrowserRouter`.

### Birth date wizard

`BirthDateWizard` is a 4-step modal (year → month → day → hour). `useBirthWizard` manages open/close and body-scroll lock. Months are labelled in Italian.

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

Decomposed into 5 sub-modules under `src/components/timeline/`:

| Module | Responsibility |
|---|---|
| `Timeline.tsx` | Viewport state, pan/zoom, hover tooltip, Ctrl+scroll zoom, render orchestration |
| `EventElement.tsx` | Single event dot + hover label; `--marker-color` = `event.color ?? accentColors[accent]` |
| `SubTimeline.tsx` | Expandable panel for overlapping grouped events (outside-click to close) |
| `TimelineControls.tsx` | +/−/↺ zoom buttons, Lin/Log toggle, Ctrl+scroll hint label |
| `buildRenderItems.ts` | Event grouping logic + left-percent positioning |

**Scale modes:** Linear (default) and Log — toggled via button, persisted in PreferencesContext. CSS transitions are applied only during the brief mode-switch window (`isScaleSwitching` state).

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

Data: `public/data/geological-eras.json` (hook: `useGeologicalEras`) and `public/data/timescale-phenomena.json` (hook: `useTimescalePhenomena`) — fetched once with module-level `_cache`.

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
| `src/tests/format.test.ts` | `formatNice`, `formatBig`, `formatSmall` |
| `src/tests/scaleTransform.test.ts` | `clamp`, `toPercent`, `linearRatio/Value`, `logRatio/Value`, `valueToRatio`, `ratioToValue`, `applyZoom`, `viewportToRange`, `generateTicks` |

```bash
npm test
```

---

## Deployment

Deployed on **Vercel**. Build: `tsc -b && vite build` → `dist/` (static SPA).  
`@vercel/analytics` active. `@vercel/speed-insights` declared but commented out in `main.tsx`.

Bundle sizes (gzip, approximate):
- Main: ~79 kB
- `three-vendor` (lazy, 3D only): ~307 kB

---

## Gotchas & notes

1. **`src/components/unused/`** is excluded from TypeScript but still imported at runtime (`landingIntro`, `Unit` type). Deleting will break `Landing.tsx`, `About.tsx`, `useMilestone.ts`.
2. **`@react-three/*`** are actively used in `src/components/3d/`. They are lazy-loaded — do not move them into eager imports.
3. **`date-fns`** is installed but not used in active code; `dayjs` is the primary date library.
4. **`framer-motion`** is installed but not imported in active code — reserved for future animations.
5. **`@react-three/rapier`** is installed but has no active usage.
6. **BirthDateWizard** does not validate future dates — all validation is per-step only.
7. **`Personalize`** is the only stub page remaining in the routing.
8. **`EventCategory` colors in `CATEGORY_META`** (`types/events.ts`) are the single source of truth for historical event dot colors AND filter chip colors. Keep them in sync.
9. **Ctrl+scroll hint** (`.timeline__ctrl-scroll-hint`) is hidden on `≤ 720px` — irrelevant on touch.
10. **`scaleTransform.ts`** is the single source of truth for all timeline math (ratio, zoom, ticks). Never duplicate its logic.


