# DECISIONS.md — Age Milestones

> Registro delle decisioni architetturali e di prodotto prese durante lo sviluppo.
> Aggiornato al 14 marzo 2026 — post-Phase 5 + Timeline polish.

---

## Come leggere questo documento

Ogni decisione è documentata con:
- **Contesto** — il problema o la forza che ha motivato la scelta
- **Decisione** — cosa è stato scelto
- **Alternative considerate** — opzioni scartate e perché
- **Conseguenze** — impatto atteso (positivo e negativo)
- **Fase** — in quale fase è stata presa

---

## D-01 — CSS: split via `@import` (non CSS Modules)

**Fase:** 0  
**Data:** 13 marzo 2026

**Contesto:**  
`index.css` aveva 1957 righe con reset, variabili, layout, e tutti i componenti mischiati in un unico file monolitico. Insostenibile per la crescita futura.

**Decisione:**  
Dividere in 6 moduli tematici importati da `index.css` con `@import`:
- `components.css`, `timeline.css`, `navbar.css`, `wizard.css`, `scale-overlay.css`, `timescales.css`

**Alternative considerate:**
- **CSS Modules** (`.module.css`): richiede una migrazione invasiva di ogni `className` stringa nel JSX; overengineering per questo progetto.
- **styled-components / Emotion**: aggiunge un layer runtime; contrario alle convenzioni stabilite (plain CSS).
- **Tailwind**: cambio completo di paradigma, non coerente con lo stile BEM-like esistente.

**Conseguenze:**
- ✅ Ogni sviluppatore sa esattamente dove cercare/modificare uno stile
- ✅ Zero regressioni: `index.css` carica tutti i moduli, lo stesso bundle finale
- ⚠️ Le variabili CSS (`:root`) rimangono in `index.css`; la specificità globale non cambia

---

## D-02 — Stato: doppio Context, nessuna libreria esterna

**Fase:** 0  
**Data:** 13 marzo 2026

**Contesto:**  
L'app aveva un solo `BirthDateContext`. Con le feature nuove (scaleMode, filtri categoria, toggle 3D, tab Timescales) serviva un posto per le preferenze utente.

**Decisione:**  
Aggiungere `PreferencesContext` separato, persistito in `localStorage` con chiavi prefissate `pref_*`. Nessuna libreria di stato esterna.

**Alternative considerate:**
- **Zustand**: leggero e testabile, ma aggiunge una dipendenza per ~5 valori di stato. Rimandato a quando il numero di valori crescerà sostanzialmente.
- **Redux Toolkit**: fortemente overengineered per questa scala.
- **Singleton module** (senza Context): non supporta re-render automatici.

**Conseguenze:**
- ✅ Zero nuove dipendenze
- ✅ Persistenza in `localStorage` trasparente all'utente
- ⚠️ Se i valori di preferenze crescono oltre ~10, valutare migrazione a Zustand

---

## D-03 — Data layer: JSON statico in `public/data/` con cache module-level

**Fase:** 0  
**Data:** 13 marzo 2026

**Contesto:**  
Gli eventi storici erano hardcoded in `buildTimelineData()` dentro `Milestones.tsx`. Serviva un data layer scalabile.

**Decisione:**  
JSON statici in `public/data/` (serviti come asset da Vite/Vercel), fetchati una volta con pattern cache module-level (`let _cache = null`). Nessun server, nessuna API.

**Pattern di fetch:**
```typescript
let _cache: T[] | null = null;
// Nel hook: if (_cache) return già popolata, altrimenti fetch + set _cache
```

**Alternative considerate:**
- **Route API Vercel** (`/api/events`): utile per dati dinamici o autenticati; overkill per eventi statici.
- **Import diretto del JSON** (Vite bundle): bundla il JSON nel chunk principale, aumentando il bundle iniziale anche per utenti che non aprono mai la timeline.
- **localStorage cache**: troppo fragile e dimensionalmente limitato.

**Conseguenze:**
- ✅ Bundle principale non cresce con l'aggiunta di dati
- ✅ Fetch unica per sessione (cache module-level sopravvive a re-mount)
- ⚠️ Cache non invalidata tra sessioni; per dati che cambiano raramente è accettabile

