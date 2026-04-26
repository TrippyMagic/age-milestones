# PLAN — Refactor 4: UI Platform Stabilization & Timeline Systems

**Data:** 2026-04-26  
**Stato:** 🟡 In corso — Fase 0 completata, Fase 1 completata, Fase 2 completata, Fase 3 completata, Fase 4 completata

---

## Snapshot esecutivo — aggiornamento Fase 4 completata (slice 4 verificata)

Al 2026-04-26 la baseline di Refactor 4 è stata estesa fino alla **slice 4 verificata che chiude la Fase 4**.

Output prodotti:

- `refactor_docs/refactor_4/AUDIT_SUMMARY.md`
- `refactor_docs/refactor_4/ARCHITECTURE_BASELINE.md`
- aggiornamento di `DECISIONS.md`, `AGENTS.md` e `README.md`
- introduzione del primo nucleo runtime di Fase 2 in `src/components/timeline-core/`
- estensione del core con contratto di interazione/selection + hit-testing canvas-native condiviso

Risultati chiave:

- inventario `active / legacy / orphan / candidate removal` completato;
- baseline runtime verificata su routing, providers, timeline, Timescales e 3D;
- conferma che `Settings` + `BirthDatePicker` sono la prima surface da migrare nel nuovo `src/ui/`;
- conferma che `BirthDateWizard`, `useBirthWizard`, `MockCard`, `SubTimeline` e `scaleHint` sono orfani o legacy verificati;
- build e test baseline eseguiti con successo, con un solo warning lint non bloccante.
- Fase 1 slice 1 avviata con introduzione del layer `src/ui/` e migrazione iniziale di `Settings` + `BirthDatePicker`.
- Fase 1 slice 2 completata con prima primitive headless (`Tabs`) e migrazione dei tab system di `Timescales` e `GeoCosmicExplorer`.
- Fase 1 slice 3 completata con migrazione dei perspectives tabs di `Milestones`, inclusi unlock progressivo, toast e pannello mobile collapsible.
- Fase 1 slice 4 completata con migrazione finale dei consumer runtime legacy (`Landing`, banner DOB-gated di `Milestones`, `ErrorBoundary`) e primo cleanup sicuro dei selettori tabs/status-banner non più usati.
- Fase 2 slice 1 avviata con estrazione di `buildRenderItems` nel nuovo `timeline-core`, introduzione del puro `buildTimelineScene` e primo canvas ibrido non-interattivo per la lane globale.
- la timeline 2D mantiene ancora il layer DOM accessibile esistente per marker, gruppi e detail panel, ma la pipeline scene-based è ora parte del runtime attivo.
- Fase 2 slice 2 completata con introduzione in `timeline-core` dei target interattivi, payload di selection/detail e prima de-DOM progressiva della lane `global` tramite overlay accessibile sopra il canvas.
- Fase 2 completata con migrazione della lane `personal` al nuovo overlay model, rinomina dei renderer attivi in `TimelineSceneCanvas` + `TimelineInteractiveOverlay`, introduzione di hit-testing canvas-native condiviso, pruning di `SubTimeline` e rimozione del legacy `scaleMode` dal runtime timeline.
- il runtime 2D non renderizza più marker/gruppi via `EventElement`: il visuale passa dal canvas condiviso, mentre focus/keyboard/detail panel passano dall’overlay HTML minimale.
- la copertura DOM/integration della timeline protegge ora overlay condiviso, keyboard activation, pointer hit-testing e axis click invariants.
- verifica post-fase eseguita con successo: `npm test -- --run` → 81 test passati su 10 file, `npm run build` ✅, `npm run lint` ⚠️ solo warning preesistente in `UserProfileContext.tsx`.
- Fase 3 slice 1 avviata con hardening della `Timescales` overview: shell dedicata per summary/reset filtri, messaggistica loading/error esplicita, detail panel pinned touch-safe sotto il ruler logaritmico e nuova copertura RTL del flusso overview.
- verifica slice 1 eseguita con successo: `npm test -- --run` → 85 test passati su 11 file, `npm run build` ✅, `npm run lint` ⚠️ solo warning preesistente in `UserProfileContext.tsx`.
- Fase 3 slice 2 completata con hardening di `GeoCosmicExplorer`: summary/back flow geologico, breadcrumb semantics più forti, detail panel focus-safe, drilldown più coerente e nuovi guardrail RTL dedicati.
- verifica slice 2 eseguita con successo: `npm test -- --run` → 90 test passati su 12 file, `npm run build` ✅, `npm run lint` ⚠️ solo warning preesistente in `UserProfileContext.tsx`.
- Fase 3 slice 3 completata con hardening di `PhenomenaComparator` / `PhenomenaSearch`: combobox accessibile custom, dropdown/focus/keyboard flow più robusto, empty state esplicito, esclusione duplicati cross-slot e wrapping mobile sotto 480px.
- introdotto `src/tests/phenomenaComparator.test.tsx` per coprire selection via tastiera, duplicate exclusion, stato vuoto e wiring del comparison panel.
- verifica slice 3 eseguita con successo: `npm test -- --run` → 93 test passati su 13 file, `npm run build` ✅, `npm run lint` ⚠️ solo warning preesistente in `UserProfileContext.tsx`.
- Fase 3 slice 4 completata con hardening cross-page di `Settings` + `BirthDatePicker`: max date locale corretta, summary DOB condiviso tra Landing/Settings, guardrail navbar coerente quando manca il DOB e touch-target/layout più robusti per form e controlli densi.
- introdotto `src/tests/settingsDobFlow.test.tsx` per coprire blocco navigazione da `Settings`, persistenza condivisa del DOB e clear flow coerente tra `Settings` e `Landing`.
- verifica slice 4 eseguita con successo: `npm test -- --run` → 96 test passati su 14 file, `npm run build` ✅, `npm run lint` ⚠️ solo warning preesistente in `UserProfileContext.tsx`.
- Fase 3 slice 5 completata con estrazione di helper temporali condivisi a basso rischio in `src/utils/temporalScale.ts`: absolute-log ratio/percent configurabile, formatter minimo dell’esponente log e migrazione dei consumer Timescales più omogenei (`TimescaleOverview`, `PhenomenaComparator`, `GeoCosmicExplorer`).
- la convergenza forte della selection resta fuori scope: `Timeline.tsx`, `timeline-core/interaction.ts` e il dual-slot model del comparator non cambiano runtime contract in questa slice; l’allineamento desiderato su `selectionKey`, toggle semantics e stale-selection cleanup viene solo documentato.
- introdotto `src/tests/temporalScale.test.ts` e ampliata la copertura RTL di `Timescales` per cleanup selezione overview, coerenza width/order del comparator e scala cosmica normalizzata dell’explorer.
- verifica slice 5 eseguita con successo: `npm test -- --run` → 104 test passati su 15 file, `npm run build` ✅, `npm run lint` ⚠️ solo warning preesistente in `UserProfileContext.tsx`.
- Fase 3 considerata completata: non risultano altre slice pianificate oltre alla 5, quindi l’evoluzione successiva passa al kickoff della Fase 4.
- Fase 4 slice 1 completata con estrazione di `buildTimeline3DScene` nel `timeline-core`: il renderer 3D ora consuma un adapter puro per lane order, focus clamping, tick thinning e marker projection, invece di duplicare localmente il math della scena.
- `src/components/3d/Timeline3D.tsx` è stato alleggerito fino a diventare soprattutto un renderer R3F della scena già costruita, mentre `Timeline3DWrapper.tsx` mantiene invariati lazy-loading, fallback WebGL e quality profiles.
- introdotto `src/tests/buildTimeline3DScene.test.ts` per proteggere lane order condiviso, clamp del focus, bounds dell’asse 3D, placement marker e thinning dei tick.
- verifica Fase 4 slice 1 eseguita con successo: `npm test -- --run` → 109 test passati su 16 file, `npm run build` ✅, `npm run lint` ⚠️ solo warning preesistente in `UserProfileContext.tsx`.
- Fase 4 slice 2 completata con estrazione della policy runtime 3D in `src/components/3d/runtimePolicy.ts`: quality-profile resolution, renderer budgets, toggle copy e availability/fallback contract non vivono più inline tra wrapper, renderer e `Milestones`.
- `src/components/3d/Timeline3DWrapper.tsx`, `src/components/3d/Timeline3D.tsx` e `src/pages/Milestones.tsx` ora consumano lo stesso contract puro per WebGL gating, qualità `balanced / low-power` e copy del toggle sperimentale.
- introdotti `src/tests/timeline3DRuntime.test.ts` e `src/tests/timeline3DWrapper.test.tsx` per proteggere policy, fallback esplicito e wiring del profile nel lazy wrapper.
- verifica Fase 4 slice 2 eseguita con successo: `npm test -- --run` → 116 test passati su 18 file, `npm run build` ✅, `npm run lint` ⚠️ solo warning preesistente in `UserProfileContext.tsx`.
- Fase 4 slice 3 completata con primo bridge shared-first tra interaction 3D e inspector 2D: i marker 3D emettono ora `TimelineSelectionPayload` condivisi, `Timeline3DWrapper` riusa `TimelineDetailPanel` fuori dal canvas e la selezione aggiorna anche il `focusValue` comune di `Milestones`.
- `src/components/3d/EventMarker3D.tsx` mantiene highlight/label anche in stato selected, mentre `src/components/timeline-core/interaction.ts` espone il nuovo helper puro `createTimelineEventSelectionPayload` per evitare payload detail duplicati nel runtime 3D.
- introdotto `src/tests/timeline3DInteraction.test.tsx` per coprire apertura dell’inspector condiviso, sync del focus e cleanup della selezione quando un evento esce dal dataset visibile.
- verifica Fase 4 slice 3 eseguita con successo: `npm test -- --run` → 119 test passati su 19 file, `npm run build` ✅, `npm run lint` ⚠️ solo warning preesistente in `UserProfileContext.tsx`.
- Fase 4 slice 4 completata con convergenza del contract single-marker 3D nel `timeline-core`: `buildTimeline3DScene` emette ora marker già arricchiti con `selectionKey`, `detailItems`, colore e copy semantica condivisi, mentre il renderer 3D smette di ricostruire palette/metadata localmente.
- `src/components/3d/EventMarker3D.tsx`, `src/components/3d/Timeline3D.tsx` e `src/components/3d/Timeline3DWrapper.tsx` consumano ora il descriptor condiviso dei marker singoli; il wrapper mantiene solo `selectedSelectionKey` e deriva il detail payload dal core invece di conservarne una copia locale.
- ampliata la copertura con nuovi assert su `src/tests/buildTimelineInteraction.test.ts` e `src/tests/buildTimeline3DScene.test.ts`, mantenendo `src/tests/timeline3DInteraction.test.tsx` come guardrail sul bridge inspector/focus già introdotto nella slice 3.
- verifica Fase 4 slice 4 eseguita con successo: `npm test -- --run` → 120 test passati su 19 file, `npm run build` ✅, `npm run lint` ⚠️ solo warning preesistente in `UserProfileContext.tsx`.

