# REFACTOR_IDEA.md — Age Milestones

> Generato il 13 marzo 2026 dopo l'analisi completa della codebase.

---

## Sommario esecutivo

La codebase è un monolite leggero (~2.5 k LoC attivi) che funziona bene ma mostra i segnali tipici di una crescita organica non pianificata: un CSS da 1 957 righe in un unico file, una `Timeline.tsx` da 879 righe che mescola logica di viewport, rendering, pan/zoom e sub-timeline, un solo context per lo stato globale, e due pagine completamente vuote (`Timescales`, `Personalize`). Le quattro feature richieste — eventi storici, scala log/lin, 3D opzionale, sezione Timescales — richiedono tutti lo stesso prerequisito: separare le responsabilità prima di aggiungere funzionalità.

---

## Stato attuale snapshot (pre-refactoring)

| File / Area                     | Righe | Note                                                                       |
|---------------------------------|-------|----------------------------------------------------------------------------|
| `src/css/index.css`             | 1 957 | Monolite: variabili, reset, layout, tutti i componenti                     |
| `src/components/Timeline.tsx`   |   879 | Viewport + pan/zoom + rendering eventi + sub-timeline tutto insieme        |
| `src/pages/Milestones.tsx`      |   197 | `buildTimelineData` hardcoded, import CSS duplicato                        |
| `src/pages/Timescales.tsx`      |    33 | Solo 3 `MockCard`                                                          |
| `src/pages/Personalize.tsx`     |    ~  | Solo 3 `MockCard`                                                          |
| `src/context/BirthDateContext`  |    50 | Solo birth date/time — nessun posto per preferenze utente                  |
| `src/components/unused/`        |    ~  | Escluso da TS ma importato a runtime — fragile                             |
| `package.json` (R3F)            |    —  | `@react-three/fiber` + `drei` + `rapier` presenti ma zero import attivi    |

---

## Aree di refactoring identificate

### R-1 — CSS: Da monolite a moduli tematici ✅ COMPLETATO

**Prima:** 1 957 righe in `index.css`  
**Dopo:** `index.css` (globals ~150 righe) + 6 moduli tematici

| Nuovo file              | Responsabilità                                              |
|-------------------------|-------------------------------------------------------------|
| `components.css`        | Card, bottoni, form, chip, tab, age-table, sezioni, about   |
| `timeline.css`          | Tutte le classi `.timeline__*` e `.timeline-card`           |
| `navbar.css`            | `.app-navbar__*` e `.footer`                                |
| `wizard.css`            | `.birth-wizard__*` e overlay landing                        |
| `scale-overlay.css`     | `.scale-overlay__*` e `.count-scene__*`                     |
| `timescales.css`        | Placeholder per la nuova sezione Timescales                 |

**Benefit:** Ogni sviluppatore sa esattamente dove cercare uno stile. Nessuna regressione in produzione poiché `index.css` usa `@import` per caricare tutti i moduli.

---

### R-2 — State: Da singolo a doppio Context ✅ COMPLETATO

**Prima:** Solo `BirthDateContext` (date + time)  
**Dopo:** `BirthDateContext` (immutato) + `PreferencesContext` (nuovo)

```
PreferencesContext
├── scaleMode: "linear" | "log"          ← Phase 2
├── activeCategories: Set<EventCategory> ← Phase 1 (già attivo)
├── show3D: boolean                       ← Phase 5 (stub)
└── timescalesTab: string                 ← Phase 3
```

**Persistenza:** Tutte le preferenze salvate in `localStorage` con chiavi prefissate `pref_*`.  
**No Redux/Zustand:** Con 2 context e ~5 valori totali non serve alcuna libreria esterna.

---

### R-3 — Data layer: Da hardcoded a JSON fetch ✅ COMPLETATO

**Prima:** 6 eventi personali hardcoded in `buildTimelineData()` dentro `Milestones.tsx`  
**Dopo:**
- `public/data/historical-events.json` — 48 eventi curati (1905–2025)
- `src/hooks/useHistoricalEvents.ts` — fetch + cache in-memory (una sola richiesta per sessione)
- `src/types/events.ts` — tipi `HistoricalEventRaw`, `HistoricalEventParsed`, `EventCategory`

