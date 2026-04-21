# Decisioni di Refactoring — Fase 0
**Data di completamento:** 2026-04-20
**Fase:** 0 — Rebranding + Micro-onboarding

---

## D-01 — Scelta del nome "Kronoscope"

**Decisione:** Il progetto è stato rinominato da "Age Milestones" a "Kronoscope".

**Motivazione:** "Age Milestones" suggeriva un calcolatore di età con milestone predefinite — troppo limitante per la direzione sandbox esplorativa multi-paradigma. "Kronoscope" combina Kronos (tempo) + -scope (strumento per osservare), evocando esplorazione e osservazione del tempo piuttosto che semplice calcolo.

**Alternative valutate:**
- "Chronoscope" — corretto etimologicamente ma generico, già usato da altri progetti
- "TimeScope" — troppo generico
- "Temporal Sandbox" — descrittivo ma non memorabile
- "Aeon Explorer" — focalizzato su scale cosmiche, troppo ristretto
- "Time Prism" — buono ma non evoca lo strumento/sandbox

**File modificati:** `package.json`, `index.html`, `Headers.tsx`, `Footer.tsx`, `constants.ts` (landing intro), `README.md`.

**Impatto:** Nessuna regressione funzionale. Cambiamento puramente cosmetico.

**Da verificare:** Ricerca di "Age Milestones" residuo in commenti, AGENTS.md, e altri documenti.

---

## D-02 — Micro-onboarding con progressive disclosure

**Decisione:** Le tab delle perspectives (Biological, Everyday, Nerdy, Cosmic, Eons) partono visivamente "locked" con bordo dashed, opacity ridotta e icona 🔒. Al primo click si sbloccano con un toast animato. "Classic" è sempre sbloccata. Lo stato è persistito in `localStorage`.

**Motivazione:** 6 tab in una volta possono sopraffare l'utente (specialmente mobile). Il progressive disclosure guida l'esplorazione: l'utente inizia con Classic (familiare: anni, mesi, giorni) e scopre gradualmente le prospettive più insolite. Ogni unlock è un micro-momento di scoperta che invita ad esplorare.

**Alternative valutate:**
- **Tutte sbloccate + tooltip educativo**: meno friction ma nessun incentivo a esplorare
- **Unlock sequenziale forzato** (sbloccare Biological richiede aver visto Classic): troppo rigido, frustrante
- **Unlock con achievement/gamification**: escluso dal vincolo "no gamification"
- **Nessun onboarding**: status quo, nessun miglioramento percettivo

**Scelta di design — click sblocca immediatamente:** L'utente non deve "completare" nulla per sbloccare. Il click stesso è l'azione. Nessun gate, nessun requisito. L'effetto locked è puramente visivo/attenzionale.

**localStorage key:** `pref_unlockedPerspectives` — array JSON di nomi tab sbloccate.

**Toast:** Durata 3.5 secondi, animazione `toastIn` (fade-in + slide-up), stile gradient indigo coerente con il design system.

**File modificati:** `Milestones.tsx` (logica unlock + toast), `components.css` (stili `.tab--locked`, `.tab__lock`, `.perspective-card__toast`).

**Rischi identificati:**
- Toast potrebbe essere troppo piccolo su mobile → da verificare
- 3.5s potrebbe essere troppo breve per leggere il teaser → da verificare
- Se l'utente pulisce localStorage, tutte le tab si ri-lockano → accettabile, è un re-discovery

---

## D-03 — Struttura del piano evolutivo (refactor_3)

**Decisione:** Il piano è strutturato in 7 fasi (0-6) con dipendenze esplicite. Ogni fase è deployabile indipendentemente. Le fasi più rischiose (5 — Time Map) dipendono dalle fasi di stabilizzazione (1) e data model (2).

**Motivazione:** I refactor precedenti (refactor_1, refactor_2) hanno dimostrato che l'approccio incrementale a fasi funziona. Le dipendenze esplicite evitano di costruire su fondamenta instabili.

**Trade-off accettato:** La Fase 5 (Time Map) è ambiziosa e potrebbe richiedere più tempo o essere ridimensionata. Il piano la documenta interamente ma non ne forza l'implementazione completa.

---

## D-04 — Vincoli di visualizzazione valori in AgeTable

**Data:** 2026-04-20
**Fase:** 2 / 4 — Data Model + UX Polish