---

## D-04 — Timeline: decomposizione in 5 moduli sotto `src/components/timeline/`

**Fase:** 1  
**Data:** 13 marzo 2026

**Contesto:**  
`Timeline.tsx` aveva 879 righe che mescolavano viewport state, pan/zoom, rendering assi, rendering eventi, sub-timeline, e controlli. Bloccante per introdurre la scala logaritmica.

**Decisione:**  
Estrarre in moduli:
- `buildRenderItems.ts` — logica di posizionamento e grouping eventi
- `EventElement.tsx` — rendering di un singolo evento
- `SubTimeline.tsx` — sub-timeline estratta
- `TimelineControls.tsx` — pulsanti zoom/reset + scale switcher
- `Timeline.tsx` (nuovo, in `timeline/`) — orchestratore
- `index.ts` — re-export backward-compatible

**Alternative considerate:**
- **Refactoring graduale senza spostare file**: meno rottura, ma il file da 879 righe sarebbe rimasto un collo di bottiglia.

**Conseguenze:**
- ✅ Ogni modulo ha una responsabilità singola e chiara
- ✅ `import Timeline from "../components/Timeline"` continua a funzionare via `index.ts`
- ✅ Prerequisito soddisfatto per la scala log/lin

---

## D-05 — `scaleTransform.ts`: interfaccia pluggable per lin/log

**Fase:** 1  
**Data:** 13 marzo 2026

**Contesto:**  
La funzione `getRatio` (linear) era inline nella timeline. Per supportare la scala logaritmica serve un'astrazione.

**Decisione:**  
`src/utils/scaleTransform.ts` espone `linearTransform` e `logTransform`, entrambi conformi all'interfaccia `ScaleTransform`:
```typescript
type ScaleTransform = {
  toRatio: (value: number, range: Range) => number;
  fromRatio: (ratio: number, range: Range) => number;
  generateTicks: (range: Range, targetCount?: number) => TimelineTick[];
};
```
La timeline sceglie il transform basandosi su `scaleMode` dal `PreferencesContext`.

**Conseguenze:**
- ✅ Aggiungere future scale (radix, custom) richiede solo implementare l'interfaccia
- ✅ Testabile in isolamento

---

## D-06 — Scala logaritmica: clamping dei valori ≤ 0

**Fase:** 2  
**Data:** 13 marzo 2026

**Contesto:**  
In scala log, `log10(0)` = -Infinity. La timeline personale inizia dalla nascita (timestamp > 0), ma il range di display può includere date prima della nascita (range.start < birth).

**Decisione:**  
`logTransform.toRatio` clampа i valori ≤ 0 all'1% del range visivo:
```typescript
const safeLog = (v: number) => Math.log10(Math.max(v, 1));
```
In pratica, i timestamp sono sempre positivi (millisecondi Unix epoch), quindi il clamping è solo una protezione di sicurezza.

**Conseguenze:**
- ✅ Nessun NaN o -Infinity nel layout
- ⚠️ Range che includono l'epoch Unix (1970) potrebbero non essere rappresentati idealmente in scala log; accettabile dato il dominio (scale personali)

---

## D-07 — Scala log: default mantieni "linear", toggle persistito

**Fase:** 2  
**Data:** 13 marzo 2026

**Contesto:**  
La scala logaritmica è utile per range Eons/Cosmic ma controintuitiva per l'uso quotidiano.

**Decisione:**  
- Default: `scaleMode = "linear"`
- Il toggle `Lin | Log` è visibile in `TimelineControls`
- La preferenza persiste in `localStorage` via `PreferencesContext`

**Alternative considerate:**
- Auto-switch basato sulla tab attiva (Eons → log automatico): più smart ma confonde l'utente se non se lo aspetta.

---

## D-08 — Timescales: SVG ruler verticale per l'Overview

**Fase:** 3  
**Data:** 13 marzo 2026

**Contesto:**  
L'Overview deve mostrare ~60 fenomeni distribuiti su 120 ordini di grandezza (da Planck a evaporazione buchi neri).

