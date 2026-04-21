# Kronoscope

[Live Demo](https://age-milestones-live.vercel.app/)

## Project Purpose

Kronoscope is a React 19 + Vite application that helps you visualise your life from unusual perspectives. Enter a birth date and explore your lifetime through dozens of lenses — from classic years and heartbeats, to cosmic timescales, geological eons, and a two-lane time map that places your life alongside curated past events, global reference markers, and future projections.

### Features

- **6 perspective tabs** — Classic, Biological, Everyday, Nerdy, Cosmic, Eons
- **Interactive 2D timeline** — pan, zoom (Ctrl+scroll), Personal + Global lanes, per-category global filters
- **Future projections dataset** — separate editorial layer for scheduled, astronomical, forecast, and speculative events with explicit confidence labels
- **Mobile-first timeline surface** — sticky navigation, stronger timeline framing, fewer nested scroll areas, and local fallbacks before the global error boundary
- **Central Settings page** — one place for birth date, personal metrics, lifestyle modifiers, and the data that refines estimate ranges
- **DOB guardrails** — explicit blocking states when birth date is missing, plus reliability warnings when optional profile details are incomplete
- **Optional 3D timeline** — WebGL-powered (Three.js, lazy-loaded)
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
