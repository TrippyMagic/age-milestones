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

### Nota di implementazione
Implementato in modo conservativo: gli eventi fuori range restano singoli anche se clamped ai bordi, evitando cluster artificiali dovuti solo alla compressione visiva.

---

## D-10 — `projected-events.json` separato dagli eventi storici

**Data:** 2026-04-21  
**Fase:** 7 — Timeline Information Architecture

### Decisione
Gli eventi futuri sono ora gestiti in un dataset separato: `public/data/projected-events.json`.

### Motivazione
Gli eventi previsti, stimati o cosmici futuri non hanno lo stesso statuto epistemico degli eventi storici già accaduti. Tenerli separati evita ambiguità semantiche e rende più semplice manutenzione, curation e messaging UI.

### Alternative valutate
- **Unire passato e futuro in `historical-events.json`**: meno file ma maggiore ambiguità
- **Hardcodare le projections in `Milestones.tsx`**: rapido ma fragile e poco editoriale

### Impatto atteso
- Parser/hook probabilmente duplicabile o generalizzabile con minimo overhead
- Più chiarezza nella UI tra `past events` e `future projections`

### Implementazione
- Aggiunto `useProjectedEvents()` con cache sessione parallela a `useHistoricalEvents()`
- Parsing centralizzato in `src/types/events.ts` con campi espliciti `projectionType` e `certainty`
- Dataset iniziale curato con projection types `scheduled`, `astronomical`, `forecast`, `speculative`

---

## D-11 — Modello a due lane: `Personal` + `Global`

**Data:** 2026-04-21  
**Fase:** 7 — Timeline Information Architecture

### Decisione
La timeline è stata migrata da tre lane (`personal`, `historical`, `markers`) a due lane principali:
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

### Implementazione
- `TimelineEvent` ora usa `lane?: "personal" | "global"`
- `PreferencesContext` normalizza i valori legacy salvati in `pref_visibleTimelineLanes`
- I marker numerici personali (`10,000 days`, `1 billion seconds`, `500 months`) vivono ora nella lane `global`

---

## D-16 — Distinzione epistemica esplicita tra passato e proiezione futura

**Data:** 2026-04-21  
**Fase:** 7 — Timeline Information Architecture

### Decisione
La UI timeline deve dichiarare esplicitamente se un elemento globale è:
- `Past event`
- `Future projection`
- `Global reference`

Questa distinzione non dipende solo dalla data: deriva dal dataset sorgente e dai metadati dell'evento.

### Motivazione
Un evento futuro non deve apparire equivalente a un fatto storico già accaduto. Il solo colore non basta: servono badge, copy e trattamento dedicato nei marker e nel detail panel.

### Implementazione
- `TimelineEvent` e `DetailPanelItem` estesi con `semanticKind`, `temporalStatus`, `projectionType`, `certainty`
- `EventElement.tsx` mostra badge e metadata contestuali nelle hover label
- `TimelineDetailPanel.tsx` espone pill semantiche e confidence labels
- `EventMarker3D.tsx` usa un trattamento dedicato per le projections

---

## D-17 — Timeline come contenitore fisico, non overlay piatto

**Data:** 2026-04-21  
**Fase:** 8 — Timeline UX Cleanup + Mobile Stability

### Decisione
La timeline 2D viene resa più “contenitore” che “overlay” tramite:
- frame esterno più esplicito
- surface interna dell'asse più leggibile
- lane visualizzate come bande/contenitori separati
- empty state e support copy integrati nella card

### Motivazione
La timeline funzionava tecnicamente, ma appariva troppo piatta e fragile. Rafforzare i contenitori visivi migliora leggibilità, senso di orientamento e percezione della separazione tra `Personal` e `Global`.

### Implementazione
- `timeline.css` aggiornata con surface, ruler e lane cards più marcate
- `Milestones.tsx` ora usa header `Time map` + support note contestuali

---

