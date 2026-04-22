# PLAN — Refactor 4: UI Platform Stabilization & Timeline Systems

**Data:** 2026-04-22  
**Stato:** 🟡 In corso — Fase 0 completata, Fase 1 completata, cleanup iniziale avviato

---

## Snapshot esecutivo — aggiornamento Fase 0

Al 2026-04-22 la **Fase 0 è stata eseguita e verificata** contro la codebase reale.

Output prodotti:

- `refactor_docs/refactor_4/AUDIT_SUMMARY.md`
- `refactor_docs/refactor_4/ARCHITECTURE_BASELINE.md`
- aggiornamento di `DECISIONS.md`, `AGENTS.md` e `README.md`

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
- `buildRenderItems.ts` è una buona base pura per grouping e posizionamento, ma il rendering finale è ancora fortemente legato al DOM.
- Ogni marker / group bubble viene renderizzato come nodo React / DOM, il che rende costosa la crescita del sistema e fragile la gestione di collisioni, hit area e pan/zoom.
- `PreferencesContext.tsx` conserva ancora `scaleMode`, anche se la UI pubblica del toggle log è stata rimossa: è un debito legacy.
- `SubTimeline.tsx` esiste ancora ma non è più parte della surface attiva: è codice orfano.

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
- `src/components/timeline/SubTimeline.tsx` (presente ma non più agganciato alla surface attiva)

#### Legacy / mixed status

- `scaleMode` in `PreferencesContext.tsx`: persistenza legacy senza surface pubblica;
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

**Criterio di successo**
- la nuova timeline raggiunge parità funzionale minima con crash rate e regressioni mobili inferiori rispetto alla versione DOM-based.

---

### Fase 3 — Timescales + UX improvements

**Obiettivo:** riframmare Timescales e completare il mobile hardening trasversale.

**Scope consigliato**
- allineare `Overview` e `Explorer` al temporal engine condiviso dove utile;
- consolidare filtri, detail patterns e semantics;
- rifinire layout mobile di pagine critiche rimaste fuori dalla Fase 1;
- aggiornare copy e help links dove la nuova IA lo richiede.

**Deliverable attesi**
- Timescales più coerente con il resto del prodotto;
- meno strumenti isolati, più “scene” esplorative;
- chiusura dei principali bug mobili rimasti aperti.

**Criterio di successo**
- esperienza mobile coerente tra `Milestones`, `Timescales`, `Settings`.

---

### Fase 4 — Timeline 3D architecture

**Obiettivo:** riallineare il 3D al nuovo model senza trasformarlo nella priorità del refactor.

**Scope consigliato**
- adapter condivisi 2D/3D;
- policy di quality profiles e budgets;
- isolamento dei fallback e dei confini di errore 3D;
- possibile riduzione dei rerender e migliore sincronizzazione del focus model.

**Deliverable attesi**
- scena 3D più indipendente dalla vecchia timeline 2D;
- stessa semantica eventi/lane del nuovo core;
- preparazione per future ottimizzazioni senza introdurre nuovo stack.

**Criterio di successo**
- il 3D resta opzionale ma non più “special case” fragile.

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
- [ ] Timeline 2D migrata a renderer Canvas/SVG
- [ ] `scaleMode` legacy deprecato o rimosso dove non più utile
- [ ] `SubTimeline` e altri orphan gestiti correttamente
- [ ] Timescales riallineato al nuovo model esplorativo
- [ ] 3D riallineato al contratto eventi condiviso
- [ ] Coverage integration/UI regression aggiunta
- [ ] Dead code ripulito senza regressioni funzionali
- [ ] Specs e documentazione aggiornate per riflettere il nuovo piano

---

*Questo documento definisce la baseline di esecuzione di Refactor 4. Le modifiche strategiche successive devono passare da `DECISIONS.md`.*

