# AUDIT SUMMARY — Refactor 4 / Fase 0

**Data:** 2026-04-22  
**Stato:** ✅ Completata

---

## Scopo

Questo documento registra l’esito della **Fase 0 — Cleanup audit + architecture baseline** di `refactor_4`.

Obiettivo della fase: verificare lo stato reale della codebase prima di migrare UI system, timeline 2D e cleanup, così da evitare decisioni basate su documentazione ormai storica.

---

## 1 — Baseline verificata nel runtime reale

### App shell e routing attivo

Verifica da `src/main.tsx`:

- provider order: `BirthDateProvider` → `PreferencesProvider` → `UserProfileProvider` → `BrowserRouter`;
- route attive:
  - `/` → `Landing`
  - `/milestones` → `Milestones`
  - `/timescales` → `Timescales`
  - `/settings` → `Settings`
  - `/personalize` → redirect a `/settings`
  - `/about` → `About`

### Surface principali confermate

- `Settings` è la **surface canonica** per birth date e profilo utente opzionale.
- `BirthDatePicker` inline è attivo sia in `Landing` sia in `Settings`.
- `Milestones` resta la surface integrata principale: AgeTable, timeline 2D, toggle 3D, filtri categorie e lane visibility.
- `Timescales` resta una suite a tre tab (`overview`, `comparator`, `explorer`) persistita in `PreferencesContext`.
- Il 3D è opt-in e lazy-loaded tramite `Timeline3DWrapper`.

---

## 2 — Verifiche eseguite durante l’audit

| Verifica | Risultato | Note |
|---|---|---|
| `npm test -- --run` | ✅ OK | 7 file / 71 test passati |
| `npm run lint` | ⚠️ OK con warning | 1 warning `react-refresh/only-export-components` in `src/context/UserProfileContext.tsx` |
| `npm run build` | ✅ OK | build produzione completata; chunk `three-vendor` lazy confermato |

### Snapshot build osservata

- `dist/assets/index-*.css`: ~76.5 kB
- `dist/assets/index-*.js`: ~267.1 kB
- `dist/assets/three-vendor-*.js`: ~1099.6 kB raw / ~307.2 kB gzip

---

## 3 — Inventario classificato

### 3.1 — Active core

| Area | Stato | Evidenza | Implicazione |
|---|---|---|---|
| `src/pages/Settings.tsx` | `active` | route reale `/settings`; copy e blocchi DOB/profile aggiornati | prima surface da migrare su `src/ui/` |
| `src/components/BirthDatePicker.tsx` | `active` | usato in `Landing` e `Settings` | componente critico per Fase 1 |
| `src/context/UserProfileContext.tsx` | `active` | provider montato in `main.tsx`; consumato da `Settings` | baseline profilo personale confermata |
| `src/pages/Milestones.tsx` | `active` | feature primaria integrata | surface più sensibile dopo Settings |
| `src/components/timeline/Timeline.tsx` | `active` | render 2D attivo nella view principale | resta il punto di maggiore criticità tecnica |
| `src/components/timeline/TimelineDetailPanel.tsx` | `active` | pannello dettagli montato da `Timeline.tsx` | già sostituisce il pattern SubTimeline nella surface attiva |
| `src/components/3d/Timeline3DWrapper.tsx` | `active` | toggle 3D attivo, lazy load e gating WebGL | buona baseline per Fase 4 |
| `src/pages/Timescales.tsx` + `src/components/timescales/*` | `active` | tre tab runtime attive | candidato a convergenza col temporal engine condiviso |
| `src/context/PreferencesContext.tsx` | `active` | gestisce categorie, lane visibility, 3D, tab Timescales | contiene anche debito legacy su `scaleMode` |

### 3.2 — Legacy / orphan / candidate removal

| File / area | Classificazione | Evidenza verificata | Esito Fase 0 |
|---|---|---|---|
| `src/components/BirthDateWizard.tsx` | `orphan` | nessun import runtime; nessuna route lo monta | candidato rimozione dopo split CSS wizard/landing |
| `src/hooks/useBirthWizard.ts` | `orphan` | nessun consumer | candidato rimozione con il wizard |
| `src/components/common/MockCard.tsx` | `orphan` | nessun import runtime | candidato rimozione quando le note storiche saranno pulite |
| `src/components/timeline/SubTimeline.tsx` | `orphan` | nessun consumer; la surface attiva usa `TimelineDetailPanel` | candidato pruning in Fase 2 insieme a tipi/CSS correlati |
| `src/components/common/scaleHint.tsx` | `orphan` | nessun consumer; nessuno stile `.howmuch-btn` attivo | candidato rimozione dopo verifica AgeTable overlay |
| `src/pages/Personalize.tsx` | `legacy compatibility` | re-export di `Settings`, ma il routing reale fa redirect diretto | tenere solo finché serve compatibilità interna/documentale |
| `PreferencesContext.scaleMode` | `legacy persisted state` | nessuna UI pubblica attiva lo usa; `Timeline.tsx` usa `INTERNAL_SCALE_MODE = "linear"` | deprecazione da pianificare in Fase 2 |

### 3.3 — Mixed status / non rimovibile subito

