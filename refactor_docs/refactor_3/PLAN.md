# PLAN — Refactor 3: Kronoscope Evolution

**Data:** 2026-04-20
**Stato:** ✅ Completato

---

## Executive Summary

Il progetto "Age Milestones" viene rinominato **Kronoscope** e trasformato da calcolatore di età a *time exploration sandbox* multi-paradigma. Il refactor si concentra su: (1) stabilizzazione mobile e bug fix, (2) modello dati con range per metriche stimate, (3) personalizzazione utente, (4) evoluzione timeline verso un sistema a lane ("Time Map"), (5) redesign incrementale della timeline come sistema più leggibile, stabile e meno aggressivo nel clustering, (6) strategia 3D razionalizzata come ultimo step opzionale.

**Vincoli dichiarati:** lingua inglese, no i18n, no gamification, no social features. Il progetto resta un sandbox sperimentale/didattico.

**Priorità:** Stabilità UI > Mobile UX > Semplificazione interazione timeline > Coerenza concettuale sandbox > Modello dati accurato > Personalizzazione > 3D

---

## 1 — Analisi dello stato attuale (post-refactor_2)

### 1.1 Cosa funziona bene

- Layout mobile-first (breakpoint unificati 480/720/1024)
- Pinch-to-zoom sulla timeline con coesistenza pan/pinch
- Wizard DOB con modalità quick-entry + step-by-step
- Sub-timeline con bottom-sheet su mobile + Framer Motion
- Token CSS e mappa z-index globale
- Timescales page completa (Overview + Comparator + Explorer)
- 3D timeline lazy-loaded (~307kB isolato)

### 1.2 Problemi architetturali

#### UI/UX
- **Falsa precisione**: `AgeTable` mostra "2,847,293,847 Heartbeats" — tutte le metriche stimate (Biological, Everyday, Nerdy) appaiono come valori esatti. Non c'è distinzione visiva tra metriche deterministiche (tempo fisico) e stime (abitudini, comportamenti).
- **`perspOpen` non reattivo**: stato React non sincronizzato con `matchMedia` — se l'utente ridimensiona la finestra desktop↔mobile il pannello non segue.
- **Sub-timeline outside-click**: `useOutsideClick` su mobile può chiudere il pannello con tocchi accidentali.
- **About page**: usa `dangerouslySetInnerHTML` con testo statico da `unused/constants.ts` — fragile e non riflette la nuova identità del progetto.

#### Performance
- **AgeTable tick globale**: `setInterval(1000)` ricalcola TUTTE le righe ogni secondo, anche tab non visibili.
- **Resize listeners duplicati**: `SubTimeline`, `Headers.tsx`, `useElementSize` registrano listener `resize` separati.

#### Data Model
- `UnitRow = { label: string; seconds: number; displayMode?: "fraction" }` — nessun campo per distinguere metriche deterministiche da stimate, nessun range, nessun legame con profilo utente.
- Nessun modello di profilo utente — Personalize è placeholder vuoto.

#### Timeline
- Singola linea orizzontale con tutti gli eventi sovrapposti → clustering obbligatorio
- Categorie filtrabili ma tutti gli eventi condividono lo stesso spazio visivo
- Pan/zoom funzionano ma l'esperienza è "slider glorificato", non una mappa esplorativa

---

## 2 — Vincoli e principi guida

| Principio | Dettaglio |
|---|---|
| Lingua | English only, no i18n |
| Nessuna gamification | No achievement, no score, no unlock animation pesante |
| Nessun social | No sharing, no profiles online, no login |
| Sandbox nature | Le metriche non scientifiche usano range, non valori esatti |
| Mobile-first | Ogni feature deve funzionare su 320px viewport |
| Incremental | Nessun rewrite totale — ogni fase è deployabile |
| Plain CSS BEM | Nessuna migrazione a Tailwind/CSS Modules |
| React Context | Sufficiente per il numero di contesti attuale (3-4 max) |
| Preserve reusable internals | Se una feature UI viene rimossa, la logica interna può restare se utile a future iterazioni (es. log scale) |

---

## 3 — Piano per fasi

### ✅ Fase 0 — Rebranding + Micro-onboarding (Completata: 2026-04-20)

> **Stato:** Implementata. Da revisionare per polish.

1. ✅ **Rebrand → Kronoscope**: aggiornati `package.json` (name), `index.html` (title), `Headers.tsx` (brand text → `KRONOSCOPE`), `Footer.tsx` (copyright), `constants.ts` (landing intro), `README.md` (titolo e descrizione).
2. ✅ **Micro-onboarding perspectives**: progressive disclosure implementata in `Milestones.tsx`. Le tab perspective partono locked (tranne Classic) con bordo dashed e opacity ridotta + icona 🔒. Al primo click si sbloccano con toast animato che descrive la prospettiva. Stato persistito in `localStorage` (`pref_unlockedPerspectives`).
3. ✅ **CSS per onboarding**: `.tab--locked` (opacity 0.5, border dashed), `.tab__lock`, `.perspective-card__toast` (gradient indigo, animazione `toastIn`).

**Da revisionare:**
- [x] Verificare UX del toast su mobile (dimensioni, leggibilità, durata 3.5s appropriata?) — OK
- [x] Verificare che il rebranding sia completo (nessun "Age Milestones" residuo nel codice) — ✅ Confermato, nessun residuo in src/
- [x] Valutare se aggiungere un micro-hint iniziale ("Tap a locked tab to discover new perspectives") nella card body quando solo Classic è sbloccata — ✅ Implementato

---

### ✅ Fase 1 — Stabilizzazione (Completata: 2026-04-20)

**Obiettivo:** Fix bug noti, migliorare reattività e performance base.