**Decisione:**  
SVG verticale con:
- Scala log sull'asse Y: `log_max` in alto, `log_min` in basso
- Dot per ogni fenomeno (sempre visibile)
- Label alternati left/right con collision-avoidance (gap minimo 15px)
- Tooltip HTML assoluto (non SVG) per accessibilità e styling

**Alternative considerate:**
- Canvas 2D: migliori performance per >500 elementi, ma più complesso da mantenere e inaccessibile
- Lista HTML: più semplice, ma perde la proporzionalità visiva che è il punto centrale

**Conseguenze:**
- ✅ Proporzionalità visiva immediatamente comprensibile
- ⚠️ Max ~60 elementi prima di degrado della leggibilità; filtro per categoria mitiga

---

## D-09 — Timescales Comparator: ricerca testuale con debounce

**Fase:** 3  
**Data:** 13 marzo 2026

**Contesto:**  
Il comparatore ha bisogno di selezionare fenomeni da un dataset di ~60 elementi.

**Decisione:**  
`PhenomenaSearch` con `<input>` + dropdown list filtrata, debounce 200ms. Selezione via click o keyboard (frecce + Enter). Nessun drag-and-drop (rimandato; la complessità superava il valore).

**Conseguenze:**
- ✅ Accessibile (keyboard navigation)
- ✅ Funziona su mobile (no drag on touch)

---

## D-10 — Timescales: 3 tab (`overview | comparator | explorer`)

**Fase:** 3  
**Data:** 13 marzo 2026

**Contesto:**  
La pagina Timescales deve ospitare l'overview, il comparatore, e il futuro explorer geologico.

**Decisione:**  
3 tab nella barra della pagina. Il tab `explorer` era disabilitato in Fase 3 con badge "Soon"; abilitato in Fase 4. La tab attiva persiste in `PreferencesContext.timescalesTab`.

**Conseguenze:**
- ✅ La struttura della pagina non cambia tra Fase 3 e Fase 4 — solo il tab diventa attivo
- ✅ L'utente ritrova l'ultima tab visitata tra sessioni

---

## D-11 — Explorer: breadcrumb drilldown con stack (non router URL)

**Fase:** 4  
**Data:** 14 marzo 2026

**Contesto:**  
L'Explorer geologico ha 3–4 livelli di navigazione (Eon → Era → Period → Epoch). Come gestire la navigazione?

**Decisione:**  
Stack-based navigation con `useState<GeologicalUnit[]>` nel hook `useExplorerDrilldown`. Il breadcrumb è derivato dallo stack. Nessun URL routing per la navigazione interna dell'Explorer.

**Alternative considerate:**
- **Nested routes** (`/timescales/phanerozoic/paleozoic`): più linkabile, ma aggiunge complessità al router e rompe l'UX attuale delle tab.
- **Query params** (`?era=phanerozoic&period=paleozoic`): possibile miglioramento futuro, ma per ora non necessario.

**Conseguenze:**
- ✅ Zero cambiamenti al router
- ✅ La navigazione si resetta al cambio tab (previene stati "orfani")
- ⚠️ Il livello di navigazione non è condivisibile via URL; accettabile per questa versione

---

## D-12 — Explorer: "Details" e "Explore ›" come azioni separate

**Fase:** 4  
**Data:** 14 marzo 2026

**Contesto:**  
Nell'Explorer c'è tensione tra "mostro info" e "vado più in profondità". Come disambiguare il click?

**Decisione:**  
Ogni `EraCard` ha due pulsanti distinti:
- **Details** — seleziona la card e apre il pannello dettaglio sotto la griglia
- **Explore ›** — drill down (visibile solo su unità con figli)

Il pannello dettaglio ha anche un pulsante "Explore sub-units ›" per chi vuole leggere prima e poi navigare.

**Alternative considerate:**
- **Click = drill down; info button separato (ℹ️)**: standard mobile ma poco visibile su desktop
- **Click = info; double-click = drill**: inusuale sul web, non funziona su touch
- **Click = info; freccia cliccabile sovrapposta alla card**: visivamente caotico con card piccole