## D-18 — Il 3D resta disponibile ma non è più il toggle primario della timeline

**Data:** 2026-04-21  
**Fase:** 8 — Timeline UX Cleanup + Mobile Stability

### Decisione
La surface principale di `Milestones` non presenta più il 3D come alternanza paritaria `2D/3D`. Il 3D viene de-enfatizzato come azione sperimentale secondaria: `Open experimental 3D`.

### Motivazione
Il modello mentale centrale del prodotto è la timeline 2D esplorabile. Presentare il 3D come toggle primario suggerisce due paradigmi equivalenti, aumentando rumore cognitivo e complessità percepita.

### Trade-off
- Il 3D resta raggiungibile come opt-in
- La UI primaria torna centrata su pan/zoom della timeline 2D

---

## D-19 — Boundary locali prima del boundary globale

**Data:** 2026-04-21  
**Fase:** 8 — Timeline UX Cleanup + Mobile Stability

### Decisione
Le sezioni critiche vengono avvolte in boundary locali dedicati (`SectionErrorBoundary`) prima di affidarsi al `ErrorBoundary` globale.

### Motivazione
Un errore isolato in timeline, AgeTable o Timescales non deve più degradare l'intera pagina o l'intera applicazione. Il boundary globale resta safety net finale, non linea difensiva primaria.

### Implementazione
- creato `src/components/SectionErrorBoundary.tsx`
- usato in `Milestones.tsx`, `Timescales.tsx`, `Landing.tsx`, `About.tsx`
- aggiunti fallback locali e copy contestuale per stati vuoti / problemi di rendering

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

### Nota di implementazione
La timeline 2D ora usa internamente la modalità lineare come default non esposto, mentre le utility logaritmiche restano nel core math per possibili reintroduzioni future.

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

### Implementazione
- aggiunto `src/pages/Settings.tsx` come pagina primaria
- `main.tsx` ora espone `/settings` e mantiene un redirect legacy `/personalize` → `/settings`
- `Headers.tsx` usa `Settings` come voce di navigazione primaria
- `Milestones.tsx` non passa più `onEditBirthDate` alla navbar
- `Landing.tsx`, `About.tsx` e i fallback timeline rimandano esplicitamente a `Settings`

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

### Nota di implementazione
Introdotti guard e recovery path nel core timeline tramite sanitizzazione del viewport e fallback locale renderizzato direttamente dal componente.

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

### Implementazione
- aggiunto `src/utils/aboutLinks.ts` come punto unico per anchor canoniche (`general`, `timeline`, `timescales`, `settings`)
- `About.tsx` usa ora una struttura FAQ data-driven con hero card, section-nav e 4 blocchi deep-linkabili
- gestione hash locale in `About.tsx` tramite `useLocation()` + `requestAnimationFrame()` per garantire scroll corretto anche in navigazione cross-route (`/about#timeline`)
- `components.css` introduce stili riusabili per `help-link` e per la gerarchia FAQ; `personalize.css` amplia il layout di `about-page`
- `Landing.tsx`, `Milestones.tsx`, `Timescales.tsx` e `Settings.tsx` espongono link contestuali `How it works` verso la sezione FAQ pertinente

### Trade-off
- La gestione degli hash resta locale alla pagina `About` invece di diventare una policy globale del router: scelta intenzionale per mantenere il comportamento circoscritto all'unica pagina che oggi usa deep links documentali.
- Le FAQ restano editoriali e statiche in JSX/data locale, senza introdurre un CMS o file markdown separati: meno complessità, più velocità di iterazione.

---

## D-23 — Il 3D resta nello stack attuale ma con quality profiles, non con nuove librerie

**Data:** 2026-04-21  
**Fase:** 12 — 3D Strategy Rationalization

### Decisione
La timeline 3D continua a usare `@react-three/fiber` + `@react-three/drei`. Non vengono introdotte nuove librerie 3D: il problema non era lo stack, ma la strategia di rendering su device deboli.