#### 1.1 — Fix `perspOpen` reattivo al resize
**File:** [`src/pages/Milestones.tsx`](../../src/pages/Milestones.tsx)
**Cosa:** Aggiungere `matchMedia("(min-width:720px)")` listener che sincronizza `perspOpen` con il breakpoint. Su desktop: sempre aperto. Su mobile: rispetta lo stato del toggle.
**Perché:** Attualmente se l'utente ridimensiona desktop→mobile→desktop il pannello perspectives rimane nello stato precedente.
**Impatto:** Basso rischio, fix puntuale.

#### 1.2 — Throttle AgeTable tick
**File:** [`src/components/AgeTable.tsx`](../../src/components/AgeTable.tsx)
**Cosa:** Ricalcolare solo le righe della tab attualmente visibile. Passare `rows` come prop (già fatto) ma aggiungere un `useMemo` per evitare ricalcoli quando le rows non cambiano. Valutare `requestAnimationFrame` al posto di `setInterval(1000)`.
**Perché:** Il tick corrente ricalcola 8-13 righe ogni secondo indipendentemente dalla visibilità.
**Impatto:** Migliore performance mobile, meno GC pressure.

#### 1.3 — Sub-timeline outside-click dead zone
**File:** [`src/components/timeline/SubTimeline.tsx`](../../src/components/timeline/SubTimeline.tsx)
**Cosa:** Aggiungere un timeout di 300ms post-mount prima di attivare `useOutsideClick`. Questo previene chiusure accidentali da tocchi che aprono e immediatamente chiudono il pannello.
**Perché:** Su mobile, un tap sul gruppo può propagarsi e triggerare l'outside-click.
**Rischi:** Se il timeout è troppo lungo, l'utente potrebbe percepire il pannello come "non responsivo". 300ms è sotto la soglia percettiva di "attesa".

#### 1.4 — Consolidare resize listeners → `useMediaQuery`
**File:** Nuovo hook `src/hooks/useMediaQuery.ts`
**Cosa:** Creare un hook `useMediaQuery(query: string): boolean` basato su `window.matchMedia`. Sostituire i `window.addEventListener("resize")` manuali in `SubTimeline.tsx` (isMobile), `Milestones.tsx` (perspOpen), e `Headers.tsx` (se applicabile).
**Perché:** 3+ listener resize indipendenti → un singolo hook riutilizzabile.
**Impatto:** Pulizia codice, meno listener registrati.

#### 1.5 — Pulizia dead dependencies
**File:** `package.json`
**Cosa:** Rimuovere `date-fns` (non usato in codice attivo) e `@react-three/rapier` (non usato). Sono peso morto nel lockfile.
**Rischi:** Verificare che nessun import nascosto in `unused/` li referenzi.

---

### ✅ Fase 2 — Data Model: Metriche con Range (Completata: 2026-04-20)

**Obiettivo:** Distinguere metriche deterministiche da stime, mostrare range al posto di valori esatti per le stime.

#### 2.1 — Evoluzione `UnitRow` → `MetricRow`
**File:** [`src/utils/perspectivesConstants.ts`](../../src/utils/perspectivesConstants.ts), [`src/components/AgeTable.tsx`](../../src/components/AgeTable.tsx)
**Cosa:** Estendere il tipo:
```typescript
type MetricType = "deterministic" | "estimate";

type MetricRow = {
  label: string;
  seconds: number;           // valore base (mediana/media)
  type: MetricType;
  rangeFactor?: {             // solo per "estimate"
    low: number;              // es. 0.7 = -30% dal valore base
    high: number;             // es. 1.4 = +40% dal valore base
  };
  personalizable?: boolean;  // questo valore può essere raffinato dal profilo utente
  displayMode?: "fraction";
};
```
**Perché:** Il modello attuale tratta "Seconds" (deterministico) e "Heartbeats" (stima con varianza enorme) allo stesso modo. L'utente non può distinguerli visivamente.
**Impatto:** Breaking change per `UnitRow` type — tutti i consumer devono adattarsi. Mantenere backward compatibility con `type` opzionale che default a `"deterministic"`.

#### 2.2 — Annotare tutte le metriche
**File:** [`src/utils/perspectivesConstants.ts`](../../src/utils/perspectivesConstants.ts)
**Cosa:** Aggiungere `type` e `rangeFactor` a ogni riga:
- **Classic**: tutte `deterministic` (nessun range)
- **Biological**: tutte `estimate` con range. Es: Heartbeats `rangeFactor: { low: 0.8, high: 1.33 }` (60-100 bpm range)
- **Everyday**: tutte `estimate`. Es: Steps `rangeFactor: { low: 0.5, high: 2.0 }` (3000-12000 steps/day)
- **Nerdy**: tutte `estimate`
- **Cosmic**: tutte `deterministic` (costanti astronomiche)
- **Eons**: tutte `deterministic` (frazioni di costanti)

#### 2.3 — Display con range in AgeTable
**File:** [`src/components/AgeTable.tsx`](../../src/components/AgeTable.tsx)
**Cosa:** Per righe `type === "estimate"`:
- Mostrare il valore con prefisso `~` (es. "~2.8M")
- Usare `formatNice` da `format.ts` per arrotondamento aggressivo (ordine di grandezza, non cifre esatte)
- Tooltip on hover/tap che mostra il range completo: "2.2M – 3.7M"
- Visivamente: colore diverso o icona `≈` per distinguere le stime

**Perché:** Eliminare la falsa precisione è il singolo cambiamento UX con più impatto educativo.