**Conseguenze:**
- ✅ Azioni esplicite e non ambigue
- ✅ Utente può leggere prima di decidere se entrare nel livello successivo
- ⚠️ Due pulsanti per card aumentano leggermente la densità visiva; mitigato da padding generoso

---

## D-13 — Explorer: sub-tab `geological | cosmic` dentro la tab Explorer

**Fase:** 4  
**Data:** 14 marzo 2026

**Contesto:**  
Il piano prevedeva "esploratore geologico/cosmologico". I dati geologici (Eon/Era/Period) e i dati cosmici (milestones puntuali) hanno strutture e UX molto diverse.

**Decisione:**  
Due sub-tab pill-style dentro la sezione Explorer:
- **🌍 Geological** — drilldown gerarchico ICS
- **🌌 Cosmic** — lista verticale di milestone con barra log-scale

**Alternative considerate:**
- Un'unica timeline ibrida (geological + cosmic sullo stesso asse): la differenza di scala (ere di miliardi di anni vs. eventi puntuali come Chicxulub) rende difficile la leggibilità unificata.
- Sezione dedicata nella Timescales Overview: i fenomeni cosmici sono già nell'Overview; il Cosmic tab dell'Explorer ha un focus narrativo/educativo diverso.

**Conseguenze:**
- ✅ Separazione pulita di due UX distinte
- ✅ Il sub-tab non è persistito nel Context (scelta locale al componente) — la tab principale è sufficiente come punto di persistenza

---

## D-14 — Dati geologici: standard ICS 2023

**Fase:** 4  
**Data:** 14 marzo 2026

**Contesto:**  
I colori e le date delle ere geologiche hanno uno standard internazionale (ICS — International Commission on Stratigraphy).

**Decisione:**  
`geological-eras.json` usa:
- Date ICS 2023 (es. Cambrian: 538.8–485.4 Ma)
- Colori HEX approssimati dalla carta ICS ufficiale
- Struttura ad albero `children[]` per navigazione a 3 livelli

**Conseguenze:**
- ✅ Dati scientificamente accurati e aggiornati
- ⚠️ Non viene incluso il 4° livello (Epoch) per ora — solo Eon/Era/Period; la struttura dati lo supporta ma sarebbe un dataset di ~100 voci

---

## D-15 — `formatMya` e `formatMyaDuration` aggiunte a `formatDuration.ts`

**Fase:** 4  
**Data:** 14 marzo 2026

**Contesto:**  
Servivano funzioni per formattare valori in milioni di anni (Ga/Ma/ka) e durate geologiche (Gyr/Myr/kyr).

**Decisione:**  
Aggiunte a `src/utils/formatDuration.ts` esistente, non in un nuovo file. Il modulo è già il contenitore di tutte le utility di formattazione temporale del progetto.

**Alternative considerate:**
- `src/utils/formatGeological.ts`: più granulare, ma crea dispersione per sole 2 funzioni.

---

## D-16 — CSS: `color-mix()` per colori derivati dal `--era-color`

**Fase:** 4  
**Data:** 14 marzo 2026

**Contesto:**  
Le EraCard usano un colore ICS dinamico (`--era-color`) passato come CSS custom property. Serviva derivare varianti semi-trasparenti per hover e selezione.

**Decisione:**  
Usare la funzione CSS nativa `color-mix(in srgb, var(--era-color) X%, transparent)` invece di calcolare le varianti in JavaScript.

**Conseguenze:**
- ✅ Zero JS per la gestione dei colori
- ✅ La transizione CSS funziona nativamente
- ⚠️ `color-mix()` richiede browser moderni (Baseline 2023); accettabile per questo target

---

## Decisioni rimandante / aperte

| ID  | Tema                               | Motivo del rimando                                         |
|-----|------------------------------------|-------------------------------------------------------------|
| —   | Modalità 3D (Fase 5)               | Nessuna validazione utente; `@react-three/*` sono stub       |
| —   | Epoch level nei dati geologici     | ~100 voci aggiuntive; valore educativo alto, priorità bassa |
| —   | URL routing per Explorer levels    | Non linkabile ora; valutare con query params in futuro      |
| —   | Migrazione `src/components/unused/` | Funziona, non blocca nessuna feature                       |
| —   | i18n (IT/EN mescolati)             | Sistemare dopo le feature; non urgente                     |
| —   | Zustand per state management       | Rivalutare se i valori di Context superano ~10              |

