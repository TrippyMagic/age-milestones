# CLAUDE.md — Age Milestones

## Project overview

Age Milestones is a React 19 + TypeScript SPA built with Vite that lets users enter their birth date (and optionally time) and explore their lifetime expressed through unusual units and perspectives. The live deployment is on Vercel.

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
| Animation | `framer-motion` v12 |
| 3D (unused/experimental) | `@react-three/fiber`, `@react-three/drei`, `@react-three/rapier` |
| Analytics | `@vercel/analytics` |
| Linting | ESLint 9 flat config (`typescript-eslint`, `react-hooks`, `react-refresh`) |
| Testing | Vitest |
| Styling | Plain CSS (no CSS-in-JS, no Tailwind; utility classes are manually defined) |

---

## Quick commands

```bash
npm install          # install dependencies
npm run dev          # start Vite dev server (HMR)
npm run build        # tsc type-check + Vite production build → dist/
npm run preview      # preview the production build locally
npm run lint         # run ESLint across the project
npm test             # run Vitest unit tests
```

---

## Project structure

```
age-milestones/
├── index.html                    # SPA entry point
├── vite.config.ts                # Vite config (react plugin)
├── tsconfig.json                 # TS project references
├── tsconfig.app.json             # App TS config (strict, ES2020, excludes src/components/unused)
├── tsconfig.node.json            # Node-side TS config (vite.config)
├── eslint.config.js              # ESLint flat config
├── public/                       # Static assets (bg-time.png, vite.svg)
└── src/
    ├── main.tsx                  # App bootstrap: BrowserRouter + routes
    ├── vite-env.d.ts             # Vite client types
    ├── css/
    │   ├── index.css             # Global styles
    │   └── Landing.css           # Landing-specific styles
    ├── context/
    │   └── BirthDateContext.tsx   # React Context for birth date/time (persisted in localStorage)
    ├── hooks/
    │   ├── useBirthWizard.ts     # Opens/closes the birth-date wizard + saves data to context
    │   ├── useMilestone.ts       # Milestone calculation logic (used in Milestones page)
    │   ├── useElementSize.ts     # ResizeObserver-based hook for element dimensions
    │   └── useOutsideClick.ts    # Detects clicks outside a ref'd element
    ├── pages/
    │   ├── Landing.tsx           # Home: intro text + "Dive in" CTA → opens wizard
    │   ├── Milestones.tsx        # Main page: perspective tabs + AgeTable + Timeline
    │   ├── Timescales.tsx        # Placeholder page (mock cards)
    │   ├── Personalize.tsx       # Placeholder page (mock cards)
    │   └── About.tsx             # About page (renders remaining intro paragraphs)
    ├── components/
    │   ├── BirthDateWizard.tsx   # Multi-step wizard (year → month → day → hour)
    │   ├── AgeTable.tsx          # Real-time ticking table of age in various units
    │   ├── Timeline.tsx          # Interactive SVG/HTML timeline with events, ticks, sub-timelines
    │   ├── scaleOverlay.tsx      # "But how much is it?" modal with dot-grid visualisation
    │   └── common/
    │       ├── Headers.tsx       # <Title> and <Navbar> components
    │       ├── Footer.tsx        # Page footer with credits
    │       ├── MockCard.tsx      # Placeholder card for WIP pages
    │       └── scaleHint.tsx     # "?" button that opens the scale overlay
    ├── components/unused/        # Excluded from TS compilation (tsconfig.app.json)
    │   ├── constants.ts          # TIME_UNITS, PRESETS, landingIntro text
    │   ├── MilestonePicker.tsx
    │   ├── MorePanel.tsx
    │   ├── ResultBlock.tsx
    │   └── TimezoneSelect.tsx
    ├── utils/
    │   ├── format.ts             # Number formatters (formatNice, formatBig, formatSmall, formatDisplay)
    │   ├── perspectivesConstants.ts  # TAB_ROWS: perspective tabs (Classic, Biological, Everyday, Nerdy, Cosmic, Eons)
    │   └── scaleConstants.ts     # SCALES, equivalence builders, KIND_BY_LABEL mapping
    └── tests/
        └── format.test.ts        # Vitest tests for format utilities
```

---

## Architecture & key concepts

### Routing

Five client-side routes defined in `main.tsx`:

| Path | Page | Status |
|---|---|---|
| `/` | Landing | ✅ Complete |
| `/milestones` | Milestones | ✅ Complete (main feature) |
| `/timescales` | Timescales | 🚧 Placeholder (MockCards) |
| `/personalize` | Personalize | 🚧 Placeholder (MockCards) |
| `/about` | About | ✅ Complete |