---

## Executive Summary

Refactor 4 sposta Kronoscope da una codebase funzionale ma ancora fragile verso una **piattaforma UI e visualization più modulare, stabile e testabile**, senza riscrivere l’app da zero.

La direzione non è un cambio di prodotto: Kronoscope resta una **sandbox sperimentale** per l’esplorazione del tempo. Il cambio è architetturale:

- il layer UI passa da CSS globale fortemente accoppiato a un **sistema modulare con primitive React-first accessibili**;
- la timeline 2D smette di essere soprattutto un componente DOM-based e diventa un **engine con surface Canvas/SVG aggressiva**;
- Timescales converge verso lo stesso modello mentale della timeline, invece di restare una somma di widget separati;
- il 3D viene preparato come **sistema parallelo, isolato e budgetizzato**, non come seconda UI primaria da tenere in sync in modo fragile;
- il cleanup del codice morto e il testing vengono portati allo stesso livello della refactor roadmap, non lasciati come fase opzionale.

Questo refactor è pensato come **incrementale e deployabile per fasi**, con priorità assoluta:

1. **stabilità UI mobile-first**;
2. **stabilità timeline 2D**;
3. **pulizia architetturale**;
4. **preparazione 3D**.

---

## 0 — Decision snapshot già fissato

Queste decisioni sono considerate chiuse e costituiscono i vincoli del piano:

1. **UI System → Option C**  
   Kronoscope adotta un approccio **CSS modulare + primitive accessibili React-first**, con eventuale evoluzione futura verso un approccio utility-driven solo se il nuovo sistema lo renderà utile e naturale.

2. **Timeline 2D → surface aggressiva già dalla Fase 2**  
   La timeline non prosegue come engine incrementale basato su tanti nodi DOM. Il refactor punta direttamente a una **surface Canvas/SVG** con engine dedicato.

3. **No rewrite completo dell’app**  
   Restano invariati: React 19, TypeScript, Vite, routing, contexts principali, natura sandbox del prodotto.

---

## 1 — Analisi dello stato attuale

### 1.1 — Cosa è già stato consolidato in Refactor 3

Refactor 3 ha lasciato una base migliore rispetto alle versioni precedenti:

- identità prodotto ormai coerente (`Kronoscope`);
- milestone system e timeline semanticamente più chiari (`Personal` / `Global`);
- fallback locali con `SectionErrorBoundary`;
- Settings come single source of truth per DOB e profilo;
- separazione dataset storici / proiezioni future;
- 3D già lazy-loaded e lane-aware;
- test unitari presenti su trasformazioni, grouping e semantica timeline.

Questa base è sufficiente per evitare un rewrite totale.

### 1.2 — Fragilità del layer UI / CSS

L’interfaccia resta il principale punto di attrito architetturale.

#### Problemi osservati

- `src/css/index.css` continua a fare da orchestratore globale di layout, spacing, background e import di tutti i moduli CSS.
- `src/css/components.css`, `src/css/timeline.css` e `src/css/personalize.css` contengono molto styling trasversale con responsabilità miste: componenti, layout, responsive behavior, eccezioni locali.
- Il pattern attuale dipende da combinazioni di classi globali, override e media query distribuite.
- In `components.css`, primitive come `.button` includono decisioni fortemente contestuali (es. `margin-top: 40px`) che poi costringono altri componenti a compensazioni locali.
- In `index.css`, `body`, `#root`, `.page`, `.wrapper` e vari container governano insieme il gutter globale e l’allineamento delle superfici: questo crea coupling tra pagine che dovrebbero essere indipendenti.
- Layout card, tabs, banner, azioni, modali e picker sono stilizzati in modo visivamente coerente ma **non ancora costruiti come sistema**.

#### Conseguenza pratica

La UI sembra coerente quando i casi sono previsti, ma è ancora sensibile a:

- viewport piccoli;
- densità di contenuto diverse dal previsto;
- componenti riusati fuori dal contesto originale;
- regressioni di spacing, wrapping e overflow.

### 1.3 — Timeline 2D: ancora il sistema più critico

