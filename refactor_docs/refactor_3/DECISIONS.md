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