### State management

- **`BirthDateContext`** — single React Context providing `birthDate`, `setBirthDate`, `birthTime`, `setBirthTime`. Both values are persisted in `localStorage` (`"dob"` and `"dobTime"` keys).
- No external state library (Redux, Zustand, etc.); all state is local or context-based.

### Birth date wizard

`BirthDateWizard` is a 4-step form (year → month → day → hour) rendered as a modal dialog. The `useBirthWizard` hook manages open/close state and body scroll locking. Months are labelled in Italian.

### Perspectives & AgeTable

The `Milestones` page features tabbed perspectives defined in `perspectivesConstants.ts`:

- **Classic** — Years, Months, Weeks, Days, Hours, Minutes, Seconds, Nanoseconds
- **Biological** — Breaths, Heartbeats, Blood pumped, Calories, Dog years, etc.
- **Everyday** — Steps, Words spoken, Showers, Laughs, etc.
- **Nerdy** — Smartphone unlocks, Keystrokes, Bitcoin blocks, etc.
- **Cosmic** — Lunar cycles, Martian years, Jovian years, Galactic motion km, etc.
- **Eons** — Universe age portion, Earth age portion, Homo sapiens portion, etc.

`AgeTable` re-calculates all values every second via `setInterval`, producing a live-ticking counter effect. Special "Dog years" logic uses a piecewise formula (AKC-style).

### Timeline

A rich interactive timeline component (`Timeline.tsx`, ~670 lines) featuring:
- Draggable slider / range input
- Automatic event grouping when markers overlap (configurable gap threshold)
- Expandable sub-timelines for grouped events
- Tick generation (decade-based)
- Above/below placement of event labels

### Scale overlay

`scaleOverlay.tsx` renders a "But how much is it?" popup with:
- Animated counter (eased number interpolation)
- Dot-grid visualisation (max 360 dots)
- Real-world equivalences (e.g., "3.2 Camp Nou stadiums", "0.8 brains worth of neurons")
- Scales for: count, volume (L), mass (kg), distance (m), time (s), money (€)

### Number formatting

`utils/format.ts` provides:
- `formatNice` — human-readable large numbers ("1.5 million", "2 billion")
- `formatBig` — exponential notation for ≥ 1e15
- `formatSmall` — leading-zero representation for very small fractions
- `formatDisplay` — combines the above based on magnitude

---

## Conventions & patterns

- **Functional components only** — no class components.
- **Custom hooks** for reusable logic (`useBirthWizard`, `useMilestone`, `useElementSize`, `useOutsideClick`).
- **No path aliases** — imports use relative paths (`../`, `./`).
- **`src/components/unused/`** is explicitly excluded from TS compilation in `tsconfig.app.json`. Code there is legacy/experimental and still imported at runtime via JS (e.g., `landingIntro` from `constants.ts`).
- **Italian strings** appear in the wizard month names and some scale labels; the rest of the UI is in English.
- CSS follows a BEM-like naming convention (e.g., `birth-wizard__panel`, `scale-overlay__header`, `app-navbar__brand`).
- **`localStorage`** keys: `"dob"` (ISO date string), `"dobTime"` (HH:mm string).

---

## Testing

Tests live in `src/tests/` and use **Vitest**. Currently there is one test file (`format.test.ts`) covering `formatNice`, `formatBig`, and `formatSmall`.

Run with:
```bash
npm test
```

---

## Deployment

The app is deployed on **Vercel** with `@vercel/analytics` integrated. The build command is `tsc -b && vite build`, producing a static SPA in `dist/`.

---

## Gotchas & notes

1. **`src/components/unused/`** is excluded from TypeScript compilation but files there are still imported at runtime (e.g., `landingIntro`, `Unit` type). Removing or renaming these files will break imports in `Landing.tsx`, `About.tsx`, and `useMilestone.ts`.
2. **`@react-three/*` packages** are declared as dependencies but currently not imported anywhere in active code — likely reserved for future 3D features.
3. **`date-fns`** is a dependency but the codebase primarily uses `dayjs`. Both coexist.
4. **`SpeedInsights`** import is commented out in `main.tsx`.
5. **Timescales** and **Personalize** pages are stubs showing only `MockCard` placeholders.
6. The BirthDateWizard does not validate that the chosen date is not in the future; all validation is per-step (year range, month 1–12, day 1–daysInMonth, hour 0–23).

