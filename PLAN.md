# PLAN.md — Age Milestones: Implementation Roadmap

> Versione 1.0 — 13 marzo 2026  
> Basato sull'analisi architetturale completa della codebase

---

## Visione generale

Age Milestones diventa una piattaforma di visualizzazione temporale multi-dimensionale: la timeline personale dell'utente viene arricchita con eventi storici contestuali e scale di riferimento cosmologiche/geologiche, con un'interfaccia che sa sia essere poeticamente minimale che scientificamente precisa.

---

## Stato implementazione

| Fase   | Nome                                | Stato            |
|--------|-------------------------------------|------------------|
| Fase 0 | Infrastruttura & refactoring base   | ✅ **COMPLETATA** |
| Fase 1 | Eventi storici nella timeline       | ✅ **COMPLETATA** |
| Fase 2 | Scala lineare / logaritmica         | ✅ **COMPLETATA** |
| Fase 3 | Timescales MVP                      | ✅ **COMPLETATA** |
| Fase 4 | Esploratore geologico/cosmologico   | ⬜ Pianificata    |
| Fase 5 | Modalità 3D (sperimentale)          | ⬜ Rimandato      |

---

## Fase 0 — Infrastruttura & refactoring base ✅

### Obiettivi
- Separare il CSS monolitico in moduli tematici
- Introdurre un contesto per le preferenze utente
- Creare il data layer JSON + hook fetch per gli eventi
- Documentare l'architettura

### Deliverable completati
- [x] `src/css/index.css` → slim entry point con `@import`
- [x] `src/css/components.css` — UI components condivisi
- [x] `src/css/timeline.css` — tutto `.timeline__*`
- [x] `src/css/navbar.css` — navbar + footer
- [x] `src/css/wizard.css` — birth wizard + landing overlay
- [x] `src/css/scale-overlay.css` — scale overlay
- [x] `src/css/timescales.css` — placeholder per Fase 3
- [x] `src/context/PreferencesContext.tsx` — scaleMode, activeCategories, show3D, timescalesTab
- [x] `src/types/events.ts` — `EventCategory`, `HistoricalEventRaw`, `HistoricalEventParsed`
- [x] `public/data/historical-events.json` — 48 eventi curati 1905–2025
- [x] `src/hooks/useHistoricalEvents.ts` — fetch + cache module-level
- [x] `REFACTOR_IDEA.md` + `PLAN.md`
- [x] `src/main.tsx` aggiornato con `PreferencesProvider`
- [x] `src/pages/Milestones.tsx` — import deduplicato + integrazione eventi storici + filtri categoria

### Modello dati introdotto
```typescript
type EventCategory = "historical" | "scientific" | "technological" | "space" | "cultural";

type HistoricalEventRaw = {
  id: string; label: string; date: string; // YYYY-MM-DD
  category: EventCategory; description?: string; placement?: "above" | "below";
};

type HistoricalEventParsed = Omit<HistoricalEventRaw, "date"> & { timestamp: number };
```

### UX considerations
- I filtri categoria appaiono come chip sopra la timeline — visibili ma non invasivi
- Ogni categoria ha un dot colorato consistente con il marker sulla timeline
- La preferenza di filtraggio persiste in `localStorage` tra sessioni

### Performance considerations
- Il JSON viene fetchato una volta sola (cache module-level `_cache`)
- Il filtraggio avviene in un `useMemo` — ricalcolo solo al cambio di categoria o range
- Max ~20 eventi visibili per viewport grazie al filtro `timestamp >= range.start && timestamp <= range.end`

### Definition of Done ✅
- Build TypeScript senza errori
- CSS funzionante (nessuna regressione visiva)
- Eventi storici visibili nella timeline, filtrabili per categoria
- Preferenze persiste tra refresh di pagina

---

## Fase 1 — Timeline.tsx: Decomposizione ✅

> **Prerequisito per Fase 2 (scala log/lin)**

### Obiettivi
- Separare `Timeline.tsx` (879 righe) in 5 moduli con responsabilità singola
- Estrarre `getRatio` in `src/utils/scaleTransform.ts` (predisporre interfaccia pluggable)
- Aggiungere test di regressione prima del refactoring