### Regole di display

#### Valori deterministici (tipo `"deterministic"`)
- **Default:** valore compatto abbreviato via `formatCompact` (es. `2.8B`, `342`, `0.47`).
- **Modalità exact:** attivata dal pulsante `# Show exact` nella toolbar. Mostra il valore completo via `formatDisplay` (es. `2,847,293,847`).
- **HowMuchHint (`?`):** sempre visibile — sia in modalità compatta che esatta. Il pulsante è visibile solo quando `kind === "count"` e il valore supera `MAX_INTERESTING_VALUE` (1000), garantendo che appaia solo per numeri "grandi" e significativi.
- **Badge `≈`:** non mostrato per valori deterministici.

#### Valori stimati (tipo `"estimate"`)
- **Sempre formattati:** il valore assoluto non viene mai mostrato — sempre `formatEstimate` (es. `~2.8M`) o `formatRange` (es. `2.2M – 3.7M`).
- **Modalità centro (default):** mostra `~valore` + badge `≈` nel label. HowMuchHint visibile (solo per valori alti con `kind === "count"`).
- **Modalità range (`≈ Show ranges`):** mostra `low – high`. HowMuchHint **nascosto** — il range stesso comunica già l'incertezza, aggiungere il ? sarebbe ridondante e confusionario.
- **Non esiste "show exact"** per le stime — sarebbe epistemicamente scorretto mostrare un valore esatto per una stima.

#### Valori frazioni (displayMode `"fraction"`)
- Mostrati sempre come `formatFraction`. Nessun pulsante, nessun HowMuchHint.

### Motivazione
Eliminare la "falsa precisione" è l'obiettivo principale della Fase 2. Mostrare `2,847,293,847 Heartbeats` senza contesto fa credere all'utente che il numero sia preciso come i secondi — non lo è. Il formato `~2.8B` con badge `≈` segnala immediatamente che si tratta di una stima.

Per i valori deterministici (secondi, minuti, anni cosmici) la precisione è invece reale e il pulsante "Show exact" permette agli utenti curiosi di vederla senza imporre numeri enormi come default.

### Bug risolto (2026-04-20)
`formatBig` era stata rimossa da `format.ts` durante un refactor precedente ma il suo corpo era rimasto come codice floating a livello modulo, causando un `ReferenceError` a runtime ogni volta che `formatDisplay` veniva chiamata su valori ≥ 1000. Il risultato era che la `tick()` in `AgeTable` falliva silenziosamente e i valori restavano `"--"` o mostravano comportamenti inattesi. Fix: ripristinata `formatBig` come funzione esportata.

---

## D-05 — AgeTable self-contained: rimozione prop `renderNumber`

**Data:** 2026-04-20
**Fase:** 4 — UX Polish

### Decisione
La prop `renderNumber` è stata rimossa da `AgeTable`. La logica di apertura dell'overlay "But how much is it?" è ora interamente interna al componente.

**Prima:** `Milestones.tsx` passava una callback `renderNumber(value, label)` che costruiva un `<HowMuchHint>` inline. Ogni consumer di `AgeTable` doveva conoscere `inferKindUnit`, `HowMuchHint` e il modello di attivazione.

**Dopo:** `AgeTable` gestisce autonomamente:
- calcolo di `kind`, `unit`, `disableOverlay` via `inferKindUnit`
- stato `overlayRow: string | null`
- render condizionale di `ScaleOverlay` (portalled)
- logica `canOverlay` (kind=count, valore > 1000, non stima in range-mode)

### Impatto
- `Milestones.tsx`: rimossi import `HowMuchHint`, `inferKindUnit`; rimossa callback `renderNumber`; rimossa prop dall'usage `<AgeTable>`
- Nessun altro consumer di `AgeTable` era presente → nessuna altra modifica richiesta
- Compilatore segnalava `TS2322: Property 'renderNumber' does not exist on type AgeTableProps` dopo la rimozione della prop dal tipo — fix immediato

### Motivazione
Principio di **least knowledge**: `Milestones.tsx` non deve sapere come funziona l'overlay. `AgeTable` è l'unico componente con accesso diretto ai valori raw e al profilo di ogni riga — è il posto corretto per decidere quando mostrare il modale.

---

## D-06 — Time Map a lane parallele (Fase 5)

**Data:** 2026-04-20  
**Fase:** 5 — Timeline Evolution