---

## D-17 — UX 3D: Il 3D sostituisce la Timeline 2D (no overlay, no fullscreen)

**Fase:** 5  
**Data:** 14 marzo 2026

**Contesto:**  
Il piano richiedeva una decisione su: replace 2D? coexist? full-screen modal?

**Decisione:**  
Toggle `🌐 3D / 2D` nella header row della `timeline-card`. Swappa `<Timeline>` con `<Timeline3DWrapper>`. Stesso dataset, stessa `range`, stessa `focusValue`. Pulsante "↩ Back to 2D" sempre visibile nella scena 3D.

**Alternative considerate:**
- **Full-screen modal**: immersivo ma disorientante; l'utente perde il contesto della pagina.
- **Coesistenza** 2D + 3D: richiede layout speciale, pessimo su mobile.
- **Replace** ✓: zero layout work, UX reversibile in un click.

**Conseguenze:**
- ✅ Semplicità implementativa massima
- ✅ `allEvents` già calcolato — nessuna computazione extra
- ⚠️ I filtri categoria vengono nascosti in 3D mode; gli eventi sono comunque già filtrati

---

## D-18 — Bundle splitting: `manualChunks` + `React.lazy`

**Fase:** 5  
**Data:** 14 marzo 2026

**Contesto:**  
three.js (~1 MB uncompressed, ~307 KB gzip) non deve essere nel bundle principale.

**Decisione:**  
Doppia strategia combinata:
1. `vite.config.ts`: `manualChunks: { "three-vendor": [...] }` → chunk fisico separato
2. `Timeline3D` importato via `React.lazy(() => import("./Timeline3D"))` → lazy entry point

**Risultato build:**
- Main bundle: **79 kB gzip** (under the 200 KB target ✓)
- `three-vendor`: **307 kB gzip** — scaricato solo all'attivazione 3D
- `Timeline3D` component: **1.55 kB gzip**

---

## D-19 — WebGL detection: sincrono, in `utils/webgl.ts` separato

**Fase:** 5  
**Data:** 14 marzo 2026

**Contesto:**  
La detection deve avvenire prima che l'utente veda il toggle (per disabilitarlo). La regola ESLint `react-refresh/only-export-components` vieta di esportare costanti insieme a componenti.

**Decisione:**  
`src/utils/webgl.ts` — file dedicato, detection sincrona a module load, esporta `WEB_GL_SUPPORTED: boolean`. Importato sia da `Timeline3DWrapper.tsx` che da `Milestones.tsx`.

---

## D-20 — `frameloop="always"` per il Canvas R3F

**Fase:** 5  
**Data:** 14 marzo 2026

**Decisione:**  
`frameloop="always"` perché `FocusRing` e `EventMarker3D` usano `useFrame` per animazioni continue. Il Canvas viene smontato quando si torna al 2D → zero GPU activity a riposo.

---

## D-21 — `OrbitControls`: `enablePan=false`, polar clamp, `makeDefault`

**Fase:** 5  
**Data:** 14 marzo 2026

**Decisione:**  
- `enablePan={false}` — impedisce di perdere la timeline dall'inquadratura
- `maxPolarAngle={Math.PI * 0.78}` — impedisce di andare sotto il piano
- `minDistance={5}` / `maxDistance={30}` — zoom range sensato
- `makeDefault` — registra i controlli come default R3F

---

## Decisioni rimandante / aperte (post Fase 5)

| ID  | Tema                               | Motivo del rimando                                               |
|-----|------------------------------------|------------------------------------------------------------------|
| —   | Epoch level nei dati geologici     | La struttura dati lo supporta già; ~100 voci extra               |
| —   | URL routing per Explorer levels    | Valutare query params in futuro                                  |
| —   | Migrazione `src/components/unused/` | Funziona, non blocca nessuna feature                            |
| —   | i18n (IT/EN mescolati)             | Sistemare post feature                                           |
| —   | Zustand                            | Rivalutare se Context supera ~10 valori                         |
| —   | EventMarker3D click → pannello info | Nice-to-have; hover tooltip è sufficiente per MVP               |
| —   | 3D per Timescales Explorer         | Potenziale interessante; richiede UX separata                   |