La timeline attuale è molto migliorata semanticamente, ma resta il componente più delicato.

#### Evidenze attuali

- `src/components/timeline/Timeline.tsx` gestisce insieme viewport, input pointer, wheel zoom, pinch integration, selection state, lane rendering, ticks, focus indicator e detail panel.
- `src/css/timeline.css` è ormai una superficie molto grande e ad alta complessità, con styling di frame, lanes, groups, controls, notes, fallbacks, responsive behavior e dettagli di stato.
- `buildRenderItems.ts` è ormai un layer puro stabile dietro al nuovo renderer canvas condiviso.
- marker e group bubble non sono più nodi DOM runtime della timeline attiva: il visuale passa dal canvas e l’accessibilità da un overlay minimale.
- `PreferencesContext.tsx` non conserva più `scaleMode`: la timeline 2D attiva è linear-only senza persistenza legacy.
- `SubTimeline.tsx` è stato rimosso dopo replacement del nuovo overlay model.

#### Problemi strutturali aperti

- input model distribuito tra React handlers, DOM listeners e hook custom;
- rischio di re-render non necessari durante pan, zoom, resize e ticking del “now”; 
- costi di rendering crescenti all’aumentare dei marker;
- accessibilità e hit-testing dipendenti da markup, non da un model layer dedicato;
- difficoltà ad allineare 2D, 3D e Timescales su un contratto condiviso.

### 1.4 — Timescales: forte contenuto, modello interattivo frammentato

La pagina `Timescales` è ricca, ma non è ancora un sistema coerente quanto `Milestones`.

#### Stato attuale

- `TimescaleOverview.tsx` usa una visualizzazione SVG log-scale dedicata e isolata.
- `PhenomenaComparator.tsx` segue un modello analitico indipendente.
- `GeoCosmicExplorer.tsx` unisce drilldown geologico e timeline cosmica con un’interazione completamente diversa.
- `Timescales.tsx` orchestra tre tab distinte senza un engine temporale condiviso.

#### Limite concettuale

Timescales oggi è più una **suite di tool correlati** che una vera estensione del sandbox temporale principale.

### 1.5 — Mobile UX: area prioritaria ancora incompleta

Refactor 3 ha corretto molti problemi, ma alcuni punti restano coerenti con i bug segnalati dall’utente.

#### Punti ancora sensibili

- dimensionamento e wrapping dei pulsanti in `Settings`;
- picker DOB ancora dipendente da CSS page-specific per stare in asse su viewport stretti;
- bottone `Clear birth date` gestito come action separata e quindi ancora soggetto a layout shift;
- filtri timeline e controls che su schermi stretti possono diventare densi troppo rapidamente;
- rischio di overflow o stacking non ideale quando note, banner, actions e surface interattive convivono nella stessa pagina.

### 1.6 — Dead code e debito di migrazione

Dalla codebase attuale risultano già verificabili alcuni candidati cleanup:

#### Verificati come non usati in runtime attivo

- `src/components/BirthDateWizard.tsx`
- `src/hooks/useBirthWizard.ts`
- `src/components/common/MockCard.tsx`
- `src/components/timeline/SubTimeline.tsx` (rimosso dopo replacement in Fase 2)

#### Legacy / mixed status

- `EventElement.tsx`: non più usato dal renderer timeline attivo, ma ancora presente come cleanup debt esplicito;
- `src/components/unused/`: non è eliminabile in blocco perché almeno una parte viene ancora toccata da `useMilestone.ts` via type/import da `constants.ts`;
- CSS legato al wizard e a path storici va classificato file per file, non cancellato in massa.

### 1.7 — Testing: copertura utile ma troppo bassa per la nuova complessità

Attualmente i test coprono soprattutto funzioni pure e semantica del model:

- `scaleTransform`
- `buildRenderItems`
- `timelineSemantics`
- `globalLaneNotice`
- `profileCompleteness`
- `format`
- `aboutLinks`

Mancano invece:

- test di integrazione UI per `Settings`, `BirthDatePicker`, `Milestones`, `Timescales`;
- test di interazione per pan/zoom/select della timeline;
- regressioni visuali mobile;
- test di orchestrazione 3D / fallback / WebGL gating;
- test che proteggano i cleanup di codice legacy.

---

## 2 — Principi guida e vincoli

| Principio | Dettaglio operativo |
|---|---|
| Mobile-first reale | ogni nuova primitive e ogni nuova surface devono avere comportamento valido da 320px in su |
| No full rewrite | si rifattorizza per strati, mantenendo routes, contesti e modello generale del prodotto |
| UI system modulare | ridurre la dipendenza da CSS globale accoppiato, non introdurre styling casuale misto |
| Timeline come piattaforma | il 2D non è più “un componente grande”, ma un insieme di engine + renderer + interaction model |
| 3D secondario ma serio | il 3D non diventa la default experience, ma viene preparato con contratti condivisi e budget chiari |
| Cleanup con parità funzionale | si rimuove solo dopo sostituzione e copertura minima |
| Test prima del pruning finale | nessuna rimozione massiva senza test o checklist di equivalenza |
| Sandbox, non dashboard enterprise | l’esperienza resta esplorativa, visiva e sperimentale, non amministrativa |
| English only | nessuna introduzione di i18n in questa fase |

---

## 3 — Evoluzione architetturale proposta

### 3.1 — UI system modulare: Option C

#### Direzione

Adottare un **UI system interno basato su CSS modulare + primitive React-first accessibili**, invece di continuare ad espandere classi globali page-driven.

#### Strategia

1. **Conservare i token visivi esistenti** dove già funzionano (`:root` in `index.css`).
2. Introdurre un livello `src/ui/` con primitive e pattern:
   - `Button`, `IconButton`
   - `Card`, `Surface`, `Panel`
   - `Stack`, `Inline`, `Cluster`, `PageSection`
   - `Field`, `FieldRow`, `FormActions`
   - `Banner`, `EmptyState`, `Hint`
   - `Tabs`, `Dialog`, `Sheet`, `Tooltip`, `Popover`
3. Limitare il CSS globale a:
   - reset / tokens / background app;
   - layout root;
   - utility minime e deliberate.
4. Spostare il comportamento delle primitive interattive su una libreria headless affidabile.

#### Scelta consigliata

**Radix UI** come layer di primitive accessibili per gli elementi interattivi più fragili:

- Dialog / Sheet
- Tabs
- Tooltip
- Popover
- Slot

Il visual styling resta interno e modulare.

#### Perché non Tailwind ora

Tailwind non è escluso per sempre, ma in questo momento introdurrebbe:

- un cambio culturale e di authoring troppo ampio;
- un doppio sistema temporaneo più costoso del necessario;
- poca leva immediata sulla timeline 2D, che è il problema tecnico più urgente.

L’architettura proposta rende comunque possibile un’evoluzione futura verso un layer utility-driven, se diventerà conveniente.

### 3.2 — Timeline 2D: da componente a piattaforma renderizzata

#### Direzione

La timeline 2D passa in Fase 2 a un’architettura **Canvas/SVG aggressiva**, non più centrata sul DOM per il rendering dei marker.

#### Scelta architetturale

Approccio **ibrido**:

- **Canvas** per marker, clusters, rails, indicatori ad alta densità e rendering frequente;
- **SVG/HTML overlay** per ticks, focus state, label selezionate, accessibilità, controlli, detail anchoring.

#### Vantaggi

- molto meno overhead DOM;
- grouping e culling più scalabili;
- hit-testing esplicito e controllato;
- pan/zoom più stabili;
- miglior base per condividere un event contract con 3D e Timescales.

