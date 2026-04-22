# ARCHITECTURE BASELINE — Refactor 4 / Fase 0

**Data:** 2026-04-22  
**Stato:** ✅ Verificata contro la codebase corrente

---

## 1 — App shell corrente

### Entry point

`src/main.tsx` monta l’app con questa gerarchia:

```text
StrictMode
└─ ErrorBoundary
   └─ BirthDateProvider
      └─ PreferencesProvider
         └─ UserProfileProvider
            └─ BrowserRouter
               └─ Routes
```

### Routing attuale

| Path | Surface | Stato runtime |
|---|---|---|
| `/` | `Landing` | attiva |
| `/milestones` | `Milestones` | attiva |
| `/timescales` | `Timescales` | attiva |
| `/settings` | `Settings` | attiva |
| `/personalize` | redirect a `/settings` | compatibilità legacy |
| `/about` | `About` | attiva |

---

## 2 — State e persistenza

### `BirthDateContext`

Responsabilità:

- `birthDate`
- `birthTime`
- `setBirthDate`
- `setBirthTime`
- `clearBirthDate`

Persistenza locale:

- `dob`
- `dobTime`

### `PreferencesContext`

Responsabilità attive:

- `activeCategories`
- `show3D`
- `timescalesTab`
- `visibleTimelineLanes`

Responsabilità legacy ancora persistite:

- `scaleMode`

Persistenza locale:

- `pref_scaleMode`
- `pref_eventCategories`
- `pref_show3D`
- `pref_timescalesTab`
- `pref_visibleTimelineLanes`

### `UserProfileContext`

Responsabilità:

- profilo opzionale (`restingHeartRate`, `height`, `weight`, `activityLevel`, `sleepHoursPerDay`, `screenHoursPerDay`)
- `updateProfile`
- `resetProfile`

Persistenza locale:

- `user_profile`

---

## 3 — Surface prodotto confermate

### Landing

File principali:

- `src/pages/Landing.tsx`
- `src/components/BirthDatePicker.tsx`

Stato:

- usa il picker inline, non il wizard;
- mostra stato bloccante se manca la birth date;
- porta verso `Milestones` e `Settings`.

### Settings

File principali:

- `src/pages/Settings.tsx`
- `src/components/BirthDatePicker.tsx`
- `src/context/UserProfileContext.tsx`

Stato:

- è la surface canonica per identity, birth date e profilo utente;
- contiene warning DOB mancante e profilo incompleto;
- centralizza il flusso che Refactor 3 aveva spostato fuori da `Personalize`.

### Milestones

File principali:

- `src/pages/Milestones.tsx`
- `src/components/AgeTable.tsx`
- `src/components/timeline/*`
- `src/components/3d/*`

Stato:

- integra i perspective tabs, la timeline 2D, il toggle 3D e i filtri lane/categorie;
- usa `SectionErrorBoundary` per isolare guasti locali;
- combina eventi personali, storici e proiezioni future.

### Timescales

File principali:

- `src/pages/Timescales.tsx`
- `src/components/timescales/TimescaleOverview.tsx`
- `src/components/timescales/PhenomenaComparator.tsx`
- `src/components/timescales/GeoCosmicExplorer.tsx`

Stato:

- mantiene tre modelli interattivi distinti;
- persiste il tab attivo in `PreferencesContext`;
- non condivide ancora un vero engine temporale con `Milestones`.

### About

File principali:

- `src/pages/About.tsx`
- `src/utils/aboutLinks.ts`

Stato:

- surface documentale attiva, con deep-linking verso sezioni contestuali;
- usa una parte consistente degli shared styles in `components.css` e `personalize.css`.

---

## 4 — Baseline timeline 2D

### Runtime attivo

File cardine:

- `src/components/timeline/Timeline.tsx` (416 linee)
- `src/components/timeline/buildRenderItems.ts`
- `src/components/timeline/EventElement.tsx`
- `src/components/timeline/TimelineControls.tsx`
- `src/components/timeline/TimelineDetailPanel.tsx`
- `src/css/timeline.css` (1219 linee)

### Caratteristiche osservate