### Deliverable
- `src/components/timeline/TimelineRoot.tsx` — state viewport, pan/zoom handlers, layout
- `src/components/timeline/TimelineAxis.tsx` — rendering asse, ticks, hover tooltip
- `src/components/timeline/TimelineEvents.tsx` — rendering eventi, grouping logic
- `src/components/timeline/SubTimeline.tsx` — estratto da Timeline.tsx
- `src/components/timeline/TimelineControls.tsx` — zoom/reset buttons + placeholder scale switcher
- `src/components/timeline/index.ts` — re-export `Timeline` (backward compatible)
- `src/utils/scaleTransform.ts` — `linearRatio`, `logRatio`, `inverseLinear`, `inverseLog`, `generateTicks`
- `src/tests/timeline.test.ts` — test per scaleTransform + buildRenderItems

### Componenti e file coinvolti
- `src/components/Timeline.tsx` → deprecato, rimpiazzato da `src/components/timeline/`
- `src/pages/Milestones.tsx` — import path aggiornato
- `src/css/timeline.css` — nessuna modifica

### Modello dati (scale transform)
```typescript
type ScaleTransform = {
  toRatio: (value: number, range: Range) => number;
  fromRatio: (ratio: number, range: Range) => number;
  generateTicks: (range: Range, targetCount?: number) => TimelineTick[];
};

const linearTransform: ScaleTransform = { ... };
const logTransform: ScaleTransform = { ... };
```

### UX considerations
- Zero cambiamenti visivi per l'utente in questa fase
- L'interfaccia `Timeline` (props) rimane identica

### Performance considerations
- Nessuna regressione attesa — è solo estrazione di codice
- `buildRenderItems` (O(n)) va memoizzato con `useMemo` (già fatto)

### Definition of Done
- Build TypeScript senza errori
- Test unitari per `scaleTransform.ts` verdi
- Visivamente identico alla versione precedente
- `src/components/Timeline.tsx` originale rimosso o deprecato

---

## Fase 2 — Scala lineare / logaritmica

### Obiettivi
- L'utente può switchare tra scala lineare e logaritmica sulla timeline
- I tick si adattano alla scala scelta
- La preferenza persiste in `localStorage` (già gestita da `PreferencesContext`)

### Deliverable
- `ScaleSwitcher` UI (toggle Lin/Log) in `TimelineControls.tsx`
- Integrazione di `scaleTransform` in `TimelineAxis.tsx`
- Generazione ticks adattiva per scala logaritmica
- CSS per lo switcher in `timeline.css`

### Componenti e file coinvolti
- `src/components/timeline/TimelineAxis.tsx`
- `src/components/timeline/TimelineControls.tsx`
- `src/utils/scaleTransform.ts`
- `src/context/PreferencesContext.tsx` — `scaleMode` già presente
- `src/css/timeline.css` — aggiungere `.timeline__scale-toggle`

### Modello dati
Nessun nuovo tipo — `scaleMode: "linear" | "log"` già in `PreferencesContext`.

### UX considerations
- Toggle discreto accanto ai bottoni zoom/reset esistenti
- Transizione CSS smooth tra le due scale (posizioni eventi interpolate via `transition: left`)
- Label tooltip: "Linear scale" / "Log scale"
- **Nota:** In scala logaritmica i valori ≤ 0 (prima della nascita) vanno clampati

### Performance considerations
- `toRatio` e `fromRatio` sono O(1) — nessun impatto
- La generazione ticks per scala log è più costosa ma avviene già in `useMemo`

### Definition of Done
- Toggle visibile e funzionante
- Scala log mostra distribuzioni migliori per range Eons (13 miliardi di anni)
- Scala lin rimane default
- `scaleMode` persiste tra refresh

---

## Fase 3 — Timescales MVP (Overview + Comparatore)

### Obiettivi
- Trasformare `Timescales.tsx` da pagina stub a sezione funzionale
- Implementare due sotto-sezioni: Overview e Comparatore di fenomeni