#### Moduli target

- `timeline-core/`
  - range math
  - viewport math
  - grouping / culling
  - lane layout
  - event normalization
  - hit testing
- `timeline-renderers/`
  - canvas scene
  - svg overlay
- `timeline-interactions/`
  - wheel, drag, pinch, keyboard navigation
- `timeline-panels/`
  - detail drawer / inspector
- `timeline-adapters/`
  - mapping tra dati di `Milestones` e scene renderizzabili

#### Librerie focalizzate consentite

Se necessario e giustificato:

- `d3-scale` / `d3-array` per math e ticks;
- `@use-gesture/react` per unificare gesture complesse.

Non è richiesto un charting library full-stack.

### 3.3 — Timescales: riframing come temporal exploration system

#### Direzione

Timescales deve smettere di essere solo una pagina con tre tool diversi e diventare un **secondo ambiente di esplorazione temporale**, coerente con la sandbox generale.

#### Evoluzione proposta

- `Overview` converge verso lo stesso model di scala / viewport / selection della timeline.
- `Explorer` usa uno schema scene-based invece di puro elenco/drilldown isolato.
- `Comparator` resta un tool analitico, ma si appoggia alle stesse primitive di form, selection, badges e tooltip.
- categorie, filtri, detail panel e semantics diventano condivisibili con il resto dell’app.

### 3.4 — 3D: preparazione architetturale, non escalation di complessità

#### Direzione

Il 3D resta **alternativo, opt-in, isolato**, ma viene preparato su fondamenta più pulite.

#### Scelte guida

- restare su `@react-three/fiber` + `@react-three/drei`;
- evitare migrazione a un nuovo motore;
- condividere con il 2D solo:
  - event contract
  - lane semantics
  - selezione/focus model
  - quality/profile policy
- isolare la scena 3D dietro adapter e boundary specifici.

#### Obiettivo reale di Refactor 4

Non “potenziare” il 3D prima del 2D, ma **preparare il terreno** perché il 3D smetta di dipendere da assunzioni implicite della timeline attuale.

### 3.5 — Cleanup e test come parte del design, non coda finale

Il cleanup non deve più essere un atto puntuale alla fine, ma una pipeline controllata:

1. classificare legacy / orphan / active;
2. introdurre copertura minima;
3. sostituire i consumer;
4. rimuovere;
5. ripulire docs e specs.

---

## 4 — Breakdown per area

### 4.1 — UI System Migration

**Problema attuale**
- CSS globale e page-driven;
- primitive visuali non formalizzate;
- spacing e alignment dipendono da override sparsi;
- componenti interattivi non costruiti su primitive accessibili standard.

**Soluzione proposta**
- introdurre `src/ui/` come layer interno di primitive e pattern;
- ridurre i CSS feature-specific a styling compositivo, non infrastrutturale;
- usare Radix UI per dialog, tabs, tooltip, popover/sheet;
- definire layout primitives riusabili per Settings, Timeline controls, Timescales panels.

**Impatto tecnico**
- riduzione del coupling tra pagine;
- maggiore prevedibilità dei breakpoint;
- facilità di riuso e testing dei componenti base.

**Rischi**
- breve fase di doppio sistema;
- rischio di introdurre troppa astrazione troppo presto.

**Mitigazione**
- migrazione per slice funzionali;
- introdurre prima primitive ad alto riuso e alto dolore (Buttons, Fields, Actions, Panels, Tabs, Sheet).

### 4.2 — Timeline 2D Stabilization

**Problema attuale**
- componente ancora troppo centralizzato;
- rendering marker DOM-based;
- input model e rendering troppo accoppiati;
- CSS surface enorme e difficile da governare.

**Soluzione proposta**
- creare timeline engine dedicato;
- spostare la scena su renderer Canvas/SVG ibrido;
- separare viewport math, rendering, gesture, selection e panels;
- costruire un accessibility layer esplicito invece di affidarsi ai marker DOM.

**Impatto tecnico**
- calo del costo di rendering;
- meno re-render React sul path interattivo;
- maggiore stabilità su mobile e su dataset più densi.

**Rischi**
- curva implementativa più alta della semplice rifinitura DOM;
- rischio regressioni funzionali in hit-testing e keyboard support.

**Mitigazione**
- parità funzionale prima del pruning;
- golden tests su viewport/grouping;
- test di interazione guidati su scene reali.

### 4.3 — Timescales System Reframe

**Problema attuale**
- tre strumenti con modelli interattivi diversi;
- overview ottima ma isolata;
- explorer ricco ma non integrato col resto del sandbox.

**Soluzione proposta**
- convergere su un temporal scene model condiviso;
- rendere `Overview` e `Explorer` più timeline-based;
- mantenere `Comparator` come strumento comparativo, ma su primitive condivise e con semantica coerente.

**Impatto tecnico**
- meno duplicazione di logica di scala/tooltip/selection;
- esperienza prodotto più coesa.

**Rischi**
- rischio di “schiacciare” troppo le specificità di Timescales.

**Mitigazione**
- condividere engine e primitive, non uniformare forzatamente tutto il linguaggio visuale.

### 4.4 — Mobile UX Hardening

**Problema attuale**
- alcuni controlli restano sensibili a wrapping e overflow;
- settings form e DOB picker hanno ancora punti di fragilità;
- interazioni dense in timeline e filters degradano rapidamente su viewport stretti.

**Soluzione proposta**
- migrare Settings e componenti form su nuove layout primitives;
- trattare mobile come baseline, non come override finale;
- introdurre audit sistematico per viewport 320 / 360 / 390 / 480 / 720.

**Impatto tecnico**
- meno media query eccezionali;
- meno regressioni di allineamento;
- migliore resilienza delle superfici critiche.

**Rischi**
- regressioni desktop se il refactor del layout è troppo aggressivo.

**Mitigazione**
- visual regression su mobile e desktop per ogni fase.

### 4.5 — 3D Architecture Preparation

**Problema attuale**
- 3D già funzionale ma ancora dipendente da convenzioni della timeline principale;
- rischio di divergenza semantica tra 2D e 3D.

**Soluzione proposta**
- definire un event schema condiviso;
- allineare selection, lane semantics e quality profiles;
- isolare meglio wrapper, scene config e fallback policies.

**Impatto tecnico**
- meno accoppiamento implicito;
- migliore base per future ottimizzazioni performance.

**Rischi**
- investire troppo presto nel 3D.

**Mitigazione**
- Fase 4 solo dopo stabilizzazione 2D e Timescales.

### 4.6 — Dead Code Cleanup

**Problema attuale**
- presenza di file non usati o parzialmente legacy;
- persistenza di API e contesto non più esposti pubblicamente;
- rischio di build complexity e confusione per i contributor.

**Soluzione proposta**
- audit esplicito `active / legacy / orphan / removable`;
- rimozione progressiva dopo sostituzione e copertura;
- aggiornamento contestuale di docs, specs e test.

**Impatto tecnico**
- meno complessità cognitiva;
- meno rischio di riesumare pattern superati.

**Rischi**
- rimuovere troppo presto parti ancora referenziate indirettamente.

**Mitigazione**
- grep audit + smoke suite + aggiornamento specs nello stesso step.

### 4.7 — Testing Strategy Refactor

**Problema attuale**
- coverage concentrata su pure functions;
- mancano test UI / integration / visual regression.

**Soluzione proposta**
- estendere Vitest con React Testing Library;
- introdurre Playwright per UI regression e mobile flows critici;
- aggiungere performance smoke tests per timeline 2D e gating 3D;
- eliminare test legati a feature legacy solo quando la rimozione è effettiva.