#### 2.4 — Aggiornare formatDisplay per stime
**File:** [`src/utils/format.ts`](../../src/utils/format.ts)
**Cosa:** Aggiungere una funzione `formatEstimate(value: number): string` che usa arrotondamento più aggressivo di `formatDisplay`. Es: 2,847,293 → "~2.8M" invece di "2,847,293".

---

### ✅ Fase 3 — Personalizzazione Utente (Completata: 2026-04-20)

**Obiettivo:** Permettere all'utente di inserire parametri opzionali che raffinano i range delle metriche stimate.

#### 3.1 — UserProfileContext
**File:** Nuovo `src/context/UserProfileContext.tsx`
**Cosa:** Context con interfaccia:
```typescript
type UserProfile = {
  // Physical (opzionali)
  restingHeartRate?: number;     // bpm — raffina Heartbeats
  height?: number;               // cm — raffina stride length → Steps
  weight?: number;               // kg — raffina Calories

  // Lifestyle (opzionali)
  activityLevel?: "sedentary" | "moderate" | "active";
  sleepHoursPerDay?: number;     // raffina vari biological
  screenHoursPerDay?: number;    // raffina Nerdy metrics

  // Custom overrides (avanzato)
  customOverrides?: Record<string, number>;  // label → seconds override
};
```
Persistenza: `localStorage` key `"user_profile"`.
**Perché:** I parametri utente restringono i range delle stime, rendendo i numeri più personali senza pretendere precisione scientifica.

#### 3.2 — Pagina Personalize
**File:** [`src/pages/Personalize.tsx`](../../src/pages/Personalize.tsx)
**Cosa:** Sostituire i 3 MockCard con un form strutturato:
- **Sezione "About you"**: input opzionali per resting heart rate, height, weight
- **Sezione "Lifestyle"**: slider/select per activity level, sleep hours, screen time
- **Sezione "Advanced"**: possibilità di override custom per singole metriche
- Ogni campo ha un hint che spiega come influenza i calcoli
- Bottone "Reset to defaults"
**Perché:** La pagina Personalize è l'unico stub rimasto. È il prerequisito per rendere le metriche personali.

#### 3.3 — Range refinement engine
**File:** Nuovo `src/utils/refineMetrics.ts`
**Cosa:** Funzione `refineRange(row: MetricRow, profile: UserProfile): { low: number; high: number; base: number }` che, dato un profilo utente parziale, restringe il range. Es:
- Se `restingHeartRate = 65` → Heartbeats range si restringe attorno a 65 bpm
- Se `activityLevel = "active"` → Steps range si sposta verso l'alto
- Se nessun dato → range originale invariato
**Perché:** Il profilo non sostituisce i range, li raffina. L'utente vede il proprio range restringersi man mano che inserisce dati.

---

### ✅ Fase 4 — About Page Revamp + DOB Simplification + UX Polish (Completata: 2026-04-20)

**File:** [`src/pages/About.tsx`](../../src/pages/About.tsx), [`src/pages/Landing.tsx`](../../src/pages/Landing.tsx), [`src/pages/Personalize.tsx`](../../src/pages/Personalize.tsx), [`src/pages/Milestones.tsx`](../../src/pages/Milestones.tsx), [`src/pages/Timescales.tsx`](../../src/pages/Timescales.tsx), [`src/components/AgeTable.tsx`](../../src/components/AgeTable.tsx), [`src/components/ErrorBoundary.tsx`](../../src/components/ErrorBoundary.tsx)