### Deliverable
**Data:**
- `public/data/timescale-phenomena.json` — ~60 fenomeni (nanosecondo → Big Bang)
- `src/hooks/useTimescalePhenomena.ts` — fetch + cache

**Componenti:**
- `src/components/timescales/TimescaleOverview.tsx` — barra logaritmica verticale
- `src/components/timescales/PhenomenaComparator.tsx` — confronto drag-and-drop
- `src/components/timescales/PhenomenaSearch.tsx` — ricerca/filtro fenomeni

**Pagina:**
- `src/pages/Timescales.tsx` — riscritta con tab navigation (Overview / Comparator / Explorer)

### Modello dati
```typescript
type TimescalePhenomenon = {
  id: string;
  label: string;
  durationSeconds: number; // durata in secondi (es. 1e-9 per nanosecondo)
  category: "quantum" | "biological" | "human" | "geological" | "cosmic";
  description?: string;
  examples?: string[];     // es. ["human heartbeat", "hummingbird wingbeat"]
};
```

### UX considerations
- **Overview:** Barra verticale con scala log, fenomeni distribuiti lungo l'asse, click per dettaglio
- **Comparatore:** Selezione di due fenomeni via search, visualizzazione del rapporto (es. "Un anno solare è 31.5 milioni di volte un secondo")
- Tab navigation usa `timescalesTab` da `PreferencesContext` (persiste)
- Loading skeleton durante il fetch

### Performance considerations
- SVG per l'overview bar — max 50 elementi visibili
- `PhenomenaSearch` con debounce (200ms) per il filtro
- Il JSON dei fenomeni pesa ~15 KB — fetch unica con cache

### Definition of Done
- Pagina Timescales non è più stub
- Overview mostra almeno 30 fenomeni distribuiti su scala log
- Comparatore funzionante con almeno 40 fenomeni selezionabili
- Tab state persiste tra navigazioni

---

## Fase 4 — Esploratore geologico/cosmologico

### Obiettivi
- Deep-dive interattivo nelle ere geologiche e cosmologiche
- Almeno 3 livelli di zoom: Eon → Era → Period/Epoch

### Deliverable
**Data:**
- `public/data/geological-eras.json` — struttura ad albero Eon > Era > Period > Epoch
- `src/hooks/useGeologicalEras.ts`

**Componenti:**
- `src/components/timescales/GeoCosmicExplorer.tsx` — timeline verticale zoomabile
- `src/components/timescales/EraCard.tsx` — scheda informativa per ogni livello
- `src/hooks/useExplorerDrilldown.ts` — gestione navigazione ad albero

### Modello dati
```typescript
type GeologicalUnit = {
  id: string;
  name: string;
  startMya: number;   // milioni di anni fa
  endMya: number;
  color: string;      // colore standard ICS
  description?: string;
  children?: GeologicalUnit[];
};
```

### UX considerations
- Breadcrumb per la navigazione (Precambrian → Proterozoic → Neoproterozoic)
- Click su una era per espanderla, breadcrumb per tornare su
- Proporzione visiva relativa alla durata (barre proporzionali in log scale)
- Info panel laterale con fatti chiave per ogni era

### Performance considerations
- Massimo 20 elementi per livello visibile
- Il tree JSON viene caricato una volta sola e navigato in memoria

### Definition of Done
- Navigazione funzionante su almeno 3 livelli
- Integrazione nella terza tab di Timescales
- Responsive (collassa a lista su mobile)

---

## Fase 5 — Modalità 3D *(sperimentale — rimandato)*

### Obiettivi
- Visualizzazione 3D opzionale della timeline personale
- Toggle 2D/3D nell'interfaccia
- Nessun impatto sul bundle per chi non usa la feature

### Deliverable
- `src/components/3d/Timeline3D.tsx` — scena R3F con camera orbitale
- `src/components/3d/EventMarker3D.tsx` — marker 3D per gli eventi
- Configurazione Vite per chunk splitting
- Aggiornamento `PreferencesContext.show3D` (già stub presente)