**Impatto tecnico**
- protezione reale del refactor;
- cleanup più sicuro;
- meno regressioni mobili e interattive.

**Rischi**
- aumento del costo di manutenzione dei test.

**Mitigazione**
- test pyramid chiara: pochi e2e, più integration mirate, pure unit per il core.

---

## 5 — Piano per fasi

### Fase 0 — Cleanup audit + architecture baseline

**Obiettivo:** stabilire l’inventario reale prima di migrare.

**Stato:** ✅ completata il 2026-04-22

**Deliverable attesi**
- classificazione di componenti, hook, CSS e feature in: `active`, `legacy`, `orphan`, `candidate removal`;
- mappa dei CSS globali e delle responsabilità duplicate;
- baseline docs aggiornata (`PLAN.md`, `DECISIONS.md`, specs secondarie);
- scelta finale delle primitive da introdurre per prime;
- visual baseline su viewport chiave.

**Deliverable prodotti**
- `AUDIT_SUMMARY.md` con inventario verificato, backlog e cleanup boundary;
- `ARCHITECTURE_BASELINE.md` con snapshot di runtime, routing, contexts, timeline, Timescales, 3D e CSS;
- aggiornamento della baseline documentale in `PLAN.md`, `DECISIONS.md`, `refactor_docs/AGENTS.md` e `README.md`.

**Aree da auditare per prime**
- `src/css/index.css`, `components.css`, `timeline.css`, `personalize.css`;
- `src/components/timeline/*`;
- `src/pages/Settings.tsx`, `src/components/BirthDatePicker.tsx`;
- `src/pages/Timescales.tsx` e relativi componenti;
- candidati dead code già verificati.

**Exit criteria**
- backlog tecnico ordinato per severità e dipendenze;
- elenco rimozioni “safe after replacement”.

**Esito verificato**
- build baseline: ✅ `npm run build`
- test baseline: ✅ `npm test -- --run` → 71 test passati
- lint baseline: ⚠️ 1 warning non bloccante in `UserProfileContext.tsx`
- rimozioni confermate come non immediate: `scaleMode`, `src/components/unused/constants.ts`, blocchi misti in `wizard.css` e `timeline.css`

---

### Fase 1 — UI system migration

**Obiettivo:** costruire il nuovo layer di primitive e usarlo sulle superfici più fragili.

**Stato:** ✅ completata il 2026-04-22

**Scope consigliato**
- introdurre `src/ui/`;
- definire primitive layout e form;
- adottare primitive accessibili per tabs / dialog / tooltip / popover-sheet;
- migrare `Settings`, `BirthDatePicker`, banner, actions, tabs, shared cards;
- ridurre o congelare nuove aggiunte al CSS globale legacy.

**Deliverable attesi**
- primitive base documentate;
- Settings visivamente stabili su small viewport;
- DOB picker riallineato e meno dipendente da eccezioni locali;
- filtri e actions più coerenti con un design system unico.

**Deliverable prodotti finora (slice 1)**
- introdotto `src/ui/` con primitive iniziali: `Button`, `Banner`, `Field`, `FormActions`, `Panel`, `Stack`, `Inline`;
- introdotto `src/css/ui.css` come foglio di stile dedicato alle primitive del nuovo layer;
- migrati `src/pages/Settings.tsx` e `src/components/BirthDatePicker.tsx` al nuovo layer UI;
- mantenuta invariata la logica di routing, context e guardrail (`beforeunload`, blocco DOB mancante, reset profilo, clear DOB);
- rinviata l’adozione di primitive headless per `Tabs` / `Dialog` / `Tooltip` alla slice successiva, dove il costo di integrazione sarà giustificato.

**Deliverable prodotti finora (slice 2)**
- introdotta `src/ui/Tabs.tsx` come prima primitive interattiva/headless del nuovo layer;
- aggiunta la dipendenza `@radix-ui/react-tabs` per gestire tabs accessibili con keyboard navigation e wiring ARIA affidabile;
- migrati i tab top-level di `src/pages/Timescales.tsx` al nuovo sistema `Tabs`;
- migrati anche i sub-tab di `src/components/timescales/GeoCosmicExplorer.tsx`, così la primitive è già riusata in runtime attivo;
- preservata la persistenza di `timescalesTab` in `PreferencesContext` e il comportamento locale dell’explorer.

**Deliverable prodotti finora (slice 3)**
- migrati i perspectives tabs di `src/pages/Milestones.tsx` al sistema `Tabs` del nuovo layer UI;
- preservati `unlockedTabs`, `pref_unlockedPerspectives`, unlock progressivo, `toastMsg` e hint iniziale di onboarding;
- adottata `activationMode="manual"` per evitare attivazioni involontarie dei tab locked via sola navigazione tastiera;
- mantenuto invariato il comportamento del pannello collapsible mobile (`perspectives-panel__toggle`) e del rendering di `AgeTable`.

**Deliverable prodotti finora (slice 4 / chiusura Fase 1)**
- migrati anche `src/pages/Landing.tsx`, il banner DOB-gated di `src/pages/Milestones.tsx` e `src/components/ErrorBoundary.tsx` a `Banner`, `Button` e `FormActions` del nuovo layer UI;
- eliminata la dipendenza runtime attiva dalle classi legacy `.tabs/.tab*` e `.status-banner*`;
- avviato cleanup sicuro del CSS legacy con rimozione dei selettori tabs e status-banner non più consumati e pulizia dei bridge locali verso `.button` nelle surface migrate;
- lasciati volutamente fuori dal cleanup immediato `timeline.css`, `wizard` orphan styles, `scaleMode`, `SubTimeline` e il ramo `unused/`, perché legati a fasi successive o a codice legacy non ancora rimosso.

**Rischi principali**
- convivere temporaneamente con il vecchio CSS.

**Criterio di successo**
- le superfici ad alta frizione (`Settings`, actions, banner, tabs) passano tutte attraverso il nuovo layer.

**Esito verificato**
- `Settings`, `BirthDatePicker`, `Landing`, `Milestones` banner/actions e i tab systems attivi (`Timescales`, `GeoCosmicExplorer`, `Milestones`) usano il nuovo layer `src/ui/`;
- lint/test/build passano ancora dopo la migrazione, con il solo warning preesistente in `UserProfileContext.tsx`;
- la Fase 2 può iniziare senza dipendere dal completamento del vecchio sistema tabs/banner.

---

### Fase 2 — Timeline 2D stabilization

**Obiettivo:** ricostruire la timeline come engine + renderer ibrido, con parità funzionale minima e stabilità superiore.

**Stato:** ✅ completata il 2026-04-23 — shared canvas/overlay renderer, canvas-native hit-testing, legacy timeline cleanup

**Scope consigliato**
- creare il nuovo `timeline-core`;
- migrare viewport math, grouping, lane layout e selection model;
- introdurre renderer Canvas/SVG;
- mantenere la stessa semantica prodotto (`Personal` / `Global`, detail panel, filters, focus value);
- disaccoppiare gesture/input da rendering;
- iniziare decommissioning di `scaleMode` legacy e codice orfano della vecchia timeline.

**Deliverable attesi**
- timeline 2D più stabile sotto pan/zoom;
- meno nodi DOM dinamici;
- rendering e hit-testing misurabili e testabili separatamente;
- `SubTimeline` formalmente deprecato/rimosso dopo replacement.