### Decisione
Introdotta architettura a lane condivise con un viewport unico (`center + spanMs`) e `scaleMode` unico:
- `personal`
- `historical`
- `markers`

Ogni evento ora può dichiarare `lane?: TimelineLane`; assenza di lane => fallback `personal` per backward compatibility.

### Motivazione
La timeline monolinea produceva clustering eccessivo e sovrapposizioni. Le lane separano semantica e densità informativa senza duplicare la logica di pan/zoom.

### Impatto tecnico
- `TimelineEvent` esteso con `lane`.
- `Timeline.tsx` ora costruisce i render items per lane (`buildRenderItems` riusata lane-by-lane).
- Ruler ticks condivisa in alto; eventi distribuiti verticalmente per lane.

### Trade-off
- Altezza asse aumentata (300/330px) per mantenere leggibilità.
- I marker condividono ancora il medesimo engine di grouping (coerente, ma non lane-aware per collisioni inter-lane — non necessario in questa fase).

---

## D-07 — Sostituzione SubTimeline con Detail Panel

**Data:** 2026-04-20  
**Fase:** 5 — Timeline Evolution

### Decisione
La `SubTimeline` espansa è stata sostituita da `TimelineDetailPanel`:
- Desktop: pannello ancorato sotto la timeline
- Mobile: half-sheet con dismiss via drag verticale (`Framer Motion drag="y"`)

Selezionando un marker singolo viene mostrato 1 evento; selezionando un gruppo viene mostrata la lista degli eventi sovrapposti.

### Motivazione
Il pattern precedente richiedeva contesto mentale extra (mini-axis nel mini-axis). Il detail panel riduce il carico cognitivo e rende il contenuto gerarchico esplicito.

### Trade-off
- Persa la mini-rappresentazione temporale locale del gruppo.
- Guadagnata una UX più stabile su mobile (niente outside-click race nel path principale).

---

## D-08 — Lane visibility controls persistenti

**Data:** 2026-04-20  
**Fase:** 5 — Timeline Evolution

### Decisione
Aggiunto stato preferenze per visibilità lane:
- `pref_visibleTimelineLanes` (localStorage)
- API context: `visibleTimelineLanes`, `toggleTimelineLane`

UI in `Milestones.tsx`: sezione "Visible lanes" con chip toggle, con guardrail "almeno una lane attiva".

### Motivazione
In una Time Map multi-layer, la riduzione di rumore è cruciale. L'utente può spegnere ciò che non è rilevante nel suo flusso esplorativo.

---

## D-09 — Grouping dinamico zoom-aware e clustering conservativo

**Data:** 2026-04-21  
**Fase:** 6 — Timeline Core Refactor

### Decisione
Il grouping automatico non deve più dipendere da una soglia fissa globale (`GROUPING_GAP_PX`) come regola dominante. La nuova direzione è:
- grouping attivo solo per collisioni reali
- soglia derivata dal livello di zoom / densità / larghezza asse
- comportamento quasi nullo ad alto zoom

### Motivazione
Il clustering attuale è percepito come troppo aggressivo: appiattisce la timeline e fa sembrare "sovrapposti" eventi che non lo sono concettualmente. Il gruppo deve servire a preservare leggibilità, non a sostituire la visualizzazione individuale.

### Alternative valutate
- **Lasciare la soglia fissa e ridurre solo il valore**: semplice ma troppo rigido
- **Rimuovere del tutto il grouping**: migliora trasparenza ma crea collisioni severe a zoom basso
- **Grouping per bucket temporali statici**: più predicibile ma meno fedele al layout reale

### Impatto atteso
- Migliore leggibilità a zoom medio/alto
- Minore sensazione di timeline "compressa"
- Necessità di testare più combinazioni di span/larghezza rispetto alla versione precedente

---

## D-10 — `projected-events.json` separato dagli eventi storici

**Data:** 2026-04-21  
**Fase:** 7 — Timeline Information Architecture

### Decisione
Gli eventi futuri verranno gestiti in un dataset separato: `public/data/projected-events.json`.

### Motivazione
Gli eventi previsti, stimati o cosmici futuri non hanno lo stesso statuto epistemico degli eventi storici già accaduti. Tenerli separati evita ambiguità semantiche e rende più semplice manutenzione, curation e messaging UI.

