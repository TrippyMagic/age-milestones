# Kronoscope

[Live Demo](https://age-milestones-live.vercel.app/)

## Project Purpose

Kronoscope is a React 19 + Vite application that helps you visualise your life from unusual perspectives. Enter a birth date and explore your lifetime through dozens of lenses — from classic years and heartbeats, to cosmic timescales, geological eons, and an interactive historical timeline that places your life alongside 48 world events from 1905 to today.

### Features

- **6 perspective tabs** — Classic, Biological, Everyday, Nerdy, Cosmic, Eons
- **Interactive 2D timeline** — pan, zoom (Ctrl+scroll), linear/logarithmic scale, per-category event filters
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