**Deliverable prodotti finora (slice 1 / kickoff)**
- introdotto `src/components/timeline-core/` come primo layer puro di Fase 2;
- spostata la logica di grouping/positioning in `src/components/timeline-core/buildRenderItems.ts`, mantenendo `src/components/timeline/buildRenderItems.ts` come re-export compatibile;
- introdotto `buildTimelineScene` per centralizzare tick, lane ordering, lane layout, focus ratio e render items per lane;
- aggiornata `src/components/timeline/Timeline.tsx` per consumare il scene model, riducendo la logica di orchestrazione locale;
- aggiunto `TimelineGlobalLaneCanvas.tsx` come prima surface Canvas runtime, limitata alla lane globale e mantenuta dietro al layer DOM accessibile esistente;
- aggiunta copertura mirata con `src/tests/buildTimelineScene.test.ts` per proteggere il nuovo model layer senza introdurre ancora test UI/E2E.

**Deliverable prodotti finora (slice 2 / interaction + overlay)**
- introdotto `src/components/timeline-core/interaction.ts` con `TimelineSelectionPayload`, `TimelineInteractiveTarget`, mapping detail-items e geometry minima per hit-targets;
- esteso `buildTimelineScene` per emettere `interactiveTargets` lane-aware nel core, non più calcolati localmente in `Timeline.tsx`;
- aggiunto `TimelineGlobalLaneOverlay.tsx` come overlay HTML accessibile sopra la lane globale canvas-based;
- migrata la lane `global` a un path ibrido `canvas visuale + overlay button targets`, lasciando la lane `personal` sul markup DOM esistente per contenere il rischio;
- centralizzata parte della selection logic tramite payload core riusabili anche dai consumer runtime;
- aggiunte dipendenze dev `@testing-library/react` e `jsdom` per avviare la copertura component-level della timeline;
- aggiunti `src/tests/buildTimelineInteraction.test.ts` e `src/tests/timelineGlobalOverlay.test.tsx` per coprire hit-target contract, keyboard activation, detail panel e axis pointer path.

**Deliverable prodotti infine (slice 3 / chiusura fase)**
- migrata la lane `personal` al nuovo overlay model condiviso; il runtime attivo non usa più marker/group DOM per nessuna lane;
- rinominati i renderer attivi in `src/components/timeline/TimelineSceneCanvas.tsx` e `src/components/timeline/TimelineInteractiveOverlay.tsx` per riflettere il ruolo lane-agnostic;
- esteso `timeline-core/interaction.ts` con geometria visuale, target center offset e resolver `resolveTimelineTargetAtPoint` per hit-testing canvas-native con slop e priorità del target preferito;
- rimossi `scaleMode` e `pref_scaleMode` dal runtime timeline / `PreferencesContext`;
- rimosso `src/components/timeline/SubTimeline.tsx` e relativo ramo di tipi/CSS legacy;
- rafforzata la suite con copertura della lane `personal` e del pointer hit-testing; baseline aggiornata a 81 test.

**Boundary espliciti della slice 1**
- nessuna rimozione ancora di `SubTimeline`, `scaleMode` legacy o markup DOM degli event marker;
- nessun cambio ancora al contract pubblico di `Milestones` o alla semantica `Personal / Global`;
- il canvas introdotto in questa slice è volutamente decorativo/scene-based, non ancora il renderer interattivo definitivo.

**Boundary espliciti a chiusura fase**
- il detail panel continua a vivere fuori dal canvas ed è ancora alimentato da payload detail-side, non da un inspector engine separato;
- `EventElement.tsx` resta nel repository come fallback/cleanup debt, ma non è più parte del renderer timeline attivo;
- l’hit-testing attivo è geometry-based e canvas-native lato input model; non usa ancora scene picking per-pixel o un inspector engine separato.

**Esito verificato**
- `npm test -- --run` → ✅ 81 test passati su 10 file;
- `npm run build` → ✅ produzione compilata con successo;
- `npm run lint` → ⚠️ solo 1 warning preesistente in `src/context/UserProfileContext.tsx`.

**Criterio di successo**
- la nuova timeline raggiunge parità funzionale minima con crash rate e regressioni mobili inferiori rispetto alla versione DOM-based.

---

### Fase 3 — Timescales + UX improvements

**Obiettivo:** riframmare Timescales e completare il mobile hardening trasversale.

**Stato:** ✅ completata il 2026-04-23 — overview hardening + explorer detail/mobile semantics + comparator accessibility + cross-page mobile consistency + shared temporal helpers

**Scope consigliato**
- allineare `Overview` e `Explorer` al temporal engine condiviso dove utile;
- consolidare filtri, detail patterns e semantics;
- rifinire layout mobile di pagine critiche rimaste fuori dalla Fase 1;
- aggiornare copy e help links dove la nuova IA lo richiede.

**Deliverable attesi**
- Timescales più coerente con il resto del prodotto;
- meno strumenti isolati, più “scene” esplorative;
- chiusura dei principali bug mobili rimasti aperti.

**Slice pianificate**
- **Slice 1 — Overview hardening**: shell overview con summary/reset filtri, pinned detail panel per touch/keyboard, loading/error guidance, test RTL dedicati. ✅
- **Slice 2 — Explorer detail + mobile semantics**: breadcrumb/detail panel/explore flow più robusti e senza overflow mobile. ✅
- **Slice 3 — Comparator search/accessibility hardening**: search dropdown, keyboard flow, duplicate exclusion, wrapping sotto 480px. ✅
- **Slice 4 — Cross-page mobile consistency**: hardening finale su `Settings`, DOB picker e controlli densi ancora sensibili. ✅
- **Slice 5 — Shared temporal helpers**: convergenza più strategica del model temporale tra `Timeline` e `Timescales`. ✅

**Deliverable prodotti finora (slice 1 / overview hardening)**
- `src/pages/Timescales.tsx` ora espone una overview shell dedicata con summary live, reset filtri e guidance esplicita per loading/error/empty/touch users;
- `src/components/timescales/TimescaleOverview.tsx` supporta selezione persistente di un fenomeno e detail panel pinned sotto il ruler logaritmico;
- `src/css/timescales.css` è stata estesa con toolbar overview + detail card mobile-first;
- introdotto `src/tests/timescalesOverview.test.tsx` per coprire summary/reset, detail panel pinned e stati loading/error.

**Deliverable prodotti finora (slice 2 / explorer detail + mobile semantics)**
- `src/components/timescales/GeoCosmicExplorer.tsx` ora espone summary di livello, back flow, breadcrumb con `aria-current`, detail panel focus-safe e empty state esplicito;
- `src/components/timescales/EraCard.tsx` collega semanticamente il bottone details al pannello attivo via `aria-expanded`/`aria-controls` e rende più esplicita l’azione di drilldown;
- `src/hooks/useExplorerDrilldown.ts` elimina selezioni stale quando il livello visibile cambia;
- `src/css/timescales.css` è stata estesa con summary/back actions explorer, action targets mobile-friendly e wrapping resiliente per breadcrumb/meta/detail;
- introdotto `src/tests/geoCosmicExplorer.test.tsx` per coprire loading/error, detail toggle, drilldown, breadcrumb/back flow e switch geological/cosmic.

**Deliverable prodotti finora (slice 3 / comparator search + accessibility hardening)**
- `src/components/timescales/PhenomenaSearch.tsx` ora espone semantics `combobox/listbox`, sync del valore selezionato, keyboard navigation (`ArrowUp/Down`, `Home/End`, `Enter`, `Escape`), cleanup del debounce e messaggistica empty-state/hint più esplicita;
- `src/components/timescales/PhenomenaComparator.tsx` ora guida il flow con copy/status live, labels accessibili per i due picker e guardrail runtime contro selezioni duplicate tra slot;
- `src/css/timescales.css` è stata estesa con stati attivo/current del dropdown, hint comparatore e wrapping resiliente per search items + colonna `vs` sotto 480px;
- introdotto `src/tests/phenomenaComparator.test.tsx` per coprire keyboard-driven selection, duplicate exclusion, empty-state e stato di confronto annunciato.