| File / area | Classificazione | Evidenza verificata | Vincolo |
|---|---|---|---|
| `src/components/unused/constants.ts` | `mixed / still referenced` | type import da `useMilestone.ts` (`Unit`) | non eliminabile in blocco insieme a `unused/` |
| `src/components/unused/*` resto cartella | `legacy isolated` | nessun consumer runtime trovato oltre a `constants.ts` | richiede migrazione del type import prima del pruning |
| `src/css/wizard.css` | `mixed` | classi `landing__*` attive; classi `birth-wizard__*` riferite solo all’orphan wizard | da spezzare prima di rimozione wizard |
| `src/css/timeline.css` | `mixed but critical` | contiene sia styling attivo 2D/detail panel sia blocco `.timeline__subtimeline*` orfano | da pulire solo dopo replacement Fase 2 |
| `src/css/components.css` | `mixed but active` | contiene primitive attive, About, error states e stili legacy (`.chip`, `.more-panel`, `.slider`) | congelare nuove aggiunte e migrare verso `src/ui/` |

---

## 4 — Mappa CSS primaria della Fase 0

| File | Dimensione osservata | Stato | Risultato audit |
|---|---:|---|---|
| `src/css/index.css` | 303 linee | `active infrastructure` | entry globale, token, reset, layout root; ancora troppo responsabile di gutter/layout condivisi |
| `src/css/components.css` | 933 linee | `active + mixed responsibilities` | unisce primitive, About, onboarding, error states e resti legacy; esempio critico: `.button { margin-top: 40px; }` |
| `src/css/personalize.css` | 245 linee | `active` | governa `Settings`, `BirthDatePicker` e anche `.about-page`; coupling ancora page-driven |
| `src/css/timeline.css` | 1219 linee | `active high-risk` | concentra quasi tutta la complessità della timeline; include anche il vecchio ramo `SubTimeline` |
| `src/css/wizard.css` | 510 linee | `mixed` | ospita sia layout Landing attivo sia lo styling del wizard orfano |

### Conclusione CSS della Fase 0

La codebase non è ancora pronta per cleanup aggressivo del CSS. Il valore della Fase 1 sarà:

1. fermare la crescita del CSS globale legacy;
2. introdurre primitive riusabili in `src/ui/`;
3. spostare fuori dai file globali le responsabilità di form/layout ad alta frizione;
4. preparare split mirati (`wizard.css`, blocchi timeline orfani, primitive button/form).

---

## 5 — Drift documentale risolto da questo audit

Prima della Fase 0 le docs non erano più allineate su alcuni punti chiave:

- `AGENTS.md` descriveva ancora un assetto post-refactor_3 con dettagli runtime non più accurati;
- la presenza di `UserProfileContext` e della route `Settings` non era riflessa ovunque in modo corretto;
- `BirthDateWizard` appariva ancora come sistema attivo, mentre il runtime usa `BirthDatePicker` inline;
- il conteggio test e lo stato di alcune dipendenze (`framer-motion`, `date-fns`, stack 3D) erano datati;
- mancavano deliverable espliciti di Fase 0 da collegare a `PLAN.md` e `DECISIONS.md`.

I documenti aggiornati in questa fase diventano il riferimento operativo:

- `refactor_docs/refactor_4/AUDIT_SUMMARY.md`
- `refactor_docs/refactor_4/ARCHITECTURE_BASELINE.md`
- `refactor_docs/refactor_4/PLAN.md`
- `refactor_docs/refactor_4/DECISIONS.md`
- `refactor_docs/AGENTS.md`
- `README.md`

---

## 6 — Backlog prioritizzato emerso dalla Fase 0

### Priorità alta

1. **Fase 1 UI system** su `Settings` + `BirthDatePicker` + banner/actions/tabs condivisi.
2. **Congelamento del CSS globale legacy**: niente nuove primitive in `components.css` se possono nascere in `src/ui/`.
3. **Preparazione del cleanup `wizard.css`**: separare layout Landing attivo dal wizard orfano.

### Priorità media

4. introdurre primitive `Button`, `Field`, `FormActions`, `Panel`, `Tabs`, `Banner`;
5. isolare i pattern di filter chips riusati da Timeline e Timescales;
6. preparare il pruning di `MockCard`, `scaleHint`, `BirthDateWizard`, `useBirthWizard`.

### Priorità vincolata alla Fase 2

7. rimuovere `scaleMode` solo quando il nuovo timeline engine sarà il source of truth;
8. eliminare `SubTimeline` solo insieme a tipi/CSS e con parità funzionale minima della nuova timeline.

---

## 7 — Safe after replacement

Le seguenti rimozioni sono considerate **safe only after replacement**:

- `BirthDateWizard.tsx` + `useBirthWizard.ts` + blocco `birth-wizard__*` in `wizard.css`;
- `SubTimeline.tsx` + `SubTimelineProps`/costanti correlate + blocco `.timeline__subtimeline*`;
- `PreferencesContext.scaleMode` + persistenza `pref_scaleMode`;
- `MockCard.tsx` e stili mock collegati, solo dopo conferma che non esistono più surface placeholder;
- `scaleHint.tsx`, dopo conferma che `AgeTable` usa solo l’overlay attivo corrente;
- `src/components/unused/*`, solo dopo spostamento del type `Unit` fuori da `constants.ts`.

---

## 8 — Exit criteria della Fase 0

Stato finale rispetto al piano:

- [x] classificazione `active / legacy / orphan / candidate removal`
- [x] mappa primaria dei CSS globali e delle responsabilità duplicate
- [x] baseline docs aggiornata
- [x] backlog tecnico ordinato per severità
- [x] elenco rimozioni “safe after replacement”

---

*Questo audit è il punto di partenza operativo per la Fase 1 del refactor_4.*