---

*Aggiornare questo documento ad ogni decisione architetturale significativa.*

---

## D-XX — Timeline: colori dot per categoria, sezione filtri, hint Ctrl+scroll

**Fase:** post-4  
**Data:** 14 marzo 2026

### D-XX-a — Dot color per categoria evento

**Contesto:**  
Tutti i dot degli eventi storici sulla timeline erano grigi perché venivano mappati con `accent: "muted"`, che puntava a `var(--slate-700)`. I chip di filtro mostrano già i colori per categoria (rosso, ciano, viola, ecc.) ma i marker corrispondenti non li rispecchiavano.

**Decisione:**  
Aggiunto campo opzionale `color?: string` a `TimelineEvent`. In `Milestones.tsx`, gli eventi storici ora ricevono `color: CATEGORY_META[e.category].color`. In `EventElement.tsx`, il CSS variable `--marker-color` usa `event.color ?? accentColors[accent]`, dando priorità al colore diretto se presente. I milestone personali (birth, today, ecc.) non impostano `color`, quindi continuano a usare la logica accent esistente (pinkish/indigo per `highlight`).

**Alternative considerate:**  
- Aggiungere nuovi valori `Accent` per ogni categoria: più invasivo, crea un tight coupling tra il tipo generico `Accent` e la semantica degli eventi storici.  
- CSS class per categoria (già presenti come `.timeline__event--historical` ecc.): non venivano applicate al DOM perché la categoria non era passata al componente. Mantenere il campo `color` è più semplice e flessibile.

**Conseguenze:**  
- ✅ Ogni categoria ha il suo colore riconoscibile sia nel chip filtro sia nel dot  
- ✅ I milestone personali restano pinkish/indigo come prima  
- ✅ Zero breaking change: il campo `color` è opzionale  

---

### D-XX-b — Sezione filtri con card dedicata

**Contesto:**  
I chip di filtro categoria fluttuavano sopra la timeline senza un contenitore visivo riconoscibile, rendendo poco chiaro che fossero controlli interattivi.

**Decisione:**  
Wrappato il gruppo di chip in un nuovo `<div className="timeline__filter-section">` con label "Filter events", sfondo semi-trasparente, bordo sottile e backdrop-blur, coerente con il design system. I chip attivi ora mostrano anche `background` e `borderColor` inline derivati dal colore della categoria (con opacità ridotta `33` in hex), così il colore della categoria è visibile anche nello stato attivo.

**Conseguenze:**  
- ✅ Sezione filtri visivamente separata e leggibile  
- ✅ Feedback visivo coerente tra colore chip attivo e colore dot  

---

### D-XX-c — Hint "Ctrl+scroll" vicino ai pulsanti zoom

**Contesto:**  
Il ctrl+scroll per zoomare era già implementato ma completamente invisibile: l'unica indicazione era il `title` tooltip dei pulsanti, non accessibile su touch e poco discoverable.

**Decisione:**  
Aggiunto uno `<span className="timeline__ctrl-scroll-hint">Ctrl+scroll</span>` inline nel `TimelineControls`, subito dopo i pulsanti +/−/↺, con stile piccolo e attenuato (`font-size: .62rem`, `opacity: .7`). Non è un pulsante cliccabile: è un indicatore puramente informativo.

**Alternative considerate:**  
- Tooltip al primo hover sul axis: più complesso da implementare, non garantisce discoverability.  
- Testo sotto la timeline: più invasivo per il layout.

**Conseguenze:**  
- ✅ Gli utenti desktop scoprono la funzionalità senza cercarla  
- ✅ Non interferisce con i controlli esistenti  
- ⚠️ Su mobile non è rilevante (Ctrl non esiste), ma il testo è piccolo e non crea rumore visivo eccessivo  

---

*Aggiornare questo documento ad ogni decisione architetturale significativa.*