**Deliverable prodotti finora (slice 4 / cross-page mobile consistency)**
- `src/components/BirthDatePicker.tsx` ora usa un `max` locale per il date input, espone un summary condiviso della DOB salvata e rende più esplicita la sync tra `Landing`, `Settings` e le view DOB-dependent;
- `src/pages/Landing.tsx` rimuove il summary duplicato locale e converge sullo stesso feedback del picker condiviso;
- `src/components/common/Headers.tsx` allinea il brand link del navbar al guardrail di `Settings`, così il blocco di uscita quando manca il DOB vale anche fuori dal menu dropdown;
- `src/pages/Settings.tsx`, `src/css/personalize.css`, `src/css/ui.css`, `src/css/timeline.css` e `src/css/components.css` estendono input mode, summary form copy, stacking e touch targets per viewport stretti e controlli densi;
- introdotto `src/tests/settingsDobFlow.test.tsx` per coprire persistenza DOB condivisa, clear flow e navigation guard coerente.

**Deliverable prodotti infine (slice 5 / shared temporal helpers)**
- introdotto `src/utils/temporalScale.ts` come helper puro dedicato alla scala temporale assoluta fuori da `scaleTransform.ts`, così il math di viewport/date della timeline resta separato dal math Timescales;
- estratti `absoluteLogRatio`, `absoluteLogPercent`, `roundedLogExponent` e `formatLogExponentLabel` per convergere le duplicazioni reali di mapping/formatting a basso rischio;
- migrati `src/components/timescales/TimescaleOverview.tsx`, `src/components/timescales/PhenomenaComparator.tsx` e `src/components/timescales/GeoCosmicExplorer.tsx` ai nuovi helper condivisi, mantenendo invariati i contratti di selection e il dual-slot comparator model;
- lasciati volutamente fuori dalla slice il merge della selection tra `Timeline` e `Timescales`, `TimelineSelectionPayload`, `handleSingleSelect/handleGroupSelect`, `useExplorerDrilldown` oltre al helper lineare geologico di `EraCard`, per evitare over-abstraction prematura;
- introdotto `src/tests/temporalScale.test.ts` e rafforzate `src/tests/timescalesOverview.test.tsx`, `src/tests/phenomenaComparator.test.tsx` e `src/tests/geoCosmicExplorer.test.tsx` con regressioni mirate sui nuovi helper condivisi.

**Boundary espliciti dopo la slice 5**
- la convergenza si ferma agli helper di scala/formatter a basso rischio: nessun tentativo di unificare ancora il contratto di selection tra `Timeline` e `Timescales`;
- `Timeline.tsx`, `timeline-core/interaction.ts` e il dual-slot model di `PhenomenaComparator` restano invariati: niente toggle helper condiviso, niente cleanup contract comune, niente rinomina forzata del payload runtime;
- la durata geologica lineare di `EraCard` e l’hook `useExplorerDrilldown` restano separati in questa slice; eventuali duration helpers condivisi sono considerati solo come opzione successiva;
- il mobile hardening principale è ora chiuso sulle surface più sensibili (`Settings`, DOB flow, comparator, overview, explorer), ma non esistono ancora visual regression / e2e mobile dedicati;
- i controlli densi timeline/age-table sono stati solo hardenizzati via layout/touch-target, non ridisegnati come primitive separate.

**Esito verificato (slice 5)**
- `npm test -- --run` → ✅ 104 test passati su 15 file;
- `npm run build` → ✅ produzione compilata con successo;
- `npm run lint` → ⚠️ solo 1 warning preesistente in `src/context/UserProfileContext.tsx`.

**Criterio di successo**
- esperienza mobile coerente tra `Milestones`, `Timescales`, `Settings`.

---

### Fase 4 — Timeline 3D architecture

**Obiettivo:** riallineare il 3D al nuovo model senza trasformarlo nella priorità del refactor.

**Stato:** ✅ completata il 2026-04-26 — slice 4 verificata: pure 3D scene adapter + runtime policy + shared inspector bridge + single-marker contract convergence

**Scope consigliato**
- adapter condivisi 2D/3D;
- policy di quality profiles e budgets;
- isolamento dei fallback e dei confini di errore 3D;
- possibile riduzione dei rerender e migliore sincronizzazione del focus model.

**Deliverable attesi**
- scena 3D più indipendente dalla vecchia timeline 2D;
- stessa semantica eventi/lane del nuovo core;
- preparazione per future ottimizzazioni senza introdurre nuovo stack.

**Deliverable prodotti finora (slice 1 / adapter kickoff)**
- introdotto `src/components/timeline-core/buildTimeline3DScene.ts` come adapter puro per la scena 3D, con contract esplicito per lanes, ticks, focus e marker projection;
- riusato il lane order canonico del `timeline-core` e la semantica condivisa di `TimelineEvent`, evitando che `Timeline3D.tsx` continui a mantenere in locale il proprio mapping temporale principale;
- migrato `src/components/3d/Timeline3D.tsx` a un ruolo soprattutto render-only, lasciando invariati `Timeline3DWrapper.tsx`, lazy import, fallback WebGL e quality profile `balanced / low-power`;
- introdotto `src/tests/buildTimeline3DScene.test.ts` per coprire il nuovo adapter e proteggere la parità minima del math 3D rispetto al contract timeline condiviso.

**Deliverable prodotti finora (slice 2 / runtime policy extraction)**
- introdotto `src/components/3d/runtimePolicy.ts` come modulo puro dedicato al runtime contract del 3D: availability, toggle state, quality-profile resolution e renderer budgets condivisi;
- `src/components/3d/Timeline3DWrapper.tsx` ora usa `resolveTimeline3DAvailability` e `resolveTimeline3DQualityProfile` invece di branch inline su `WEB_GL_SUPPORTED` e media query;
- `src/components/3d/Timeline3D.tsx` ora consuma `getTimeline3DProfileConfig` per camera, DPR, stars, lighting, orbit-controls, performance budget e hint copy, riducendo ulteriore logica policy nel renderer;
- `src/pages/Milestones.tsx` ora usa `resolveTimeline3DToggleState` per titolo/label/disabled del toggle 3D, così il gating sperimentale non duplica più copy e condizioni in pagina;
- introdotti `src/tests/timeline3DRuntime.test.ts` e `src/tests/timeline3DWrapper.test.tsx` per proteggere policy pure + wiring wrapper.

**Deliverable prodotti finora (slice 3 / selection + inspector bridge)**
- `src/components/timeline-core/interaction.ts` ora espone `createTimelineEventSelectionPayload`, così il 3D riusa lo stesso shape `selectionKey + detailItems` già usato dal runtime timeline 2D invece di ricreare payload locali;
- `src/components/3d/EventMarker3D.tsx` supporta attivazione pointer/click e mantiene highlight + label quando il marker è selezionato, rendendo leggibile lo stato anche dopo l’apertura dell’inspector fuori canvas;
- `src/components/3d/Timeline3D.tsx` inoltra la selezione del marker come payload condiviso, mentre `src/components/3d/Timeline3DWrapper.tsx` ospita ora un inspector HTML riusando `TimelineDetailPanel` e pulisce la selezione stale quando l’evento esce dal dataset visibile;
- `src/pages/Milestones.tsx` passa il setter di `focusValue` al wrapper 3D, quindi un marker selezionato in 3D riallinea subito il focus condiviso che verrà ritrovato anche tornando alla timeline 2D;
- introdotto `src/tests/timeline3DInteraction.test.tsx` per coprire inspector shared-first, focus sync e cleanup della selezione.

