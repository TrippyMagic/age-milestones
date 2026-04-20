# PLAN — Refactor 3: Kronoscope Evolution

**Data:** 2026-04-20
**Stato:** 🚧 In corso

---

## Executive Summary

Il progetto "Age Milestones" viene rinominato **Kronoscope** e trasformato da calcolatore di età a *time exploration sandbox* multi-paradigma. Il refactor si concentra su: (1) stabilizzazione mobile e bug fix, (2) modello dati con range per metriche stimate, (3) personalizzazione utente, (4) evoluzione timeline verso un sistema a lane ("Time Map"), (5) strategia 3D razionalizzata.

**Vincoli dichiarati:** lingua inglese, no i18n, no gamification, no social features. Il progetto resta un sandbox sperimentale/didattico.

**Priorità:** Mobile UX + stabilità > Modello dati accurato > Personalizzazione > Time Map > 3D

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

### Fase 5 — Timeline Evolution: verso il Time Map (stimata: 5-8 giorni)

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

### Fase 6 — 3D Strategy Rationalization (stimata: 1-2 giorni)

**Obiettivo:** Definire il ruolo del 3D nel progetto e razionalizzare l'investimento.

#### Analisi critica

| Aspetto | Valutazione |
|---|---|
| Bundle size | ~307kB gzip (lazy) — accettabile come opt-in |
| Performance mobile | Problematica: GPU overhead, thermal throttling, battery drain |
| Accessibilità | Zero: no keyboard nav, no screen reader, no reduced motion |
| Touch conflicts | OrbitControls compete con pan/pinch della timeline 2D |
| Valore aggiunto | Basso: la visualizzazione 3D non aggiunge informazione rispetto al 2D |
| Manutenzione | Alta: Three.js ecosystem è instabile, breaking changes frequenti |

#### Decisione proposta
- **Mantenere** il toggle 3D come "demo/toy" opt-in — non eliminarlo
- **Non espandere** l'uso 3D oltre la timeline
- **Investire** in 2D ricco: SVG per scale visualization, Canvas 2D per timeline ad alte prestazioni se necessario
- **Documentare** che il 3D è un esperimento, non il paradigma primario
- Valutare rimozione di `@react-three/rapier` (non usato)

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

---

## 6 — Checklist per fase

| Fase | Stato | Dipendenze |
|---|---|---|
| Fase 0 — Rebranding + Micro-onboarding | ✅ Completata + revisionata | Nessuna |
| Fase 1 — Stabilizzazione | ✅ Completata | Nessuna |
| Fase 2 — Data Model: Metriche con Range | ✅ Completata | Fase 1 |
| Fase 3 — Personalizzazione Utente | ✅ Completata | Fase 2 |
| Fase 4 — About Page Revamp + DOB Simplification | ✅ Completata | Fase 0 |
| Fase 5 — Timeline Evolution (Time Map) | 🔲 Da fare | Fase 1, Fase 2 |
| Fase 6 — 3D Strategy | 🔲 Da fare | Nessuna |

---

*Questo piano è un documento vivente. Aggiornare lo stato delle fasi man mano che vengono completate.*