### Motivazione
Lo stack corrente è già best-in-class per una scena React/Three.js di questa scala. Aggiungere altre librerie avrebbe aumentato peso e superficie di manutenzione senza risolvere i problemi principali: costi GPU troppo alti su mobile, scene troppo dense e assenza di un profilo low-power.

### Implementazione
- `Timeline3DWrapper.tsx` rileva mobile e `prefers-reduced-motion`
- `Timeline3D.tsx` usa profili `balanced` / `low-power`
- aggiunti `AdaptiveDpr` e `AdaptiveEvents`
- `Canvas` ora usa DPR più conservativo e `powerPreference` coerente col profilo
- la scena 3D è stata resa lane-aware con rail `Personal` / `Global`

### Trade-off
- qualità visiva leggermente ridotta su mobile
- maggiore stabilità e meno crash/performance cliff su viewport stretti

---

## D-24 — I milestone numerici dell'età appartengono alla Personal lane

**Data:** 2026-04-21  
**Fase:** 12 — Timeline Rendering Accuracy

### Decisione
Eventi come `10,000 days old`, `500 months old` e `1 billion seconds old` vengono trattati come marker personali, non come riferimenti globali.

### Motivazione
Sono derivati direttamente dalla vita dell'utente e non devono scomparire quando la lane globale viene filtrata o nascosti semanticamente insieme a eventi storici/proiezioni.

### Implementazione
- `Milestones.tsx` assegna ora questi eventi a `lane: "personal"`
- `semanticKind` aggiornato a `personal`
- la scena 3D eredita automaticamente il nuovo posizionamento lane-aware

---

## D-25 — Gli eventi fuori viewport ai bordi devono essere aggregati esplicitamente

**Data:** 2026-04-21  
**Fase:** 12 — Timeline Rendering Accuracy

### Decisione
Quando esistono marker a sinistra/destra del viewport corrente, la timeline 2D non deve più mostrarne implicitamente solo uno tramite clamp visivo. Deve invece renderizzare un group bubble ai bordi con il conteggio degli eventi oltre il limite visibile.

### Motivazione
La precedente scelta conservativa evitava cluster artificiali, ma produceva un effetto UX peggiore ai bordi: più marker offscreen collassavano in pratica in un solo marker visibile/clamped. Questo nascondeva informazione e faceva sembrare i marker "scomparsi".

### Implementazione
- `buildRenderItems.ts` partiziona ora gli eventi in `startOffscreen`, `visible`, `endOffscreen`
- gli eventi offscreen generano group bubble `edge-start` / `edge-end`
- il grouping collision-based resta separato per gli eventi realmente visibili
- `Timeline.tsx` espone copy/ARIA dedicati per i gruppi di bordo

### Trade-off
- la timeline mostra un affordance in più ai bordi
- si guadagna trasparenza sul numero reale di marker fuori dalla finestra corrente

---

## D-26 — Hardening mobile della timeline 2D: meno rerender, pointer lifecycle completo

**Data:** 2026-04-21  
**Fase:** 12 — Timeline Rendering Accuracy / Mobile Stability

### Decisione
La timeline 2D riduce il carico di rendering continuo e gestisce meglio il lifecycle delle gesture touch/pointer.

### Implementazione
- `Timeline.tsx` aggiorna `now` ogni 60s invece che ogni secondo
- aggiunti handler `pointercancel` e `lostpointercapture`
- callback di selezione marker resa stabile
- `EventElement.tsx` memoizzato per tagliare rerender inutili

### Motivazione
Su mobile, rerender continui + gesture interrotte sono una combinazione tipica di instabilità percepita. Ridurre la frequenza degli update e chiudere tutti i path pointer riduce i casi in cui la sezione timeline sembra bloccarsi o crashare.

---

## D-27 — Responsive audit finale: preferire `max-width`, flex/grid e breakpoint ai layout rigidi