**Deliverable prodotti infine (slice 4 / single-marker contract convergence)**
- `src/components/timeline-core/interaction.ts` ora espone `buildTimelineSingleEventDescriptor`, `resolveTimelineEventColor` e i metadata labels condivisi dei marker singoli, così colore, copy semantica e payload detail vivono in un solo layer puro riusabile da 2D e 3D;
- `src/components/timeline-core/buildTimeline3DScene.ts` emette marker già arricchiti con `selectionKey`, `detailItems`, `semanticLabel`, `metaLabels`, `ariaLabel`, `markerShape` e `color`, invece di delegare questi dettagli al renderer R3F;
- `src/components/3d/EventMarker3D.tsx` è ora un puro renderer del marker descritto dal core condiviso e non mantiene più palette o metadata label locali;
- `src/components/3d/Timeline3D.tsx` inoltra solo `selectionKey + focusValue`, mentre `src/components/3d/Timeline3DWrapper.tsx` conserva solo `selectedSelectionKey` e deriva il detail descriptor dal dataset corrente, riducendo stato duplicato e drift tra scene/wrapper;
- i test del core e del 3D proteggono ora anche il contract condiviso di copy/color/detail dei marker singoli, non solo focus math e inspector wiring.

**Boundary espliciti a chiusura Fase 4**
- la convergenza della Fase 4 si ferma ai marker singoli: group selection 3D, overlay button accessibile e parity completa con `TimelineInteractiveTarget` restano fuori scope;
- non esiste ancora una semantica keyboard-first dei marker 3D comparabile all’overlay della timeline 2D; il percorso attivo resta pointer/touch-first con inspector HTML esterno al canvas;
- hover e selection condividono ora copy/color/detail single-marker e il `focusValue`, ma non esiste ancora uno store cross-runtime di hover/focus oltre questa sincronizzazione minima;
- il toggle `show3D` resta nel `PreferencesContext` e non viene ancora sostituito da uno state machine/runtime controller più ricco.

**Esito verificato (slice 4 / chiusura Fase 4)**
- `npm test -- --run` → ✅ 120 test passati su 19 file;
- `npm run build` → ✅ produzione compilata con successo;
- `npm run lint` → ⚠️ solo 1 warning preesistente in `src/context/UserProfileContext.tsx`.

**Criterio di successo**
- il 3D resta opzionale ma non più “special case” fragile: scene math, runtime policy e contract single-marker condiviso vivono ora su boundary espliciti e testati.

---

### Fase 5 — Testing + hardening + pruning finale

**Obiettivo:** chiudere il refactor con qualità, cleanup e documentazione coerente.

**Scope consigliato**
- introdurre integration tests e UI regression;
- performance smoke tests per timeline e 3D;
- rimuovere legacy confermato;
- ripulire CSS inutilizzato, componenti orfani, persistenze legacy, test obsoleti;
- aggiornare AGENTS, README e docs di refactor.

**Deliverable attesi**
- suite test coerente col nuovo sistema;
- codice morto rimosso;
- documentazione riallineata allo stato finale.

**Criterio di successo**
- la codebase diventa leggibile e manutenibile anche per contributor non autori del refactor.

---

## 6 — Testing strategy

### 6.1 — Cosa testare

#### Unit
- math di viewport, scale, grouping, culling, hit-testing;
- adattatori dati timeline / timescales / 3D;
- formatting e semantics.

#### Integration
- `Settings` + `BirthDatePicker`;
- lane filters e category filters;
- detail panel timeline;
- tab systems di `Milestones` e `Timescales`;
- fallback locali / error boundaries di sezione.

#### UI interaction
- pan / zoom / select / reset timeline;
- touch / pointer / wheel behavior;
- mobile actions e wrapping controls;
- 3D gating (WebGL fallback, low-power profile selection).

#### Visual regression
- viewport 320 / 360 / 390 / 480 / 720 / 1024;
- `Settings`, `Milestones`, `Timescales`;
- timeline empty/loading/error states;
- banners, form actions, DOB picker, lane filters.

#### Performance smoke
- densità eventi moderata / alta;
- zoom repeated interactions;
- first open della scena 3D;
- scroll e resize su mobile.

### 6.2 — Come testare

| Livello | Strumento consigliato | Ruolo |
|---|---|---|
| Unit | Vitest | engine puro, adapters, utils |
| Integration | Vitest + React Testing Library | behavior dei componenti e delle nuove primitive |
| UI / Regression | Playwright | flow end-to-end e visual diff mobile-first |
| Perf smoke | Playwright + metriche leggere custom | guardrail, non benchmark scientifico |

### 6.3 — Cosa rimuovere o aggiornare

Da rimuovere o sostituire quando la migrazione è effettiva:

- test dedicati a flussi legacy rimossi;
- eventuali assert su `scaleMode` UI non più esistente;
- coverage legata a componenti orfani eliminati;
- snapshot o helper che riflettono il vecchio markup DOM-based della timeline.

---

## 7 — Struttura e uso di `DECISIONS.md`

`DECISIONS.md` è il registro ADR operativo del refactor_4.

### Schema di ogni decisione

- **ID**
- **Data**
- **Fase**
- **Stato** (`proposed`, `accepted`, `implemented`, `superseded`)
- **Contesto**
- **Decisione**
- **Alternative valutate**
- **Impatto / conseguenze**
- **Trigger di rollback o revisione**

### Categorie suggerite

- UI System
- Timeline 2D
- Timescales
- 3D
- Testing
- Cleanup / deprecation
- Docs / governance

### Regola d’uso

Ogni decisione che:

- introduce una libreria,
- cambia il model layer,
- depreca un sottosistema,
- altera una surface primaria,

va registrata prima o contestualmente all’implementazione.

---

## 8 — Rischi principali e mitigazioni

| Rischio | Mitigazione |
|---|---|
| Doppio sistema UI troppo lungo | migrare prima primitive condivise ad alta leva |
| Timeline 2D troppo ambiziosa | definire parità minima e renderer ibrido, non feature explosion |
| Cleanup prematuro | rimuovere solo dopo test + grep audit + docs update |
| Regressioni mobili | visual regression obbligatoria sui viewport chiave |
| Investimento 3D troppo anticipato | Fase 4 subordinata a Fase 2 e 3 concluse |
| Troppa dipendenza da nuove librerie | usare solo primitive/headless o math libs mirate |

---

## 9 — Checklist finale del refactor_4

- [x] Inventario legacy / orphan / active completato
- [x] Layer `src/ui/` introdotto e adottato sulle surface critiche
- [x] Settings e DOB flow stabilizzati con nuove primitive
- [x] Timeline 2D migrata a renderer Canvas/SVG
- [x] `scaleMode` legacy deprecato o rimosso dove non più utile
- [x] `SubTimeline` e altri orphan gestiti correttamente
- [ ] Timescales riallineato al nuovo model esplorativo
- [x] 3D riallineato al contratto eventi condiviso
- [ ] Coverage integration/UI regression aggiunta
- [ ] Dead code ripulito senza regressioni funzionali
- [ ] Specs e documentazione aggiornate per riflettere il nuovo piano

---

*Questo documento definisce la baseline di esecuzione di Refactor 4. Le modifiche strategiche successive devono passare da `DECISIONS.md`.*