**Architettura fetch:**
```
Primo render → fetch("/data/historical-events.json")
             → parseEvents() (date ISO → timestamp ms)
             → _cache = [...] (module-level)
Render successivi → _cache già popolata, nessun fetch
```

**Scelta JSON in `public/`:** Gli eventi sono statici, serviti come asset, nessun server necessario. Per >500 eventi valutare route API Vercel + virtualizzazione.

---

### R-4 — Timeline.tsx: Decomposizione (da fare — Phase 0b)

**Stato attuale:** 879 righe monolitiche  
**Obiettivo:** 5 moduli con responsabilità singola

```
src/components/timeline/
├── index.ts             ← re-export pubblico
├── TimelineRoot.tsx     ← layout container, pan/zoom state, viewport
├── TimelineAxis.tsx     ← rendering asse, ticks (supporterà scala log)
├── TimelineEvents.tsx   ← rendering eventi, grouping logic
├── SubTimeline.tsx      ← estratto da Timeline.tsx (già quasi autonomo)
└── TimelineControls.tsx ← zoom buttons + future scale switcher
```

**Impatto:** Alto blast radius. Richiede test di regressione visiva prima di iniziare. **Bloccante per la feature scala log/lin (Phase 2).**

---

### R-5 — `src/components/unused/`: Migrazione graduale (bassa priorità)

**Problema:** `constants.ts` (con `landingIntro`, `Unit` type) è escluso da TS ma importato a runtime da `Landing.tsx`, `About.tsx`, `useMilestone.ts`. Se il file viene rinominato o spostato, il build si rompe silenziosamente.

**Soluzione:** Spostare `landingIntro` in `src/data/landingContent.ts` e `Unit` type in `src/types/time.ts`. Aggiornare le importazioni. Non urgente — non blocca nessuna feature in roadmap.

---

### R-6 — Bundle: Lazy loading per R3F (da fare — Phase 5)

**Problema attuale:** `@react-three/fiber`, `drei` e `rapier` sono in `dependencies` ma zero import attivi → il loro tree-shaking è parziale ma rischioso.

**Soluzione:**
```typescript
// Vite chunk splitting
build: {
  rollupOptions: {
    output: {
      manualChunks: { "three-vendor": ["three", "@react-three/fiber", "@react-three/drei"] }
    }
  }
}

// React lazy loading
const Timeline3D = React.lazy(() => import("./components/3d/Timeline3D"));
```

**Non fare adesso.** Attendere validazione utente della feature 3D.

---

## Pattern identificati da standardizzare

| Pattern attuale                             | Standard consigliato                             |
|---------------------------------------------|--------------------------------------------------|
| Mix IT/EN nelle label (`cucchiaino`, `battito`) | Decidere una lingua. Consiglio: EN per il codice, IT per le label visualizzate |
| `clamp` ridefinita in Timeline.tsx e Milestones.tsx | Estrarre in `src/utils/math.ts`                 |
| Utility classes usate come stringhe (`inline-flex items-center`) | Definite in `index.css` section 5 ✅           |
| `"use client"` in `scaleOverlay.tsx` (Next.js directive) | Rimuovere — questo è Vite, non Next.js          |

---

## Debito tecnico tracciato

| ID   | Descrizione                                         | Priorità | Bloccante per   |
|------|-----------------------------------------------------|----------|-----------------|
| DT-1 | Timeline.tsx decomposizione (R-4)                  | Alta     | Phase 2 (scala) |
| DT-2 | Migration `unused/` (R-5)                          | Bassa    | —               |
| DT-3 | Lazy loading R3F (R-6)                             | Alta     | Phase 5 (3D)    |
| DT-4 | Rimuovere `"use client"` da scaleOverlay.tsx       | Bassa    | —               |
| DT-5 | `clamp` duplicata → `src/utils/math.ts`            | Bassa    | —               |
| DT-6 | Test copertura Timeline e Milestones               | Media    | Phase 2         |

---

## Decisioni architetturali prese (2026-03-13)

1. **CSS split** → `@import` da `index.css` (non CSS Modules, non styled-components)
2. **Data fetch** → JSON statico in `public/data/` con cache module-level
3. **State** → doppio Context, nessuna libreria esterna (Zustand rimandato)
4. **Typescript strict** → mantenuto, nessun `any` aggiunto

---

*Questo documento va aggiornato ad ogni refactoring significativo.*