### Alternative valutate
- **Unire passato e futuro in `historical-events.json`**: meno file ma maggiore ambiguità
- **Hardcodare le projections in `Milestones.tsx`**: rapido ma fragile e poco editoriale

### Impatto atteso
- Parser/hook probabilmente duplicabile o generalizzabile con minimo overhead
- Più chiarezza nella UI tra `past events` e `future projections`

---

## D-11 — Modello a due lane: `Personal` + `Global`

**Data:** 2026-04-21  
**Fase:** 7 — Timeline Information Architecture

### Decisione
La timeline converge da tre lane (`personal`, `historical`, `markers`) a due lane principali:
- `personal`
- `global`

Scale markers, eventi storici, eventi scientifici, riferimenti cosmici e projected events confluiscono nella lane globale.

### Motivazione
Le tre lane attuali espongono dettagli di implementazione, non un modello mentale pulito. Il prodotto si capisce meglio come relazione tra tempo personale e tempo del mondo / cosmo.

### Trade-off
- Si perde una lane dedicata ai marker di scala
- Si guadagna una struttura narrativa molto più chiara

### Nota di migrazione
Accettabile prevedere adapter temporanei (`historical` / `markers` → `global`) per evitare una migrazione big-bang.

---

## D-12 — Rimozione del pulsante Log, preservando il motore interno

**Data:** 2026-04-21  
**Fase:** 6 / 8 — Timeline Core Refactor + UX Cleanup

### Decisione
La UI pubblica non esporrà più il toggle `Lin/Log`. Tuttavia la logica di trasformazione (`scaleMode`, utilità math e API interne) può rimanere nel codice finché non diventa chiaramente inutile.

### Motivazione
Il problema non è la mera esistenza della logica logaritmica, ma la complessità aggiunta all'utente da un controllo in più nella toolbar. Prima si semplifica la superficie di interazione; poi, a refactor concluso, si rivaluta se il motore vada rimosso o riutilizzato.

### Alternative valutate
- **Rimuovere sia bottone sia motore**: più pulito nel breve, meno flessibile nel medio termine
- **Lasciare il toggle ma nasconderlo su mobile**: complessità ancora troppo alta

### Impatto atteso
- Toolbar più semplice
- Debito tecnico controllato ma documentato

---

## D-13 — Settings come fonte unica per DOB e profilo utente

**Data:** 2026-04-21  
**Fase:** 9 — Settings Refactor

### Decisione
`Personalize` viene evoluta in `Settings`, che diventa il punto unico per:
- DOB
- metriche personali opzionali
- lifestyle modifiers
- warning e reset

Il pulsante `Edit birth date` viene rimosso dalla navbar e non resta come scorciatoia distribuita.

### Motivazione
Il DOB è una configurazione primaria del sistema, non un'azione contestuale. Centralizzarlo riduce incoerenze, semplifica la navigazione e prepara una UX di validazione più chiara.

### Rischio accettato
Un click in più per modificare il DOB da Milestones. Compensazione: CTA chiare e guardrail espliciti.

---

## D-14 — Stability hardening con fallback locali prima del boundary globale

**Data:** 2026-04-21  
**Fase:** 6 / 8 — Timeline Core Refactor + Mobile/Stability

### Decisione
Il `ErrorBoundary` globale resta come rete di sicurezza, ma le feature critiche devono introdurre guard e fallback locali per evitare il collasso completo della UI su errori prevedibili.

### Focus iniziale
- stati viewport invalidi (`center`, `spanMs`, range non validi)
- assenza di DOB
- dataset mancanti o malformati

### Motivazione
Una pagina vuota con solo boundary fallback è accettabile come ultima risorsa, non come comportamento normale davanti a edge case noti.

---

## D-15 — About FAQ-based + deep links contestuali

**Data:** 2026-04-21  
**Fase:** 11 — About FAQ + Deep Links

### Decisione
La pagina About evolve in struttura FAQ navigabile per sezioni, con link contestuali `How it works` da Landing, Timeline, Timescales e Settings.

### Motivazione
L'utente deve poter capire il sistema senza leggere testo generico o cercare spiegazioni sparse. Le FAQ deep-linked riducono carico cognitivo e migliorano discoverability delle logiche di timeline, timescales e personalizzazione.

### Impatto atteso
- Documentazione più utile e meno narrativa
- Migliore onboarding secondario per utenti curiosi