### Prerequisiti
- Validazione utente: esiste domanda reale per una visualizzazione 3D?
- Test WebGL su device target
- Decision sulla UX (replace 2D? coexist? full-screen modal?)

### Performance considerations (critiche)
```typescript
// vite.config.ts
manualChunks: { "three-vendor": ["three", "@react-three/fiber", "@react-three/drei"] }

// Timeline3DWrapper.tsx
const Timeline3D = React.lazy(() => import("./Timeline3D"));
// → three.js (~500 KB gz) caricato solo se l'utente attiva la modalità
```

### Definition of Done
- Bundle principale non aumenta senza attivazione 3D
- Fallback graceful se WebGL non disponibile
- WebGL detect prima del lazy import

---

## Ordine raccomandato di sviluppo

```
Fase 0  ✅ (COMPLETATA — 13/03/2026)
  └─ Fase 1 (Timeline decomposition) ✅
       └─ Fase 2 (Scala log/lin) ✅
            └─ Fase 3 (Timescales MVP) ✅
                 └─ Fase 4 (Esploratore geo) ← PROSSIMA
                      └─ Fase 5 (3D) ← solo dopo validazione utente
```

---

## Top 5 Priorità assolute

| # | Priorità                                   | Motivo                                                |
|---|--------------------------------------------|-------------------------------------------------------|
| 1 | Decomporre `Timeline.tsx` (Fase 1)         | Bloccante per scala log/lin e ogni futura modifica    |
| 2 | `scaleTransform.ts` + test unitari         | Fondamento tecnico per tutte le visualizzazioni       |
| 3 | Timescales Overview (Fase 3)               | Completa una pagina stub nel routing pubblico         |
| 4 | Scala logaritmica (Fase 2)                 | Abilita visualizzazioni Eons/Cosmic sensate           |
| 5 | Comparatore fenomeni (Fase 3)              | Feature differenziante ad alto valore percepito       |

---

## Top 5 Rischi

| # | Rischio                                                      | Mitigazione                                                     |
|---|--------------------------------------------------------------|-----------------------------------------------------------------|
| 1 | Refactoring Timeline senza test → regressioni visive         | Scrivere test per `buildRenderItems` e `scaleTransform` prima   |
| 2 | Bundle bloat da R3F (three.js ~500 KB) nella modalità 3D    | `React.lazy` + chunk splitting in Vite — non caricare mai eagerly|
| 3 | Performance con 100+ eventi storici su pan/zoom rapido       | Filtro per range viewport in `useMemo`, max 30 eventi visibili  |
| 4 | UX del comparatore Timescales troppo complessa               | Prototipare su carta/Figma prima di codificare                  |
| 5 | `src/components/unused/` rompe il build se rinominata        | Migrare `landingIntro` e `Unit` prima di toccare quella dir     |

---

## Cosa rimandare

| Feature / Task                          | Motivo del rimando                                             |
|-----------------------------------------|----------------------------------------------------------------|
| Modalità 3D (Fase 5)                    | Serve validazione utente; costo alto, valore incerto          |
| Pagina Personalize                      | Nessun requisito di prodotto definito                         |
| Internazionalizzazione (i18n)           | Mix IT/EN sistematizzare dopo le feature, non blocca          |
| Migration `src/components/unused/`      | Funziona, non urgente; priorità bassa                         |
| Design system / CSS-in-JS               | Overengineering per questa scala; rivalutare a Fase 4+        |
| SSR / Server Components                 | L'app è una SPA su Vercel, non necessario                     |
| Route API Vercel per i dati             | JSON statico è sufficiente fino a ~500 eventi                 |

---

## Metriche di successo

| Metrica                              | Target         | Attuale  |
|--------------------------------------|----------------|----------|
| TypeScript strict errors             | 0              | ✅ 0     |
| Lighthouse Performance (mobile)      | ≥ 85           | ?        |
| Bundle size (gzip, senza 3D)         | < 200 KB       | ?        |
| Test coverage (utils + hooks)        | ≥ 60%          | ~5%      |
| Pagine stub nel routing              | 0              | 2        |

---

*Aggiornare questo file al completamento di ogni fase.*