**Cosa implementato:**
1. **About page revamp** — Sostituito `dangerouslySetInnerHTML` con 5 sezioni JSX strutturate: "What is Kronoscope?", "Why these numbers aren't precise", "Six perspectives", "The nature of time perception", "Open sandbox".
2. **DOB selector semplificato** — Rimosso il wizard modale complesso. Sostituito con `BirthDatePicker.tsx` inline: due input nativi (date + time) senza steps, senza modal.
3. **Landing page** — Date picker inline nella card, testo intro in JSX.
4. **Personalize page** — Sezione "Birth date" in cima con `BirthDatePicker`, profilo utente, e pulsanti **Reset to defaults** + **Save & Explore** (abilitato solo se DOB impostata, naviga a `/milestones`).
5. **AgeTable — Toggle "Show ranges"** — Pulsante `≈ Show ranges` sopra la tabella (visibile solo per tab con stime). Quando attivo, mostra `low – high` invece di `~valore` per le righe stimate. Pulsante `?` (HowMuchHint) mostrato anche per le righe stimate.
6. **ErrorBoundary globale** — `ErrorBoundary.tsx` avvolge l'intera app in `main.tsx`. Previene la schermata bianca (solo background) in caso di errori runtime — mostra fallback UI con messaggio d'errore e link "Go home".
7. **Timescales blank page — root cause fix** — Bug in `PhenomenaComparator.tsx` righe 90-91: `slotA!.label` veniva valutato anche quando `slotA === null` (se l'utente selezionava solo il fenomeno B), causando `TypeError: can't access property "label", slotA is null` che smontava l'intera app. Fix: sostituito `slotA!.label` con `slotA?.label ?? ""` in entrambe le variabili `longerLabel`/`shorterLabel`. L'`ErrorBoundary` rimane come safety net per errori simili futuri.

---

### ✅ Fase 5 — Timeline Evolution: verso il Time Map (Completata: 2026-04-20)

> **Nota:** Questa è la fase più ambiziosa e può essere suddivisa in sub-fasi.

**Obiettivo:** Evolvere la timeline da slider a sistema a lane parallele ("Time Map").

#### 5.1 — Lane architecture
**File:** [`src/components/timeline/Timeline.tsx`](../../src/components/timeline/Timeline.tsx) + nuovi file
**Cosa:** Introdurre il concetto di "lane" — strisce orizzontali parallele:
- **Lane Personal**: birth, today, midpoint, milestones numerici
- **Lane Historical**: eventi da `historical-events.json`, suddivisi per categoria (sub-lane opzionali)
- **Lane Scale Markers**: riferimenti temporali (ere geologiche, fenomeni)

Tutte le lane condividono lo stesso `Viewport` (center + spanMs) e lo stesso `scaleMode`.
**Perché:** La singola linea con tutti gli eventi sovrapposti causa clustering eccessivo e sovrapposizioni. Le lane separano naturalmente i livelli di informazione.
**Rischi:** Complessità CSS significativa. Altezza totale cresce con il numero di lane → necessario sistema di collapse/expand per lane.

#### 5.2 — Detail panel sostitutivo
**File:** [`src/components/timeline/SubTimeline.tsx`](../../src/components/timeline/SubTimeline.tsx) → refactor
**Cosa:** Sostituire la SubTimeline (overlay/bottom-sheet per gruppi) con un **detail panel** ancorato:
- Desktop: pannello laterale o popup posizionato sotto il marker selezionato
- Mobile: half-sheet con swipe-to-dismiss (Framer Motion `drag="y"` + `dragConstraints`)
**Perché:** Il pattern sub-timeline attuale (mini-timeline espansa) è confuso. Un detail panel è più intuitivo.

#### 5.3 — Lane visibility controls
**File:** `PreferencesContext.tsx` + `Milestones.tsx`
**Cosa:** Toggle per mostrare/nascondere lane individuali. Persistito in `PreferencesContext`.
**Perché:** Non tutti gli utenti vogliono vedere tutte le lane contemporaneamente.

---

### ✅ Fase 6 — Timeline Core Refactor: grouping, viewport safety, interaction cleanup (Completata: 2026-04-21)

**Obiettivo:** Rendere la timeline più stabile, meno rumorosa e meno aggressiva nel clustering, senza buttare via il motore già costruito in Fase 5.

> **Stato:** Implementata.

**Cosa implementato:**
1. **Safe viewport layer** in `scaleTransform.ts` + `Timeline.tsx`: introdotti `isValidRange`, `createViewportFromRange`, `sanitizeViewport` e fallback locale della timeline per stati invalidi.
2. **Grouping dinamico e conservativo** in `buildRenderItems.ts`: soglia derivata da zoom/densità, con forte riduzione del clustering ad alto zoom e nessun grouping per eventi semplicemente clamped fuori range.
3. **Rimozione della UI Log** in `TimelineControls.tsx`: il toggle `Lin/Log` è stato rimosso dalla surface pubblica; la logica di trasformazione resta disponibile internamente per riuso futuro.
4. **Time grid più dinamica + rumore ridotto**: `generateTicks()` ora copre meglio range ravvicinati (mese/settimana/giorno) e la hover date preview continua è stata rimossa.
5. **Validazione**: aggiunti test unitari per viewport/ticks e per il nuovo comportamento di grouping; build e test passano.

#### 6.1 — Grouping logic refinement (zoom-aware, conservative)
**File:** `src/components/timeline/buildRenderItems.ts`, `src/components/timeline/types.ts`, `src/components/timeline/Timeline.tsx`
**Cosa:** Sostituire la logica basata su `GROUPING_GAP_PX` fisso con una soglia dinamica derivata da:
- livello di zoom / `viewport.spanMs`
- larghezza asse effettiva
- densità reale degli eventi nella lane attiva

Regola attesa:
- **zoom alto** → grouping quasi nullo
- **zoom medio** → grouping raro e solo su collisioni reali
- **zoom basso** → grouping attivo ma controllato, senza trasformare la lane in una serie di cluster onnipresenti

**Perché:** il clustering attuale è troppo pervasivo e produce una percezione di timeline "compressa" anche quando gli eventi dovrebbero rimanere leggibili individualmente.

**Nota di design:** il grouping deve diventare una strategia di collision management, non il comportamento dominante.

#### 6.2 — Safe viewport + guard per errore ricorrente `center`
**File:** `src/components/timeline/Timeline.tsx`, `src/utils/scaleTransform.ts`, `src/components/ErrorBoundary.tsx`
**Cosa:** Formalizzare guard per impedire stati invalidi del viewport:
- nessun render se `range.start >= range.end` senza fallback valido
- nessuna trasformazione se `center`/`spanMs` sono non finiti o derivano da dati invalidi
- fallback UI locale della timeline se il viewport non è costruibile
- recovery path esplicito invece di dipendere solo dal boundary globale

**Perché:** il bug "property `center` null" non deve più poter portare alla perdita completa dell'interfaccia.

#### 6.3 — UI simplification: rimozione del pulsante Log, non del motore
**File:** `src/components/timeline/TimelineControls.tsx`, `src/context/PreferencesContext.tsx`, `src/utils/scaleTransform.ts`
**Cosa:** Rimuovere dalla UI la "log view" / il toggle `Lin/Log`, mantenendo però la logica `scaleMode` internamente riutilizzabile in futuro.

**Perché:** l'obiettivo è semplificare la superficie di interazione, non distruggere una capacità tecnica che potrebbe tornare utile in contesti specifici.

**Trade-off accettato:** meno opzioni visibili oggi, più chiarezza per l'utente; il codice di trasformazione può restare dietro feature flag o API interna.

#### 6.4 — Time grid dinamica + rimozione hover date preview continua
**File:** `src/utils/scaleTransform.ts`, `src/components/timeline/Timeline.tsx`, `src/css/timeline.css`
**Cosa:**
- rendere le linee verticali / tick realmente adattive allo zoom
- eliminare completamente la hover preview costante della data durante scroll/pan
- lasciare il dettaglio temporale solo in focus state, marker selezionati e detail panel

**Perché:** la hover preview continua aggiunge rumore cognitivo e interferisce con l'esperienza di esplorazione mobile/touch.

---

### ✅ Fase 7 — Timeline Information Architecture: future events + two-lane model (Completata: 2026-04-21)

**Obiettivo:** ripulire la semantica della timeline e ridurre la frammentazione visiva a due lane principali: **Personal** e **Global**.

> **Stato:** Implementata.

**Cosa implementato:**
1. **Dataset separato per il futuro** — introdotto `public/data/projected-events.json` con eventi editoriali dedicati e campi espliciti `projectionType` + `certainty`.
2. **Hook dedicato** — aggiunto `useProjectedEvents()` parallelo a `useHistoricalEvents()` con cache sessione e parsing centralizzato in `src/types/events.ts`.
3. **Timeline a due lane** — migrazione completata da `personal | historical | markers` a `personal | global`; marker numerici, eventi storici e future projections confluiscono nella lane `global`.
4. **Compatibilità legacy** — `PreferencesContext` normalizza i valori salvati in `localStorage` (`historical` / `markers` → `global`) evitando regressioni per utenti esistenti.
5. **Distinzione epistemica esplicita** — hover label, detail panel e marker 2D/3D distinguono ora chiaramente `Past event`, `Future projection`, `Global reference` e `Personal marker`.

#### 7.1 — Dataset separato per gli eventi futuri
**File:** nuovo `public/data/projected-events.json`, `src/hooks/useHistoricalEvents.ts` (o hook parallelo), `src/types/events.ts`
**Cosa:** Introdurre un dataset separato dedicato agli eventi futuri previsti / stimati / culturali / cosmici.

**Perché:** mescolare eventi passati e proiezioni nello stesso file storico riduce chiarezza editoriale e semantica. Un file separato rende esplicito che si tratta di proiezioni, non di fatti storici consolidati.

**Principio:** stesso shape base del dataset storico quando possibile, con campi aggiuntivi per `projectionType`, `certainty` o label di natura stimata.

#### 7.2 — Distinzione forte tra `past events` e `future projections`
**File:** `src/components/timeline/EventElement.tsx`, `src/components/timeline/types.ts`, `src/css/timeline.css`
**Cosa:** Ogni evento globale deve dichiarare il proprio stato temporale / epistemico:
- `past event`
- `future projection`

La distinzione deve essere visibile con:
- gerarchia visiva differente
- pattern, badge o treatment grafico dedicato
- copy esplicito nel detail panel

**Perché:** il futuro non va trattato come se fosse un fatto equivalente al passato. Non basta cambiare colore.

#### 7.3 — Semplificazione lane: `Personal` + `Global`
**File:** `src/components/timeline/types.ts`, `src/pages/Milestones.tsx`, `src/context/PreferencesContext.tsx`
**Cosa:** Evolvere da `personal | historical | markers` a:
1. **Personal lane** — DOB, today, midpoint, milestone personali
2. **Global lane** — eventi storici, scientifici, cosmici, scale references, projected events

**Perché:** tre lane separate oggi espongono dettagli implementativi più che modelli mentali utili. La semplificazione a due lane riflette meglio il prodotto: "me" vs "the world / the universe".

**Nota:** categorie e metadata restano filtrabili, ma non diventano lane indipendenti.

#### 7.4 — Breakdown dettagliato modifiche timeline
**Output consegnato da questa fase:**
- lane più chiare: `Personal` + `Global`
- projected events come layer concettuale separato e curato editorialmente
- detail panel e hover label con copy esplicito sullo statuto degli eventi
- persistenza lane backward-compatible con dati legacy

---

### ✅ Fase 8 — Timeline UX Cleanup + Mobile Layout Stability (Completata: 2026-04-21)

**Obiettivo:** trasformare la timeline in un contenitore fisico e leggibile, eliminando fragilità mobili e layout troppo rigidi.

> **Stato:** Implementata.

**Cosa implementato:**
1. **Timeline più fisica e leggibile** — `timeline.css` ora enfatizza frame esterno, surface interna, lane come contenitori separati e stati vuoti locali più leggibili.
2. **Surface semplificata** — `Milestones.tsx` usa ora un header più chiaro del Time Map; il 3D è stato de-enfatizzato come azione sperimentale secondaria invece di toggle primario 2D/3D.
3. **Mobile fixes trasversali** — navbar sticky con safe-area, `AgeTable` senza scroll verticale interno, input/actions più fluidi in `Personalize`, riduzione di altezze rigide e nested scroll non necessari in `Timescales`.
4. **Stability hardening locale** — introdotto `SectionErrorBoundary` e usato nelle aree critiche (`AgeTable`, timeline, Timescales, Landing, About) così gli errori locali non ricadono subito sul boundary globale.

#### 8.1 — Visual redesign della timeline
**File:** `src/css/timeline.css`
**Cosa:** Rafforzare:
- bordi esterni della timeline
- padding e spacing coerenti
- separazione visiva tra background, lane e marker
- percezione delle lane come contenitori fisici, non overlay piatti

**Perché:** oggi la timeline è funzionale ma poco strutturata visivamente. Serve una gerarchia più netta per supportare esplorazione e comprensione.

#### 8.2 — Timeline surface semplificata
**File:** `src/components/timeline/Timeline.tsx`, `src/components/timeline/TimelineControls.tsx`
**Cosa:** Mantenere solo:
- timeline view
- zoom / pan

Rimuovere ogni affordance o linguaggio che suggerisca viste parallele o modalità secondarie non essenziali.

#### 8.3 — Mobile UX fixes trasversali
**File:** `src/css/navbar.css`, `src/css/timeline.css`, `src/css/personalize.css`, altri CSS layout-based
**Cosa:**
- navbar sticky sempre visibile top
- miglioramento allineamento box e card su viewport stretti
- tabelle senza scroll interno, espanse verticalmente
- rimozione di height fisse dai componenti critici dove bloccano il flusso naturale del contenuto

**Perché:** la stabilità mobile è la priorità assoluta del refactor_3.

#### 8.4 — Stability hardening: boundary + fallback locali
**File:** `src/components/ErrorBoundary.tsx`, `src/components/timeline/Timeline.tsx`, pagine principali
**Cosa:**
- nessuna perdita totale UI in caso di eccezione locale
- boundary globale come safety net, non come prima linea difensiva
- fallback state sempre validi per timeline, settings, about e landing

**Perché:** un sandbox esplorativo non può degradare in pagina vuota per un singolo edge case.

---

### ✅ Fase 9 — Settings Refactor + DOB Governance (Completata: 2026-04-21)

**Obiettivo:** centralizzare tutte le modifiche ai dati utente in un'unica pagina coerente, rinominando `Personalize` in `Settings`.

> **Stato:** Implementata.

**Cosa implementato:**
1. **Rename pagina e route** — introdotti `src/pages/Settings.tsx` e route `/settings`; mantenuto redirect legacy da `/personalize` a `/settings` per non rompere bookmark esistenti.
2. **Navbar riallineata** — `Headers.tsx` ora espone `Settings` come voce di navigazione primaria; il quick action `Edit birth date` è stato rimosso del tutto.
3. **DOB governance centralizzata** — Landing, About, Milestones e i fallback locali rimandano ora esplicitamente a `Settings` come unica fonte di configurazione di DOB e profilo.
4. **UI settings più coerente** — la pagina ora usa copy e gerarchia da hub unico (`Identity & birth date`, `Personal metrics`, `Lifestyle modifiers`, `Reset profile`, `Save settings`).

#### 9.1 — Rename `Personalize` → `Settings`
**File:** `src/pages/Personalize.tsx` → `Settings.tsx`, `src/components/common/Headers.tsx`, `src/main.tsx`, `src/pages/Landing.tsx`
**Cosa:** Rinominare la pagina e l'etichetta di navigazione per riflettere che non si tratta solo di personalizzazione ma di gestione centralizzata di DOB, profilo e preferenze.

#### 9.2 — Rimozione del pulsante `Edit Birth Date`
**File:** `src/components/common/Headers.tsx`, `src/pages/Milestones.tsx`
**Cosa:** Eliminare il pulsante rapido dalla navbar e spostare completamente la gestione DOB in Settings.

**Perché:** il DOB è un'informazione primaria di configurazione, non un'azione contestuale da spargere in più entry point.

#### 9.3 — UI settings uniforme
**File:** `src/pages/Settings.tsx`, `src/css/personalize.css` (o CSS rinominato in seguito)
**Cosa:** Organizzare la pagina in box coerenti:
- Identity / birth date
- Personal metrics
- Lifestyle modifiers
- Reset / save / warnings

**Perché:** serve una information architecture unica e prevedibile.

---

### ✅ Fase 10 — DOB Validation UX + Access Guardrails (Completata: 2026-04-21)

**Obiettivo:** rendere esplicito quando la timeline non può essere usata e quando le stime sono meno affidabili.

> **Stato:** Implementata.

**Cosa implementato:**
1. **Missing DOB: stato rosso esplicito** — `Landing`, `Milestones` e `Settings` mostrano ora banner/blocchi chiari quando il DOB manca, invece di affidarsi a redirect silenziosi o soli pulsanti disabilitati.
2. **Warning all'uscita da Settings** — `Settings.tsx` intercetta la navigazione navbar quando il DOB è assente e mostra un warning esplicito; è stato aggiunto anche un guard `beforeunload` per refresh/chiusura tab.
3. **Cancellazione DOB esplicita** — `BirthDatePicker.tsx` ora permette di rimuovere il DOB tramite `Clear birth date`, usando `clearBirthDate()` nel contesto.
4. **Warning giallo profilo incompleto** — `Settings.tsx` mostra un warning non bloccante quando mancano campi opzionali che renderebbero le stime più personali.

#### 10.1 — Missing DOB: blocking red state
**File:** `src/pages/Landing.tsx`, `src/pages/Milestones.tsx`, `src/pages/Settings.tsx`
**Cosa:** Se il DOB non è impostato:
- bloccare accessi alle aree che dipendono dal DOB
- mostrare errore rosso chiaro e non ambiguo

#### 10.2 — Reset senza DOB: warning all'uscita da Settings
**File:** `src/pages/Settings.tsx`, `src/context/BirthDateContext.tsx`
**Cosa:** Se l'utente resetta / cancella i dati e prova a uscire senza DOB, mostrare warning esplicito.

#### 10.3 — Campi opzionali mancanti: warning giallo non bloccante
**File:** `src/pages/Settings.tsx`
**Cosa:** Mostrare hint tipo:
> Estimates will be less precise without these details.

**Perché:** il prodotto deve comunicare qualità e limiti dei dati senza punire l'utente.

---

### ✅ Fase 11 — About FAQ + deep links “How it works” (Completata: 2026-04-21)

**Obiettivo:** trasformare About in una documentazione orientata all'uso e collegare ogni area principale alla sua spiegazione dedicata.

> **Stato:** Implementata.

**Cosa implementato:**
1. **About FAQ-based** — `src/pages/About.tsx` è stata ristrutturata in 4 sezioni canoniche deep-linkabili: `general`, `timeline`, `timescales`, `settings`.
2. **Hash navigation affidabile** — aggiunti helper condivisi in `src/utils/aboutLinks.ts` e scroll controllato su `location.hash` dentro `About.tsx`, con offset gestito via `scroll-margin-top` per convivere con la navbar sticky.
3. **CTA contestuali `How it works`** — aggiunti link contestuali in `Landing.tsx`, `Milestones.tsx`, `Timescales.tsx` e `Settings.tsx` che puntano direttamente alla FAQ rilevante.
4. **Polish visuale** — `components.css` e `personalize.css` aggiornati per supportare la nuova IA dell'About (hero card, section nav, FAQ cards, contextual links) senza rompere il layout mobile-first.

#### 11.1 — About page FAQ-based
**File:** `src/pages/About.tsx`, `src/utils/aboutLinks.ts`, `src/css/components.css`, `src/css/personalize.css`
**Cosa:** Ristrutturare in sezioni FAQ:
1. General concept
2. Timeline system
3. Timescales system
4. Personalization / Settings system

#### 11.2 — CTA `How it works` in landing
**File:** `src/pages/Landing.tsx`
**Cosa:** Aggiungere un pulsante / link secondario sotto la descrizione breve che mandi alla sezione FAQ corretta in About.

#### 11.3 — Deep links dai componenti principali
**File:** pagine principali e card/section headers rilevanti
**Cosa:** Ogni area maggiore deve offrire un link contestuale `How it works` che scrolli direttamente alla sezione FAQ corrispondente.

---

### ✅ Fase 12 — 3D Strategy Rationalization (Completata: 2026-04-21)

**Obiettivo:** Definire il ruolo del 3D nel progetto e razionalizzare l'investimento.

> **Stato:** Implementata.

**Cosa implementato:**
1. **3D come opt-in sperimentale ma più stabile** — mantenuto il rendering con `@react-three/fiber` + `@react-three/drei`, ma introdotto un profilo `low-power` per mobile e `prefers-reduced-motion`, senza aggiungere nuove librerie 3D.
2. **Scene 3D lane-aware** — la scena usa ora due rail espliciti `Personal` / `Global` invece di mescolare tutti i marker sullo stesso asse Y; i connector dei marker puntano alla rail corretta.
3. **Marker personali corretti** — milestone numeriche personali come `10,000 days`, `500 months`, `1 billion seconds` sono tornate nella `personal` lane in `Milestones.tsx`, evitando che spariscano quando la lane globale è nascosta.
4. **Edge grouping nel 2D** — `buildRenderItems.ts` ora crea group bubble ai bordi per gli eventi fuori viewport, così a sinistra/destra estrema non si vede più solo il marker clamped più vicino ma il conteggio dei marker oltre il limite visibile.
5. **2D/mobile hardening** — `Timeline.tsx` riduce i rerender frequenti (tick `now` meno aggressivo), gestisce `pointercancel/lostpointercapture`, stabilizza la selezione dei marker e usa `EventElement` memoizzato.
6. **Responsive audit finale** — layout principali riallineati a `max-width`, flex/grid e breakpoint coerenti in Landing, Settings, Timescales, AgeTable e 3D labels/surfaces.

#### Analisi critica

| Aspetto | Valutazione |
|---|---|
| Bundle size | ~307kB gzip (lazy) — accettabile come opt-in |
| Performance mobile | Problematica: GPU overhead, thermal throttling, battery drain |
| Accessibilità | Zero: no keyboard nav, no screen reader, no reduced motion |
| Touch conflicts | OrbitControls compete con pan/pinch della timeline 2D |
| Valore aggiunto | Basso: la visualizzazione 3D non aggiunge informazione rispetto al 2D |
| Manutenzione | Alta: Three.js ecosystem è instabile, breaking changes frequenti |

#### Decisione finale
- **Mantenere** il 3D come opt-in sperimentale, non come surface primaria
- **Non introdurre** nuove librerie 3D: lo stack attuale (`@react-three/fiber` + `@react-three/drei`) è sufficiente se configurato meglio
- **Usare profili qualità** (`balanced` / `low-power`) per stabilità mobile invece di espandere la complessità del motore
- **Continuare a investire nel 2D** come esperienza principale, con grouping edge-aware e lane semantics più accurate
- **Documentare** esplicitamente che il 3D resta secondario rispetto alla timeline 2D

---

### 3.x — UX architecture changes summary

Le nuove fasi 6-11 consolidano alcuni principi trasversali:

- **Single source of truth per i dati utente** → DOB e profiling vivono in Settings, non in scorciatoie disperse
- **Timeline come spazio esplorabile, non come widget multi-mode** → meno toggle, più chiarezza
- **Due sole lane mentali** → Personal / Global
- **Futuro come proiezione, non come fatto** → dataset separato + gerarchia visiva esplicita
- **Fallback locali prima del boundary globale** → resilienza maggiore e meno schermate vuote
- **Mobile layout prima di tutto** → sticky nav, contenitori verticali, no scroll annidati non necessari

---

## 4 — Tech Evaluation

### Stack attuale sufficiente?

| Area | Valutazione | Azione |
|---|---|---|
| React 19 + Context | ✅ Sufficiente per 3-4 contesti | Nessuna migrazione |
| State management | ✅ Context OK | Se si superano 5+ contesti → valutare Zustand (~2kB) |
| CSS plain BEM | ✅ Funzionale | Nessuna migrazione |
| `dayjs` | ✅ Leggero, copre tutti i casi | Rimuovere `date-fns` (non usato) |
| `framer-motion` | ✅ Già in uso | Espandere per transizioni lane e detail panel |
| `@react-three/*` | ⚠️ Pesante, mantenere opt-in | Rimuovere `@react-three/rapier` |
| Vitest | ✅ | Aggiungere test per nuove feature |

### Librerie potenziali

| Libreria | Scopo | Dimensione | Priorità |
|---|---|---|---|
| `@use-gesture/react` | Unificare pinch/pan/drag | ~3kB gzip | Media — valutare se `usePinchZoom` custom diventa limitante |
| `zustand` | State management leggero | ~2kB gzip | Bassa — solo se contesti > 5 |

---

## 5 — Further Considerations

### 5.1 — Rischi

| Rischio | Mitigazione |
|---|---|
| Overcomplexity (Time Map + profilo + range) | Fasi incrementali, ogni fase deployabile. Non iniziare Fase 5 prima di consolidare Fasi 1-3 |
| Cognitive overload utente | Progressive disclosure (micro-onboarding già implementato). Default semplice, complessità opt-in |
| Regressioni CSS desktop durante refactor lane | Screenshot diff con Playwright visual regression |
| Performance Time Map con molte lane | Lazy rendering: solo lane visibili nel viewport. `will-change` solo durante pan/zoom |
| Grouping dinamico troppo aggressivo o troppo permissivo | Introdurre soglie min/max e verificare comportamento su range brevi, medi e lunghi |
| Confusione semantica tra eventi futuri e storici | Tenere `projected-events.json` separato e usare copy/gerarchia visiva dedicati |
| Regressioni mobile da fix CSS trasversali | Checklist viewport 320/360/390/480/720 prima di considerare chiusa ogni fase |
| Settings come unico entry-point DOB percepito come frizione | CTA chiare da Landing e guardrail espliciti nelle pagine che dipendono dal DOB |
| Conservare la logica log-scale senza UI pubblica crea debito morto | Documentare che è logica interna riutilizzabile e rivalutarla al termine del refactor_3 |

### 5.2 — Idee future (fuori scope refactor_3)

- **Time comparison mode**: "What if I was born in 1900?" — ricalcolo parallelo
- **Shareable snapshot**: export PNG/SVG della propria timeline (no social, solo download)
- **Audio exploration**: sonificazione delle scale temporali
- **Plugin system**: permettere metriche custom da fonti esterne (JSON/API)

### 5.3 — Naming
Il progetto è stato rinominato **Kronoscope** (Fase 0). Il nome evoca:
- **Kronos** (Χρόνος): il tempo
- **-scope** (σκοπέω): strumento per osservare
- Coerente con la natura sandbox/strumento esplorativo

### 5.4 — Migration strategy (incrementale, non breaking)

1. **Prima il motore, poi la pelle:** introdurre grouping dinamico, guard del viewport e dataset projected senza cambiare subito tutta la UI.
2. **Poi semplificare la semantica:** migrare da 3 lane a 2 lane mantenendo adapter temporanei (`historical`/`markers` → `global`) finché i consumer non sono allineati.
3. **Poi rimuovere UI ridondante:** togliere il pulsante log dalla toolbar senza eliminare `scaleMode` dal core.
4. **Poi centralizzare i dati utente:** rinominare Personalize in Settings e spostare lì DOB + profile editing.
5. **Infine documentare e razionalizzare:** FAQ deep-linked e strategia 3D solo dopo aver stabilizzato il 2D.

### 5.5 — Checklist implementativa finale

- [x] Inserire `projected-events.json` con shape coerente al dataset storico
- [x] Ridurre il clustering automatico a collision management zoom-aware
- [x] Migrare la timeline a due lane: Personal / Global
- [x] Rendere il time grid realmente adattivo allo zoom
- [x] Rimuovere l'hover date preview continua
- [x] Rimuovere dalla UI il toggle log mantenendo la logica interna riusabile
- [x] Rendere la navbar sticky e rimuovere height fisse critiche
- [x] Eliminare scroll interni non necessari nelle tabelle
- [x] Aggiungere guard e fallback per stati viewport invalidi / `center`
- [x] Rinominare Personalize in Settings
- [x] Spostare completamente la gestione DOB in Settings
- [x] Aggiungere feedback rosso/giallo per missing DOB e dati opzionali assenti
- [x] Convertire About in FAQ con anchor link per Timeline / Timescales / Settings
- [x] Rivalutare il 3D solo dopo la stabilizzazione del 2D

---

## 6 — Checklist per fase

| Fase | Stato | Dipendenze |
|---|---|---|
| Fase 0 — Rebranding + Micro-onboarding | ✅ Completata + revisionata | Nessuna |
| Fase 1 — Stabilizzazione | ✅ Completata | Nessuna |
| Fase 2 — Data Model: Metriche con Range | ✅ Completata | Fase 1 |
| Fase 3 — Personalizzazione Utente | ✅ Completata | Fase 2 |
| Fase 4 — About Page Revamp + DOB Simplification | ✅ Completata | Fase 0 |
| Fase 5 — Timeline Evolution (Time Map) | ✅ Completata | Fase 1, Fase 2 |
| Fase 6 — Timeline Core Refactor | ✅ Completata | Fase 5 |
| Fase 7 — Timeline IA: Future Events + Two-Lane Model | ✅ Completata | Fase 6 |
| Fase 8 — Timeline UX Cleanup + Mobile Stability | ✅ Completata | Fase 6, Fase 7 |
| Fase 9 — Settings Refactor + DOB Governance | ✅ Completata | Fase 3, Fase 8 |
| Fase 10 — DOB Validation UX + Access Guardrails | ✅ Completata | Fase 9 |
| Fase 11 — About FAQ + Deep Links | ✅ Completata | Fase 9 |
| Fase 12 — 3D Strategy | ✅ Completata | Fase 6, Fase 8 |

---

*Questo piano è un documento vivente. Aggiornare lo stato delle fasi man mano che vengono completate.*