**Data:** 2026-04-21  
**Fase:** Audit finale post-Fase 12

### Decisione
Nei layout attivi del prodotto, le larghezze principali non devono più dipendere da width rigide usate come vincolo di layout. La direzione finale è:
- `width: 100%` + `max-width` per i contenitori principali
- flex/grid con `minmax(0, 1fr)` o `auto-fit/auto-fill` per le superfici complesse
- breakpoint chiari a `480px` e `720px`

### Motivazione
La priorità dichiarata del refactor_3 è la stabilità mobile. Alcune aree erano già funzionali ma ancora troppo strette o dipendenti da colli di bottiglia di layout: CTA landing, form di Settings, comparator di Timescales, tooltip e label 3D.

### Implementazione
- `components.css`: card/shared layout e `AgeTable` meno rigidi
- `personalize.css` + `Settings.tsx`: pagina Settings evoluta con grid responsive e DOB picker più elastico
- `wizard.css`: CTA landing e azioni più flessibili
- `timescales.css`: comparator, tooltip e explorer grid riallineati a max-width/flex/grid responsive
- `timeline3d.css`: scene label e viewport 3D meno rigidi su mobile

### Trade-off
- Più wrapping controllato su alcuni breakpoint intermedi
- Meno rischio di overflow/orizzontalità forzata e migliore adattabilità 320/360/390/480/720px

---

## D-20 — DOB mancante come stato rosso esplicito, non come failure silenziosa

**Data:** 2026-04-21  
**Fase:** 10 — DOB Validation UX + Access Guardrails

### Decisione
Quando il DOB manca, Kronoscope non deve più affidarsi solo a redirect impliciti o a pulsanti disabilitati. Le aree DOB-dipendenti mostrano invece uno stato rosso esplicito e bloccante.

### Motivazione
L'assenza di DOB non è un errore tecnico: è uno stato utente importante. Va comunicato chiaramente, con copy diretto e CTA verso `Settings`.

### Implementazione
- `Landing.tsx` mostra un banner rosso quando il DOB manca
- `Milestones.tsx` non fa più redirect silenzioso alla home; mostra un blocco esplicito con CTA verso `Settings`
- `Settings.tsx` mostra un warning rosso persistente finché il DOB non viene reinserito

---

## D-21 — Warning giallo per profilo opzionale incompleto

**Data:** 2026-04-21  
**Fase:** 10 — DOB Validation UX + Access Guardrails

### Decisione
L'assenza di campi opzionali del profilo non blocca l'uso dell'app, ma deve essere comunicata come riduzione della personalizzazione delle stime.

### Motivazione
Il prodotto deve essere onesto sui limiti epistemici senza punire l'utente. Un warning giallo non bloccante è più appropriato di un errore.

### Implementazione
- aggiunto helper puro `src/utils/profileCompleteness.ts`
- `Settings.tsx` mostra un warning giallo con campi mancanti e conteggio dei dati forniti
- aggiunti test unitari per la logica di completezza profilo

---

## D-22 — Uscita da Settings bloccata finché il DOB è assente

**Data:** 2026-04-21  
**Fase:** 10 — DOB Validation UX + Access Guardrails

### Decisione
Se l'utente rimuove il DOB in `Settings`, la navigazione away viene intercettata e accompagnata da un warning esplicito. Il browser riceve anche un guard `beforeunload`.

### Motivazione
Se `Settings` è la fonte unica di verità per il DOB, uscirne senza data deve essere una scelta evidente, non accidentale.

### Implementazione
- `BirthDateContext.tsx` espone `clearBirthDate()`
- `BirthDatePicker.tsx` espone `Clear birth date`
- `Headers.tsx` supporta un hook opzionale `onNavigateAttempt`
- `Settings.tsx` blocca la navigazione navbar verso altre aree quando il DOB è assente e abilita anche `beforeunload`