- rendering ancora **DOM-based** per marker, gruppi e overlay principali;
- `Timeline.tsx` concentra viewport, drag pan, wheel zoom, pinch integration, grouping, selection e focus indicator;
- `TimelineDetailPanel` è il pannello attivo per i dettagli selezionati;
- il modello lane è già esplicito (`personal`, `global`);
- il raggruppamento è già delegato a una funzione pura (`buildRenderItems.ts`), utile come base per il futuro engine.

### Vincolo critico emerso

`PreferencesContext` conserva `scaleMode`, ma la timeline attiva usa internamente:

```ts
const INTERNAL_SCALE_MODE: ScaleMode = "linear";
```

Quindi il sistema è già semanticamente semplificato nella UI, ma mantiene ancora debito di persistenza e API.

### Legacy interno già visibile

- `SubTimeline.tsx` non è montato nella surface attiva;
- `types.ts` contiene ancora `SubTimelineProps` e costanti correlate;
- `timeline.css` contiene ancora il blocco `.timeline__subtimeline*`.

---

## 5 — Baseline timeline 3D

File cardine:

- `src/components/3d/Timeline3DWrapper.tsx`
- `src/components/3d/Timeline3D.tsx`
- `src/utils/webgl.ts`

Stato osservato:

- caricamento lazy via `React.lazy()`;
- gating WebGL tramite `WEB_GL_SUPPORTED`;
- profili qualità già distinti: `low-power` su mobile/reduced motion, `balanced` altrove;
- sistema sufficientemente isolato per restare secondario, ma ancora dipendente dal contratto eventi della timeline principale.

---

## 6 — Baseline CSS

### Entry globale

`src/css/index.css`:

- importa 8 moduli CSS;
- definisce token, reset, background app, layout root e utility minime;
- continua però a governare parte del gutter/layout condiviso fra pagine.

### File più sensibili per il refactor

| File | Ruolo reale | Rischio |
|---|---|---|
| `components.css` | shared UI + about + onboarding + error states + resti legacy | alto |
| `personalize.css` | Settings + DOB picker + parte About | medio/alto |
| `timeline.css` | quasi tutta la surface timeline 2D + detail panel + filtri + responsive + legacy SubTimeline | massimo |
| `wizard.css` | layout Landing attivo + wizard legacy | alto |

### Lettura architetturale

Il sistema CSS attuale non è “rotto”, ma è ancora **page-driven e globalmente accoppiato**. La Fase 1 deve introdurre primitive riusabili senza allargare ulteriormente questi file.

---

## 7 — Cleanup baseline

### Orphan verificati

- `src/components/BirthDateWizard.tsx`
- `src/hooks/useBirthWizard.ts`
- `src/components/common/MockCard.tsx`
- `src/components/timeline/SubTimeline.tsx`
- `src/components/common/scaleHint.tsx`

### Mixed / da non rimuovere subito

- `src/components/unused/constants.ts` — ancora type-imported da `useMilestone.ts`
- `PreferencesContext.scaleMode` — legacy persistito, ma da rimuovere solo con la Fase 2
- `src/pages/Personalize.tsx` — alias di compatibilità, non route primaria

---

## 8 — Testing baseline

### Suite attuale verificata

Comando eseguito:

```bash
npm test -- --run
```

Risultato:

- 7 file di test
- 71 test passati

Copertura attuale centrata su:

- `scaleTransform`
- `buildRenderItems`
- semantics timeline/global lane
- `profileCompleteness`
- `format`
- `aboutLinks`

### Qualità baseline

- `npm run build` passa;
- `npm run lint` passa con 1 warning non bloccante in `UserProfileContext.tsx`.

---

## 9 — Vincoli operativi per le fasi successive

1. **Settings + BirthDatePicker** sono il primo target naturale del nuovo `src/ui/`.
2. **Timeline 2D** va trattata come piattaforma da scomporre, non come semplice componente da “rifinire”.
3. **Cleanup** va eseguito solo dopo replacement minimo e coverage equivalente.
4. **Timescales** può convergere sull’engine temporale, ma senza forzare uniformità visuale totale.
5. **3D** resta opt-in e subordinato alla stabilizzazione del 2D.

---

*Questa baseline descrive lo stato reale da cui parte l’implementazione di Refactor 4 dopo la Fase 0.*

