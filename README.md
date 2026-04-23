# Kronoscope

[Live Demo](https://kronoscope.vercel.app/)

## Project Purpose

Kronoscope is a React 19 + Vite application that helps you visualise your life from unusual perspectives. Enter a birth date and explore your lifetime through dozens of lenses — from classic years and heartbeats, to cosmic timescales, geological eons, and a two-lane time map that places your life alongside curated past events, global reference markers, and future projections.

### Features

- **6 perspective tabs** — Classic, Biological, Everyday, Nerdy, Cosmic, Eons
- **Interactive 2D timeline** — pan, zoom (Ctrl+scroll), Personal + Global lanes, per-category global filters, and edge-aware grouping for offscreen markers
- **Future projections dataset** — separate editorial layer for scheduled, astronomical, forecast, and speculative events with explicit confidence labels
- **Mobile-first timeline surface** — sticky navigation, stronger timeline framing, fewer nested scroll areas, and local fallbacks before the global error boundary
- **Responsive layout audit completed** — primary surfaces now prefer `max-width`, flex/grid layouts, and breakpoint-based wrapping instead of rigid fixed-width containers
- **Shared page alignment** — top-level pages now use the same root gutter strategy, keeping cards and content surfaces visually aligned with the sticky navbar
- **Central Settings page** — one place for birth date, personal metrics, lifestyle modifiers, and the data that refines estimate ranges
- **Initial UI system slice** — `Settings` and the shared DOB flow now run on a first internal `src/ui/` primitive layer (`Button`, `Banner`, `Field`, `Panel`, `FormActions`)
- **Headless tab migration started** — `Timescales` and the `GeoCosmicExplorer` sub-tabs now use the new `src/ui/Tabs` primitive backed by Radix Tabs
- **Milestones perspectives tabs migrated** — the progressive-unlock tab system in `Milestones` now uses the same `src/ui/Tabs` layer while preserving onboarding, unlock state, and mobile collapse behavior
- **Phase 1 UI migration completed** — active high-friction surfaces now run on `src/ui`, and the first safe cleanup of legacy tabs/banner CSS has started
- **Phase 2 timeline completed** — the 2D timeline now runs on `src/components/timeline-core/` scene + interaction contracts, a shared `Canvas + accessible overlay` renderer for both lanes, and canvas-native pointer hit-testing with keyboard-safe overlay controls
- **Timeline integration coverage expanded** — the shared overlay/canvas path is protected by `@testing-library/react` + `jsdom` tests for personal/global activation, keyboard semantics, detail panel wiring, target hit-testing, and bare-axis pointer selection fallback
- **Phase 3 slices 1–5 verified** — `Timescales` overview now has a dedicated filter shell and pinned detail fallback, `GeoCosmicExplorer` adds stronger breadcrumb/back semantics plus mobile-safe detail flow, the comparator now has a keyboard-safe accessible search flow with duplicate exclusion and dedicated RTL coverage, the shared DOB/Settings surfaces are mobile-hardened with synced summary + guardrails, and `Timescales` absolute-log mapping now converges on shared pure helpers in `src/utils/temporalScale.ts`
- **Phase 4 slice 1 verified** — the experimental 3D timeline now consumes a pure `buildTimeline3DScene` adapter from `src/components/timeline-core/`, aligning lane order, focus clamping, tick thinning, and marker projection without yet forcing a shared 2D/3D selection contract
- **Phase 4 slice 2 verified** — the experimental 3D runtime now shares a dedicated `src/components/3d/runtimePolicy.ts` contract for WebGL availability, quality-profile selection, renderer budgets, and toggle copy across `Timeline3DWrapper`, `Timeline3D`, and `Milestones`
- **DOB guardrails** — explicit blocking states when birth date is missing, plus reliability warnings when optional profile details are incomplete
- **Optional 3D timeline** — WebGL-powered (Three.js, lazy-loaded), lane-aware, and automatically reduced to a low-power profile on mobile / reduced-motion devices
- **Personal milestone markers stay personal** — markers such as `10,000 days old`, `500 months old`, and `1 billion seconds old` remain on the Personal lane instead of mixing with global events
- **Global lane state is explicit** — Milestones no longer shows a false “no global items” warning while historical/projected datasets are still loading; loading, error, and truly empty states are separated
- **Timescales page** — log-scale overview from Planck time to heat death, phenomenon comparator, geological/cosmic explorer
- **Scale overlay** — "But how much is it?" popup with real-world equivalences

## Development

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

The app will be available at the local Vite dev server address.

## Build and Preview

To create a production build and preview it locally:

```bash
npm run build
npm run preview
```

## Testing

Run the unit tests with:

```bash
npm test
```

### Verified baseline snapshot (2026-04-23)

- `npm test -- --run` → **116 tests passed across 18 files**
- `npm run build` → **production build succeeds**
- `npm run lint` → **passes with 1 non-blocking warning** in `src/context/UserProfileContext.tsx`

## Architecture Roadmaps

Current refactor planning documents live under `refactor_docs/`:

- `refactor_docs/refactor_3/PLAN.md` — completed roadmap for the current product baseline
- `refactor_docs/refactor_4/PLAN.md` — current structural refactor plan focused on UI system stabilization, timeline 2D redesign, Timescales convergence, and cleanup/testing hardening
- `refactor_docs/refactor_4/DECISIONS.md` — decision log for the architectural choices introduced by Refactor 4
- `refactor_docs/refactor_4/AUDIT_SUMMARY.md` — phase 0 audit inventory (`active / legacy / orphan / candidate removal`) and cleanup boundary
- `refactor_docs/refactor_4/ARCHITECTURE_BASELINE.md` — verified runtime architecture snapshot used to start Refactor 4 implementation

Current implementation status:

- phase 0 completed and documented
- phase 1 completed with `src/ui` adopted across active form/banner/actions/tabs surfaces
- phase 2 completed with `src/components/timeline-core/`, unified `TimelineSceneCanvas` + `TimelineInteractiveOverlay`, canvas-native pointer hit-testing, personal/global lane parity on the new overlay model, pruning of `SubTimeline`, and removal of legacy timeline `scaleMode`
- phase 3 completed through five verified slices: overview hardening, `GeoCosmicExplorer` detail/mobile semantics hardening, comparator search/accessibility hardening, cross-page mobile consistency for `Settings` + the shared DOB flow, and low-risk shared temporal helpers for absolute-log mapping/formatting in `Timescales`
- phase 4 has progressed through two verified slices: `src/components/timeline-core/buildTimeline3DScene.ts` centralizes the pure 3D scene adapter, while `src/components/3d/runtimePolicy.ts` now centralizes availability, profile budgets, and toggle/fallback copy for the experimental 3D runtime
- `src/utils/temporalScale.ts` now hosts the shared absolute-log ratio/percent helpers and small exponent formatter used by the migrated `Timescales` consumers
- 2D/3D selection convergence is still deferred: the new slice aligns scene math first and leaves `selectionKey`/detail-inspector semantics untouched for now
- `src/pages/Settings.tsx` and `src/components/BirthDatePicker.tsx` are the first migrated runtime surfaces
- `src/pages/Timescales.tsx` and `src/components/timescales/GeoCosmicExplorer.tsx` are the first migrated tab systems
- `src/pages/Milestones.tsx` now uses the same tabs system for the perspectives panel, including progressive unlock behavior
- `src/pages/Landing.tsx`, the DOB-gated banner/actions in `Milestones`, and the global `ErrorBoundary` fallback now also use the new UI primitives

