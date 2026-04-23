# DECISIONS — Refactor 4: UI Platform Stabilization & Timeline Systems

**Data di apertura:** 2026-04-22  
**Stato:** 🟡 In corso — Fase 0 completata, Fase 1 completata, Fase 2 completata, Fase 3 completata, Fase 4 slice 2 verificata

---

## Scopo del file

Questo documento è il registro ADR (Architecture Decision Record) di `refactor_4`.

Serve a tracciare in modo sintetico e verificabile:

- scelte architetturali;
- trade-off tecnici;
- librerie introdotte o escluse;
- deprecazioni deliberate;
- decisioni UI/UX strutturali che influenzano implementazione, test e cleanup.

`PLAN.md` definisce la roadmap.  
`DECISIONS.md` registra **perché** certe strade sono state scelte e quali vincoli diventano vincolanti per le fasi successive.

---

## Schema standard di una decisione

Ogni nuova decisione dovrebbe usare questa struttura:

```markdown
## D-XX — Titolo breve

**Data:** YYYY-MM-DD  
**Fase:** N  
**Stato:** proposed | accepted | implemented | superseded

### Contesto
...

### Decisione
...

### Alternative valutate
- ...
- ...

### Impatto / conseguenze
- ...
- ...

### Trigger di revisione o rollback
- ...
```

---

## Categorie usate in refactor_4

- **UI System**
- **Timeline 2D**
- **Timescales**
- **3D Architecture**
- **Testing**
- **Cleanup / Deprecation**
- **Docs / Governance**

---

## D-01 — UI System: scelta di Option C

**Data:** 2026-04-22  
**Fase:** 1  
**Stato:** accepted

### Contesto
La codebase usa ancora un layer CSS molto globale e accoppiato tra pagine, componenti e breakpoint. I problemi principali sono spacing, wrapping, alignment, modali e densità dei controlli su mobile. È stata valutata una migrazione verso un sistema UI più robusto.

### Decisione
Refactor 4 adotta **Option C: CSS modulare + primitive accessibili React-first** come direzione ufficiale.

Il visual styling rimane interno al progetto, mentre il comportamento dei componenti interattivi viene ricondotto a primitive affidabili e composabili.

### Alternative valutate
- **Option A — Tailwind / utility-first subito**: potente ma troppo invasiva come migrazione culturale e strutturale in questa fase.
- **Continuare con plain CSS globale**: costo immediato basso, ma perpetua la fragilità attuale.
- **Migrare a design system completo esterno**: riduce parte del lavoro, ma rischia mismatch visivo e over-abstraction per una sandbox sperimentale.

### Impatto / conseguenze
- si introduce un layer `src/ui/`;
- il CSS globale viene progressivamente ridotto a reset, tokens e layout root;
- le surface critiche migrano verso primitive condivise prima di ogni grande rewrite visuale.

### Trigger di revisione o rollback
- se il nuovo layer aumenta invece di ridurre la complessità di authoring;
- se la migrazione blocca la timeline 2D invece di accelerarla.

---

## D-02 — Primitive accessibili: adozione mirata di Radix UI

**Data:** 2026-04-22  
**Fase:** 1  
**Stato:** accepted

### Contesto
Kronoscope non ha bisogno di una libreria visuale opinionated completa, ma ha bisogno di primitive accessibili solide per dialog, tabs, tooltip e overlay/sheet, specialmente su mobile.

### Decisione
Adottare **Radix UI** in modo mirato per le primitive interattive ad alto rischio:

- `Dialog`
- `Tabs`
- `Tooltip`
- `Popover`
- `Slot`

Il look & feel resta custom e modulare.

### Alternative valutate
- **Ariakit**: valida, ma meno allineata al tipo di primitive previste e alla superficie documentata necessaria.
- **Headless UI**: più legata a un ecosistema di styling diverso da quello scelto.
- **Soluzione tutta custom**: costo iniziale minore in dipendenze, ma più fragilità e più manutenzione accessibilità.

### Impatto / conseguenze
- riduzione del rischio su overlay, tabs e sheet mobile;
- migliore integrazione con CSS modulare via `data-state`;
- più facile evoluzione futura verso un sistema utility-driven, se necessaria.

### Trigger di revisione o rollback
- problemi seri di integrazione con il routing o con le gesture dei pannelli;
- bundle cost non giustificato rispetto alla copertura dei problemi risolti.

---

## D-03 — Timeline 2D: niente prosecuzione DOM-based incrementale

**Data:** 2026-04-22  
**Fase:** 2  
**Stato:** accepted

### Contesto
La timeline è il sistema più fragile della codebase. L’architettura attuale ha già beneficiato di una decomposizione logica, ma il rendering resta sostanzialmente DOM-based. Questo limita performance, stabilità di gesture e controllo di grouping/hit-testing.

### Decisione
La timeline 2D **non** evolve come DOM engine incrementale.  
Refactor 4 passa in Fase 2 a una **surface aggressiva Canvas/SVG**.

### Alternative valutate
- **Continuare a ottimizzare la timeline DOM esistente**: più economico nel brevissimo termine, ma non sufficiente per la criticità del sistema.
- **Adozione di una charting library generalista**: troppo vincolante e poco adatta al modello lane-based di Kronoscope.
- **Riscrittura totale con altro framework**: esclusa dal vincolo di non cambiare stack senza forte giustificazione.

### Impatto / conseguenze
- si investe prima nell’engine che nella cosmetica della timeline;
- si apre la strada a dataset più densi e interazioni più stabili;
- il rendering dei marker non dipende più dal numero di nodi DOM attivi.

### Trigger di revisione o rollback
- se la parità funzionale minima non è raggiungibile in tempi ragionevoli;
- se i costi di accessibilità risultano non mitigabili nel renderer proposto.

---

## D-04 — Timeline 2D: renderer ibrido Canvas + SVG overlay

**Data:** 2026-04-22  
**Fase:** 2  
**Stato:** accepted

### Contesto
Passare a Canvas/SVG non basta: serve scegliere come distribuire rendering, accessibilità e UI di selezione.

### Decisione
Usare un renderer **ibrido**:

- **Canvas** per scene ad alta densità: markers, groups, rails, focus indicators frequenti;
- **SVG/HTML overlay** per ticks, labels selezionate, affordance interattive accessibili, detail anchoring.

### Alternative valutate
- **Solo SVG**: più accessibile, ma meno efficiente quando i marker crescono.
- **Solo Canvas**: ottimo lato perf, ma più costoso per accessibilità, semantics e overlay management.
- **DOM assoluto**: ormai non allineato agli obiettivi della fase.

### Impatto / conseguenze
- migliore bilanciamento tra performance e accessibilità;
- separazione più netta tra engine e UI layer;
- base più riusabile anche per Timescales.

### Trigger di revisione o rollback
- se l’overlay accessibile introduce una complessità sproporzionata;
- se i costi di sincronizzazione Canvas/SVG risultano superiori ai benefici.

---

## D-05 — Shared temporal engine per Timeline 2D e Timescales

**Data:** 2026-04-22  
**Fase:** 2 / 3  
**Stato:** accepted

### Contesto
`Milestones` e `Timescales` usano già concetti affini (scale, ticks, detail, filtri, selezione), ma con implementazioni separate. Questo produce duplicazione e incoerenza nell’esperienza.

### Decisione
Le capability temporali condivisibili devono convergere in un **temporal engine comune**:

- range/viewport math;
- scale helpers;
- event normalization;
- selection semantics;
- culling/grouping dove applicabile.

I renderer restano diversi quando necessario.

### Alternative valutate
- **Tenere Timescales indipendente**: costo iniziale più basso, ma frammentazione persistente.
- **Unificare anche ogni surface visuale**: eccessivo; si rischia di sacrificare le specificità di Timescales.

### Impatto / conseguenze
- meno duplicazione logica;
- più coerenza del sandbox temporale;
- base tecnica migliore per future modalità di visualizzazione.

### Trigger di revisione o rollback
- se la convergenza tecnica obbliga a snaturare le UX specifiche di Timescales.

---

## D-06 — 3D: mantenere lo stack R3F esistente, non cambiare motore

**Data:** 2026-04-22  
**Fase:** 4  
**Stato:** accepted

### Contesto
Il 3D esiste già, è lazy-loaded ed è semanticamente migliorato in Refactor 3. Il problema principale non è la mancanza di una nuova libreria, ma l’isolamento architetturale insufficiente rispetto al 2D.

### Decisione
Il 3D resta su:

- `@react-three/fiber`
- `@react-three/drei`

Non si introduce un nuovo engine o stack WebGL nel refactor_4.

### Alternative valutate
- **Cambiare libreria 3D**: costo alto, poco valore immediato.
- **Rimuovere il 3D**: non coerente con la natura sperimentale del prodotto.
- **Espandere fortemente il 3D prima del 2D**: priorità errata.

### Impatto / conseguenze
- investimento focalizzato su adapter, contract e budgets;
- minore rischio di dispersione tecnica;
- continuità col lavoro già fatto in Refactor 3.

### Trigger di revisione o rollback
- se il 3D continua a imporre vincoli al 2D invece di restare sistema parallelo.

---

## D-07 — Cleanup: rimozioni solo dopo replacement + coverage minima

**Data:** 2026-04-22  
**Fase:** 0 / 5  
**Stato:** accepted

### Contesto
La codebase contiene candidati dead code già verificabili (`BirthDateWizard`, `useBirthWizard`, `MockCard`, `SubTimeline`) e legacy mixed-status (`scaleMode`, `src/components/unused`). Il rischio principale è rimuovere troppo presto o senza protezioni.

### Decisione
Ogni rimozione segue questa regola:

1. audit di utilizzo;
2. replacement o deprecation esplicita;
3. coverage minima o smoke test;
4. rimozione;
5. aggiornamento contestuale di docs/specs/test.

### Alternative valutate
- **Cleanup upfront aggressivo**: rapido ma rischioso.
- **Non toccare il codice morto fino alla fine**: prolunga confusione e costo cognitivo.

### Impatto / conseguenze
- cleanup più lento ma molto più sicuro;
- migliore tracciabilità delle deprecazioni;
- meno regressioni invisibili.

### Trigger di revisione o rollback
- se una rimozione produce riaccoppiamenti imprevisti o rompe path secondari non coperti.

---

## D-08 — Testing stack: Vitest + RTL + Playwright

**Data:** 2026-04-22  
**Fase:** 5  
**Stato:** accepted

### Contesto
Vitest copre bene la logica pura, ma non protegge abbastanza layout, interazioni timeline, regressioni mobile e integrazione delle nuove primitive.

### Decisione
La strategia di test di Refactor 4 si basa su:

- **Vitest** per unit test e integration test di logica;
- **React Testing Library** per component integration e behavior tests;
- **Playwright** per UI regression, mobile flows e smoke tests principali.

### Alternative valutate
- **Restare solo su Vitest**: insufficiente per il tipo di regressioni attese.
- **Cypress al posto di Playwright**: valido, ma meno allineato alla necessità di visual/mobile audit leggero e parallelizzabile.
- **Snapshot-heavy approach**: troppo fragile per una UI in refactor profondo.

### Impatto / conseguenze
- aumento delle dipendenze dev, ma forte aumento della sicurezza del refactor;
- possibilità di chiudere bug mobile e regressioni interattive con guardrail reali.

### Trigger di revisione o rollback
- se la suite e2e diventa troppo lenta o rumorosa rispetto al valore prodotto.

---

## D-09 — Governance del refactor: nessuna review intermedia di direzione

**Data:** 2026-04-22  
**Fase:** 0  
**Stato:** accepted

### Contesto
Le macro-scelte del refactor sono già state definite: Option C per il UI system, Canvas/SVG dalla Fase 2, nessun rewrite totale, priorità a stabilità mobile e timeline 2D.

### Decisione
`PLAN.md` e `DECISIONS.md` vengono creati come **baseline esecutiva**.  
Non è prevista una nuova fase di ridefinizione strategica intermedia, salvo problemi tecnici seri emersi durante l’implementazione.

### Alternative valutate
- **Nuovo round di design review prima di iniziare**: non necessario, rallenta senza aggiungere chiarezza.
- **Piano minimale senza ADR**: poco robusto per un refactor di questa portata.

### Impatto / conseguenze
- roadmap più eseguibile;
- meno churn documentale;
- decisioni più facili da verificare fase per fase.

### Trigger di revisione o rollback
- solo in presenza di blocker architetturali nuovi e non previsti nel piano iniziale.

---

## D-10 — Fase 0: baseline documentale ufficiale su audit + architecture snapshot

**Data:** 2026-04-22  
**Fase:** 0  
**Stato:** implemented

### Contesto
`PLAN.md` e `DECISIONS.md` definivano la direzione strategica del refactor_4, ma mancava ancora un output operativo che fissasse lo stato reale della codebase corrente: routing, providers, superfici attive, CSS globale critico, cleanup boundary e risultati di build/test.

### Decisione
La baseline esecutiva di Fase 0 viene formalizzata in due documenti aggiuntivi:

- `AUDIT_SUMMARY.md`
- `ARCHITECTURE_BASELINE.md`

Questi documenti diventano il riferimento pratico per l’avvio della Fase 1, mentre `PLAN.md` continua a descrivere roadmap e `DECISIONS.md` continua a registrare le ADR.

### Alternative valutate
- **Tenere tutto dentro `PLAN.md`**: troppo denso, poco leggibile come inventario operativo.
- **Aggiornare solo `AGENTS.md`**: utile per contributor/agent, ma insufficiente come audit formale del refactor.

### Impatto / conseguenze
- la Fase 1 parte da una baseline verificata e non da assunzioni storiche;
- le differenze tra documentazione legacy e runtime attuale diventano esplicite;
- backlog, cleanup boundary e priorità tecniche sono più facili da verificare.

### Trigger di revisione o rollback
- se i documenti baseline smettono di essere mantenuti allineati durante le fasi successive.

---

## D-11 — Cleanup boundary: nessuna rimozione upfront dei file mixed-status

**Data:** 2026-04-22  
**Fase:** 0  
**Stato:** implemented

### Contesto
L’audit ha confermato orphan chiari (`BirthDateWizard`, `useBirthWizard`, `MockCard`, `SubTimeline`, `scaleHint`), ma ha anche identificato aree mixed-status che sembravano candidate al pruning e invece restano collegate al runtime o al type system: `src/components/unused/constants.ts`, `wizard.css`, `timeline.css`, `components.css`, `PreferencesContext.scaleMode`.

### Decisione
Il cleanup di Fase 0 si ferma alla classificazione e alla documentazione.  
Nessun file mixed-status viene rimosso upfront.

Le aree seguenti vengono esplicitamente marcate come **safe only after replacement**:

- `PreferencesContext.scaleMode` + `pref_scaleMode`;
- `src/components/unused/constants.ts` e relativo type import in `useMilestone.ts`;
- blocchi `birth-wizard__*` in `wizard.css`;
- blocchi `.timeline__subtimeline*` e tipi correlati;
- qualsiasi stile condiviso in `components.css` che oggi serve anche surface attive.

### Alternative valutate
- **Pulizia aggressiva immediata**: riduce rumore subito, ma alza il rischio di regressioni silenziose.
- **Congelare tutto senza classificare**: evita rischio nel breve, ma non crea un backlog eseguibile.

### Impatto / conseguenze
- il refactor resta incrementale e deployabile;
- la Fase 1 può lavorare sulle primitive UI senza introdurre regressioni di cleanup;
- la Fase 2 può rimuovere il legacy timeline solo dopo replacement misurabile.

### Trigger di revisione o rollback
- se emerge che un’area mixed-status è in realtà completamente orfana anche dopo verifica di replacement e test.

---

## D-12 — Fase 1 slice 1: primitive UI interne prima delle primitive headless

**Data:** 2026-04-22  
**Fase:** 1  
**Stato:** implemented

### Contesto
`DECISIONS.md` ha già accettato l’adozione mirata di Radix UI per dialog, tabs, tooltip, popover e slot. Tuttavia la prima slice concreta della Fase 1 riguarda `Settings` e `BirthDatePicker`, cioè superfici soprattutto composte da layout, field wrappers, banner e azioni, senza overlay complessi o widget interattivi ad alto rischio.

### Decisione
La Fase 1 parte con un layer `src/ui/` **interamente interno** per le primitive non-headless:

- `Button`
- `Banner`
- `Field`
- `FormActions`
- `Panel`
- `Stack`
- `Inline`

L’integrazione di Radix UI viene rinviata alla slice successiva, quando saranno migrate superfici che ne richiedono davvero il valore: `Tabs`, `Dialog`, `Tooltip`, `Popover` e pattern sheet/overlay.

### Alternative valutate
- **Introdurre subito Radix anche per la prima slice**: coerente col piano di lungo periodo, ma non necessaria per `Settings` / DOB flow.
- **Non introdurre ancora `src/ui/` e continuare con classi page-specific**: più economico nell’immediato, ma in conflitto con l’obiettivo della Fase 1.

### Impatto / conseguenze
- la migrazione parte con un perimetro piccolo e a basso rischio;
- il progetto ottiene subito un primo layer `src/ui/` usato in runtime attivo;
- si riduce la dipendenza dalle primitive legacy come `.button` e dai form styles page-driven;
- l’adozione di una libreria headless resta confermata, ma solo quando porta un vantaggio netto.

### Trigger di revisione o rollback
- se le primitive interne iniziano a duplicare responsabilità che una libreria headless risolverebbe meglio già nella slice corrente;
- se la futura migrazione di tabs/dialog/tooltip richiede un redesign incompatibile con le primitive introdotte qui.

---

## D-13 — Fase 1 slice 2: prima primitive headless con Radix Tabs su Timescales

**Data:** 2026-04-22  
**Fase:** 1  
**Stato:** implemented

### Contesto
Dopo la slice 1, il layer `src/ui/` esiste già e copre layout, form actions e banner. La slice successiva doveva introdurre la prima primitive interattiva/headless con rischio accessibilità reale ma perimetro contenuto. Tra i tab system attivi, `Timescales` è risultato il target più adatto: top-level tabs persistiti, semantica semplice, minore complessità rispetto ai perspectives tabs di `Milestones`.

### Decisione
La prima adozione concreta di Radix UI in runtime attivo avviene tramite:

- dipendenza `@radix-ui/react-tabs`
- nuova primitive `src/ui/Tabs.tsx`

La primitive viene adottata in:

- `src/pages/Timescales.tsx` per i tab top-level `overview / comparator / explorer`
- `src/components/timescales/GeoCosmicExplorer.tsx` per i sub-tab `geological / cosmic`

### Alternative valutate
- **Migrare prima i perspectives tabs di `Milestones`**: troppo rischio, a causa di lock/unlock, toast e comportamento mobile collassabile.
- **Continuare con tabs custom DOM-only**: non allineato alla strategia headless definita in `D-02`.
- **Migrare solo il tab system top-level di `Timescales`**: più piccolo come scope, ma meno utile come prova di riuso della primitive.

### Impatto / conseguenze
- il progetto ha ora una prima primitive headless/accessibile nel nuovo `src/ui/`;
- `Timescales` smette di dipendere dai vecchi `.tabs/.tab` legacy per il wiring semantico;
- la stessa primitive è già riusata in un secondo contesto attivo (`GeoCosmicExplorer`), riducendo il rischio che `src/ui/` resti un layer parziale.

### Trigger di revisione o rollback
- se emergono regressioni importanti nella persistenza di `timescalesTab`, nella navigazione tastiera o nel focus management dei panel;
- se il costo di coesistenza con il CSS tabs legacy supera i benefici della migrazione incrementale.

---

## D-14 — Fase 1 slice 3: Milestones tabs con stato locked non-disabled e activation mode manuale

**Data:** 2026-04-22  
**Fase:** 1  
**Stato:** implemented

### Contesto
Dopo la migrazione dei tab system di `Timescales`, il caso più complesso rimasto nella Fase 1 era il pannello perspectives di `Milestones`. A differenza di `Timescales`, questi tabs hanno unlock progressivo, copy teaser, hint iniziale, `toastMsg`, persistenza `pref_unlockedPerspectives` e un wrapper mobile collassabile.

### Decisione
I perspectives tabs di `Milestones` migrano anch’essi alla primitive `src/ui/Tabs`, ma con due vincoli espliciti:

1. i tab locked **non** diventano `disabled`;
2. il root tabs usa `activationMode="manual"`.

In pratica:

- i tab locked restano focusabili e cliccabili per preservare la discoverability della UX corrente;
- l’unlock continua ad avvenire solo su attivazione esplicita (click / Enter / Space), non su semplice focus via frecce;
- il toggle mobile del pannello perspectives resta fuori dal sistema tabs.

### Alternative valutate
- **Usare `disabled` sui tab locked**: più semplice tecnicamente, ma rompe la micro-onboarding UX attuale.
- **Tenere markup custom solo per `Milestones`**: riduce rischio nel brevissimo termine, ma lascia il caso più delicato fuori dal nuovo layer.
- **Usare activation automatica**: più standard per tabs semplici, ma pericolosa qui perché potrebbe sbloccare/attivare tab solo attraversandoli con la tastiera.

### Impatto / conseguenze
- `Milestones` entra nel nuovo sistema tabs senza perdere la UX progressiva già introdotta;
- la stessa primitive `Tabs` copre ora casi semplici (`Timescales`) e casi con stato custom (`Milestones`);
- il CSS legacy dei tabs può iniziare a essere de-enfatizzato, anche se non è ancora completamente rimovibile.

### Trigger di revisione o rollback
- se emergono regressioni su unlock involontario, persistenza `pref_unlockedPerspectives` o keyboard flow nel pannello perspectives;
- se il caso `Milestones` richiede in futuro una primitive tabs specializzata separata dal wrapper generico.

---

## D-15 — Chiusura Fase 1: cleanup sicuro solo sui selettori runtime già sostituiti

**Data:** 2026-04-22  
**Fase:** 1  
**Stato:** implemented

### Contesto
Dopo le slice 1–3 della Fase 1, il nuovo `src/ui/` copriva già i casi principali di form, banner, actions e tabs, ma restavano ancora alcuni consumer runtime legacy (`Landing`, banner DOB-gated di `Milestones`, `ErrorBoundary`) e diversi selettori CSS storici ormai sostituiti dal nuovo layer.

### Decisione
La slice 4 chiude la Fase 1 con due passi coordinati:

1. migrare gli ultimi consumer runtime ad alta leva a `src/ui`;
2. rimuovere **solo** i selettori legacy senza consumer runtime verificato.

Cleanup considerato sicuro in questa chiusura:

- selettori `.tabs/.tab*` legacy in `components.css`
- selettori `.status-banner*` legacy in `components.css`
- bridge locali ormai inutili verso `.button` nelle surface già migrate (`wizard.css`, `personalize.css`)
- varianti tab legacy senza consumer in `timescales.css`

Cleanup esplicitamente rinviato:

- `.button*` base in `components.css` finché esiste codice legacy/orphan in `src/components/unused/`
- `wizard` orphan styles non ancora separati completamente
- `timeline.css`, `scaleMode`, `SubTimeline`, `unused/` e tutto ciò che appartiene alla Fase 2+ o al pruning finale

### Alternative valutate
- **Chiudere la Fase 1 senza cleanup**: più prudente, ma prolunga il doppio sistema oltre il necessario.
- **Rimuovere subito anche `.button*` e altri selector shared**: troppo aggressivo rispetto allo stato mixed/legacy ancora presente nel repository.

### Impatto / conseguenze
- la Fase 1 si chiude con un nuovo layer UI già usato in tutte le surface ad alta frizione previste dal piano;
- il costo cognitivo del legacy tabs/banner si riduce subito;
- il passaggio alla Fase 2 avviene con meno CSS morto “attivo” nel percorso principale.

### Trigger di revisione o rollback
- se emerge un consumer runtime non mappato dei selettori rimossi;
- se il pruning successivo delle aree `unused` o wizard richiede di reintrodurre temporaneamente stili shared eliminati qui.

---

## D-16 — Fase 2 slice 1: timeline-core estratto prima del renderer interattivo completo

**Data:** 2026-04-22  
**Fase:** 2  
**Stato:** implemented

### Contesto
La Fase 2 richiede di portare la timeline 2D verso un’architettura engine + renderer ibrido, ma un full swap immediato del renderer dei marker avrebbe alzato troppo il rischio su gesture, accessibilità, detail panel e parity con `Milestones`.

Serviva una prima slice che:

- introducesse davvero un `timeline-core` runtime;
- toccasse il rendering reale con una surface Canvas/SVG;
- mantenesse stabile il layer DOM attivo per selezione, focus e detail panel.

### Decisione
La Fase 2 parte con una slice foundation composta da due mosse coordinate:

1. estrarre in `src/components/timeline-core/` il model layer puro iniziale (`buildRenderItems`, `buildTimelineScene`, lane ordering, focus/tick scene data);
2. introdurre un primo renderer Canvas runtime limitato alla lane `global`, usato come backdrop scene-based sopra il frame della lane ma sotto il layer DOM interattivo/accessibile già esistente.

`src/components/timeline/buildRenderItems.ts` resta come re-export compatibile per evitare churn sugli import mentre il core si stabilizza.

### Alternative valutate
- **Full swap immediato dei marker globali da DOM a Canvas**: troppo rischio per la prima slice, specialmente su hit-target, accessibilità e regressioni di selezione.
- **Solo estrazione di funzioni pure senza toccare il runtime visuale**: utile ma insufficiente per considerare davvero avviata la Fase 2 renderer-oriented.
- **Canvas su entrambe le lane fin da subito**: più coerente con l’end-state, ma eccessivo come primo step incrementale.

### Impatto / conseguenze
- il runtime della timeline ora dipende da un scene model esplicito e non solo da orchestration locale dentro `Timeline.tsx`;
- esiste già una prima surface Canvas reale nel path attivo della timeline 2D;
- accessibilità e parity funzionale restano protette dal mantenimento temporaneo del layer DOM per marker/gruppi/detail panel;
- la prossima slice può concentrarsi su hit-testing, renderer più denso o de-DOM progressivo senza dover prima rifare l’estrazione del core.

### Trigger di revisione o rollback
- se il canvas backdrop introduce rumore visivo o costi di sync sproporzionati rispetto al valore ottenuto;
- se il scene model estratto non riesce a diventare la base per culling/hit-testing/renderer successivi;
- se emergono regressioni non accettabili in pan/zoom/mobile che richiedono di temporaneamente disattivare la nuova surface ibrida.

---

## D-17 — Fase 2 slice 2: contratto di interaction nel core e lane globale de-DOM con overlay accessibile

**Data:** 2026-04-23  
**Fase:** 2  
**Stato:** implemented

### Contesto
Dopo la slice 1, la timeline aveva già un `timeline-core` runtime e un canvas backdrop per la lane `global`, ma la selezione continuava a dipendere completamente dal markup DOM legacy di marker e group bubbles. La prossima slice naturale richiedeva due passi insieme:

1. rendere esplicito nel core il contratto di selection/hit-target;
2. iniziare una vera de-DOM progressiva almeno sulla lane più densa (`global`) senza rompere detail panel, keyboard semantics o path di pan sull’asse.

### Decisione
La slice 2 introduce un layer `interaction` dentro `src/components/timeline-core/` con:

- `TimelineSelectionPayload`
- `TimelineInteractiveTarget`
- mapping puro `RenderItem -> detailItems / aria metadata / geometry`

Il runtime applica questo contratto **solo** alla lane `global` nella slice corrente:

- il visuale della lane resta su Canvas (`TimelineGlobalLaneCanvas`)
- l’interazione passa a un overlay HTML minimale (`TimelineGlobalLaneOverlay`)
- la lane `personal` resta sul renderer DOM storico

### Alternative valutate
- **Portare subito entrambe le lane al nuovo overlay**: troppo churn in una singola slice e rischio eccessivo di regressioni su marker personali/highlight.
- **Tenere la lane globale ancora DOM ma con payload core**: migliora il model layer ma non produce una vera riduzione di DOM nel runtime attivo.
- **Passare direttamente a hit-testing canvas-native**: interessante come end-state, ma troppo presto senza prima stabilizzare un contratto di target/selection più semplice e testabile.

### Impatto / conseguenze
- il core ora espone target interattivi riusabili e non solo render items visuali;
- la lane `global` riduce il markup attivo a bottoni overlay minimali invece di marker/tooltip DOM completi;
- detail panel e keyboard activation restano funzionanti senza richiedere ancora scene picking canvas-native;
- il progetto introduce anche il primo step concreto della testing strategy di fase avanzata con `@testing-library/react` + `jsdom` per la timeline.

### Trigger di revisione o rollback
- se l’overlay accessibile non copre abbastanza bene discoverability/focus rispetto al markup precedente;
- se il contratto `TimelineInteractiveTarget` risulta troppo debole per supportare la futura migrazione della lane `personal` o l’hit-testing evoluto;
- se la coesistenza tra lane `personal` DOM e lane `global` overlay/canvas introduce divergenze UX troppo visibili.

---

## D-18 — Fase 2 chiusa: overlay model condiviso, hit-testing canvas-native e rimozione del legacy timeline

**Data:** 2026-04-23  
**Fase:** 2  
**Stato:** implemented

### Contesto
Dopo la slice 2, la timeline aveva già il contratto `interaction` nel core e una lane `global` migrata a `canvas + overlay`, ma la lane `personal` restava su markup DOM storico, `scaleMode` continuava a sopravvivere come stato legacy nel runtime timeline e `SubTimeline` restava un ramo orfano ancora presente in repository/CSS.

Per chiudere davvero la Fase 2 serviva un ultimo step coerente che completasse il nuovo model senza lasciare due renderer principali in parallelo.

### Decisione
La Fase 2 viene considerata chiusa con queste mosse coordinate:

- entrambe le lane (`personal` e `global`) passano al renderer condiviso `TimelineSceneCanvas`;
- l’accessibilità/focus/keyboard resta affidata a `TimelineInteractiveOverlay`, ora lane-agnostic;
- la selezione pointer usa `resolveTimelineTargetAtPoint` nel core come hit-testing canvas-native geometry-based, prima del fallback al bare-axis selection;
- `scaleMode` e `pref_scaleMode` vengono rimossi dal runtime timeline / `PreferencesContext`;
- `SubTimeline` e il relativo ramo di tipi/CSS vengono rimossi dal percorso attivo e dal repository.

### Alternative valutate
- **Lasciare la lane `personal` sul DOM path ancora una slice**: più prudente, ma avrebbe lasciato incompleta la convergenza architetturale della Fase 2.
- **Passare direttamente a scene picking per-pixel su canvas**: interessante come step futuro, ma non necessario per chiudere la fase in modo robusto e testabile.
- **Rimuovere solo `scaleMode` / `SubTimeline` senza completare la migrazione della lane `personal`**: cleanup utile ma insufficiente rispetto agli obiettivi dichiarati della fase.

### Impatto / conseguenze
- la baseline attiva della timeline 2D usa ora un solo modello di rendering/interazione per entrambe le lane;
- il costo DOM della timeline cala ulteriormente perché marker e gruppi non sono più componenti runtime attivi della surface 2D;
- il core espone un contratto più credibile per evoluzioni future (culling più spinto, picking più sofisticato, allineamento 2D/3D/Timescales);
- i residui legacy timeline più espliciti (`scaleMode`, `SubTimeline`) escono dal runtime attivo.

### Trigger di revisione o rollback
- se il modello geometry-based di hit-testing si dimostra insufficiente su dataset molto più densi o su affordance future più complesse;
- se l’assenza del vecchio markup marker-by-marker fa emergere regressioni UX/accessibilità non intercettate dalla suite attuale;
- se il cleanup di `EventElement.tsx` richiederà una decisione separata sul perimetro del pruning finale.

---

## D-19 — Fase 3 slice 1: partire dalla Timescales overview con una vertical slice mobile-safe

**Data:** 2026-04-23  
**Fase:** 3  
**Stato:** implemented

### Contesto
La Fase 3 apre il blocco `Timescales + UX improvements`, ma l’area era ancora poco protetta da test component-level e la surface `Overview` soffriva di alcuni limiti pratici: filtri senza summary/reset espliciti, messaggistica loading/error poco guidata e assenza di un path robusto per touch users, che non possono contare sul solo hover tooltip.

Serviva una prima slice verticale abbastanza piccola da essere chiudibile in una sessione, ma abbastanza concreta da inaugurare davvero la Fase 3.

### Decisione
La Fase 3 parte dalla slice `Timescales Overview hardening` con queste mosse coordinate:

- `src/pages/Timescales.tsx` introduce una shell overview dedicata con summary live, reset filtri e status messaging più esplicita;
- `src/components/timescales/TimescaleOverview.tsx` aggiunge un detail panel pinned sotto il ruler logaritmico per click/focus/touch, mantenendo il tooltip hover;
- `src/css/timescales.css` aggiunge il layer mobile-first necessario per toolbar overview e detail card;
- `src/tests/timescalesOverview.test.tsx` inaugura la copertura page-level/RTL della surface `Timescales`.

### Alternative valutate
- **Partire da `GeoCosmicExplorer`**: valore alto, ma rischio maggiore su breadcrumb, drilldown e mobile semantics nella prima slice.
- **Partire dal comparator**: utile per accessibilità, ma meno visibile come vertical slice e meno adatto ad aprire il blocco mobile-hardening.
- **Partire subito da helper temporali condivisi**: strategicamente interessante, ma troppo ampia come prima mossa della fase.

### Impatto / conseguenze
- `Timescales` entra nella fase di hardening con una prima surface realmente migliorata e verificata;
- la codebase ottiene il primo test RTL dedicato alla pagina `Timescales`;
- il pattern `hover tooltip + pinned detail fallback` crea una base riutilizzabile per slice successive di `Explorer` e `Comparator`.

### Trigger di revisione o rollback
- se il detail panel pinned si dimostra insufficiente rispetto a future esigenze di inspector/navigation nella overview;
- se l’hardening della sola overview non si traduce in una riduzione percepibile dei problemi mobile sulla pagina `Timescales`;
- se le prossime slice mostrano la necessità di anticipare gli helper temporali condivisi rispetto alla roadmap attuale.

---

## D-20 — Fase 3 slice 2: hardening dell’Explorer prima del Comparator

**Data:** 2026-04-23  
**Fase:** 3  
**Stato:** implemented

### Contesto
Dopo la slice 1, `Timescales` aveva già una overview più robusta, ma `GeoCosmicExplorer` restava la surface più fragile del blocco `Explorer`: breadcrumb poco espliciti, detail flow non ancora ottimizzato per touch/mobile, assenza di back flow chiaro e nessuna copertura RTL dedicata.

Per mantenere la Fase 3 incrementale serviva una seconda slice verticale focalizzata sull’explorer, senza aprire ancora il fronte più ampio di comparator hardening o helper temporali condivisi.

### Decisione
La slice 2 della Fase 3 si concentra su `GeoCosmicExplorer` con queste mosse coordinate:

- introdurre summary di livello, back flow esplicito e breadcrumb con semantica più forte (`aria-current`);
- rendere il detail panel geologico focus-safe e semanticamente collegato ai dettagli toggle delle card (`aria-expanded` / `aria-controls`);
- rendere `useExplorerDrilldown` più prevedibile eliminando selezioni stale quando cambia il livello visibile;
- aggiungere copertura RTL dedicata per loading/error, detail toggle, drilldown/breadcrumb/back flow e switch geological/cosmic.

### Alternative valutate
- **Passare prima al Comparator**: utile per accessibilità/search UX, ma meno critico del flow geologico su mobile e meno allineato al problema di overflow/navigation aperto.
- **Introdurre subito helper temporali condivisi**: strategicamente importante, ma troppo ampio come passo immediatamente successivo alla slice 1.
- **Limitarsi a CSS-only mobile fixes**: più rapido, ma insufficiente senza consolidare stato, semantica e test.

### Impatto / conseguenze
- `GeoCosmicExplorer` diventa più robusto su touch/mobile e più leggibile anche come flow gerarchico;
- la Fase 3 ottiene un secondo blocco di coverage component-level dedicato a `Timescales`;
- il pattern summary/back/detail dell’explorer crea una base più solida per le slice successive del comparator e dell’hardening cross-page.

### Trigger di revisione o rollback
- se il flow geologico richiederà un inspector/navigation model ancora più ricco del panel attuale;
- se le prossime regressioni mostreranno che il comparator andava priorizzato prima dell’explorer;
- se la convergenza con helper temporali condivisi dovrà essere anticipata per evitare ulteriore duplicazione interna a `Timescales`.

---

## D-21 — Fase 3 slice 3: comparator hardening con combobox accessibile interno

**Data:** 2026-04-23  
**Fase:** 3  
**Stato:** implemented

### Contesto
Dopo le slice 1–2, `Timescales` aveva già una overview più robusta e un explorer più coerente, ma il comparator restava il punto più fragile del blocco: `PhenomenaSearch` era un input con dropdown custom privo di semantics complete da combobox, senza keyboard flow affidabile, con stato selezionato/non selezionato poco sincronizzato e senza un messaggio esplicito quando l’altra selezione rendeva indisponibile un fenomeno.

Serviva chiudere la slice 3 migliorando accessibilità, duplicate exclusion e comportamento mobile, ma senza introdurre un nuovo livello di dipendenze proprio per un solo pattern di search.

### Decisione
La slice 3 hardenizza `PhenomenaComparator` e `PhenomenaSearch` **senza aggiungere una nuova libreria combobox/headless**.

La soluzione adottata resta interna al progetto e introduce:

- semantics `combobox` / `listbox` / `option` esplicite;
- keyboard flow completo (`ArrowUp/Down`, `Home/End`, `Enter`, `Escape`);
- sync tra selezione corrente, query visualizzata e filtro debounced;
- helper copy + empty state per chiarire duplicate exclusion e stato della ricerca;
- status live nel comparator e wrapping mobile-first per dropdown e colonna `vs` sotto 480px.

### Alternative valutate
- **Aggiungere una libreria headless dedicata al combobox/autocomplete**: più standardizzata, ma non giustificata dal perimetro ridotto e dal costo di integrare un secondo sottosistema headless oltre a Radix Tabs.
- **Lasciare il search custom quasi invariato e intervenire solo via CSS**: insufficiente per risolvere tastiera, focus flow e duplicate messaging.
- **Sostituire il comparator con due select statiche**: più semplice, ma peggiora discoverability e scala peggio sul dataset dei fenomeni.

### Impatto / conseguenze
- il comparator ora ha un flow coerente per mouse, tastiera e screen reader senza nuove dipendenze runtime;
- l’esclusione dei duplicati è esplicita sia nel filtro dei risultati sia nella messaggistica helper del picker opposto;
- la suite RTL di `Timescales` cresce con copertura dedicata per keyboard selection, empty state e ratio panel del comparator;
- la possibilità di introdurre in futuro una primitive headless dedicata resta aperta, ma non è più necessaria per chiudere la slice 3.

### Trigger di revisione o rollback
- se altri punti della codebase richiederanno lo stesso pattern e il mantenimento del combobox custom inizierà a duplicare troppo comportamento;
- se il controllo interno mostrerà limiti significativi su screen reader specifici o su future feature come async search / multi-select;
- se il cleanup finale di `Timescales` renderà più conveniente convergere verso una primitive headless condivisa anziché mantenere questo implementation detail locale.

---

## D-22 — Fase 3 slice 4: mobile hardening shared-first sul DOB flow e sui controlli densi

**Data:** 2026-04-23  
**Fase:** 3  
**Stato:** implemented

### Contesto
Dopo le slice 1–3, `Timescales` era già stata hardenizzata, ma la roadmap di Fase 3 lasciava ancora aperta la consistenza mobile cross-page delle surface condivise più sensibili: `Settings`, `BirthDatePicker`, i guardrail di uscita quando manca la DOB e alcuni controlli densi come toolbar/toggle/filter chip.

In più, il date input del picker usava un `max` basato su `toISOString()`, che può divergere dal giorno locale vicino alla mezzanotte e creare incoerenze pratiche proprio sui device mobili.

### Decisione
La slice 4 chiude il mobile hardening shared-first senza introdurre nuove librerie e con un perimetro mirato:

- `BirthDatePicker` usa un limite data locale, espone un summary persistito condiviso e diventa la fonte coerente del feedback DOB su `Landing` e `Settings`;
- il brand link del `Navbar` rispetta lo stesso `onNavigateAttempt` già usato dai link di menu, così il guardrail DOB di `Settings` vale su tutto il navbar;
- `Settings` aggiunge input mode e copy di supporto per migliorare tastiera mobile e leggibilità dei blocchi più densi;
- i CSS shared (`ui.css`, `personalize.css`, `timeline.css`, `components.css`) alzano leggermente touch targets e wrapping senza ridisegnare le primitive.

### Alternative valutate
- **Introdurre una nuova libreria form/mobile-specific**: non giustificata per una slice di hardening, dato che il layer `src/ui/` copre già il grosso della superficie.
- **Rifare completamente il DOB flow con un pattern wizard/sheet**: troppo ampio rispetto all’obiettivo della slice e non necessario per chiudere la consistenza mobile.
- **Limitarsi a fix CSS locali**: insufficiente, perché non avrebbe risolto il guardrail cross-page del navbar né il bug del `max` data locale.

### Impatto / conseguenze
- `Landing` e `Settings` ora condividono non solo il controllo DOB ma anche il suo feedback persistito;
- i guardrail quando manca la DOB diventano più coerenti e meno aggirabili sul path reale di navigazione;
- la suite RTL ottiene coverage specifica sul path `Settings ↔ BirthDatePicker ↔ Landing`, non solo sulle surface `Timescales`;
- il progetto chiude gran parte del mobile hardening di Fase 3 senza aumentare il numero di dipendenze runtime.

### Trigger di revisione o rollback
- se emergeranno ancora problemi seri di editing DOB su Safari/iOS o su browser Android che richiedano una primitive date/time diversa;
- se il summary condiviso del picker dovesse risultare troppo verboso o ridondante sulle surface future;
- se i controlli densi timeline/age-table richiederanno un redesign strutturale invece del solo hardening di layout/touch target.

---

## D-23 — Fase 3 slice 5: helper temporali condivisi limitati alla scala assoluta, non alla selection

**Data:** 2026-04-23  
**Fase:** 3  
**Stato:** implemented

### Contesto
Dopo le slice 1–4, la duplicazione reale e a basso rischio in `Timescales` era concentrata soprattutto nel mapping absolute-log e in alcuni formatter minimi di scala:

- `TimescaleOverview.tsx` duplicava il posizionamento logaritmico verticale e il fallback delle tick label esponenziali;
- `PhenomenaComparator.tsx` duplicava il calcolo percentuale delle barre sull’intera scala assoluta;
- `GeoCosmicExplorer.tsx` duplicava una variante quasi identica dello stesso mapping, ma con range/offset diversi per la scala cosmica.

Allo stesso tempo, la selection della timeline (`selectionKey`, `detailItems`, gruppi, hover/focus/pan, toggle semantics) restava su un contratto diverso e più delicato. Unificarla nella stessa slice avrebbe alzato il rischio senza un valore immediato paragonabile.

### Decisione
La slice 5 introduce un nuovo helper puro dedicato in `src/utils/temporalScale.ts`, separato da `scaleTransform.ts`, e limita la convergenza a:

- `absoluteLogRatio`
- `absoluteLogPercent`
- `roundedLogExponent`
- `formatLogExponentLabel`

I consumer migrati subito sono solo quelli con shape davvero simile:

- `src/components/timescales/TimescaleOverview.tsx`
- `src/components/timescales/PhenomenaComparator.tsx`
- `src/components/timescales/GeoCosmicExplorer.tsx`

Restano fuori scope in questa decisione:

- `Timeline.tsx` (`handleSingleSelect`, `handleGroupSelect`)
- `timeline-core/interaction.ts` e `TimelineSelectionPayload`
- una convergenza forzata del dual-slot model del comparator verso il selection contract della timeline
- helper geologici lineari come `EraCard.linearBarPct`

### Alternative valutate
- **Option A — helper math/scale soltanto ora**: scelta adottata, perché colpisce duplicazioni concrete e mantiene basso il rischio.
- **Option B — includere già duration helpers geologici**: utile ma secondario, rinviato per non mescolare scala assoluta logaritmica e durata relativa lineare nella stessa estrazione.
- **Option C — tentare unification completa della selection**: esclusa in questa slice perché il contratto runtime della timeline è più ricco e ancora troppo diverso.

### Impatto / conseguenze
- il math absolute-log di `Timescales` ora converge su helper condivisi e testabili senza trascinare dentro la logica di viewport/date della timeline;
- il naming desiderato per future convergenze (`selectionKey`, toggle semantics, stale-selection cleanup) viene chiarito nei documenti, ma il runtime non cambia contratto prematuramente;
- la copertura cresce con una nuova suite pura (`src/tests/temporalScale.test.ts`) e con regressioni RTL mirate su overview/comparator/explorer.

### Trigger di revisione o rollback
- se i futuri consumer dimostrano che `temporalScale.ts` sta assorbendo responsabilità di viewport/date math che dovrebbero restare in `scaleTransform.ts`;
- se emergono nuovi casi di duplicazione lineare/geologica sufficienti da giustificare una seconda estrazione distinta;
- se una futura convergenza della selection richiederà un ADR separato perché il contratto timeline non è più abbastanza diverso da quello di `Timescales`.

---

## D-24 — Fase 4 slice 1: adapter puro per la scena 3D prima di selection/focus sync

**Data:** 2026-04-23  
**Fase:** 4  
**Stato:** implemented

### Contesto
Con la Fase 3 chiusa alla slice 5, non risultano altre slice `Timescales + UX improvements` ancora pianificate. Il passo successivo naturale è quindi l’avvio della Fase 4, ma serviva una prima slice a basso rischio per il 3D.

Il problema più concreto era che `src/components/3d/Timeline3D.tsx` manteneva ancora in locale il proprio math di scena principale:

- proiezione temporale lungo l’asse X;
- ordine/label delle lane;
- clamp del focus;
- generazione + thinning dei tick;
- placement dei marker sopra/sotto la rail.

Questo rendeva il 3D ancora troppo “special case”, pur usando già `TimelineEvent` condivisi con il 2D.

### Decisione
La slice 1 della Fase 4 estrae un adapter puro `buildTimeline3DScene` dentro `src/components/timeline-core/` e limita la convergenza a:

- lane order / lane labels condivisi;
- focus clamping del scene model 3D;
- tick generation + thinning;
- marker projection (`x`, `axisY`, `y`) per il renderer R3F.

`Timeline3D.tsx` viene ridotto a renderer della scena costruita dal nuovo adapter.

Restano deliberatamente fuori scope:

- `selectionKey` condiviso tra 2D e 3D;
- hover/focus/detail model comune con `timeline-core/interaction.ts`;
- cambiamenti ai quality profiles o al lazy wrapper `Timeline3DWrapper.tsx`.

### Alternative valutate
- **Partire da focus/selection sync 2D↔3D**: troppo fragile per una slice iniziale del 3D, perché il contract di interazione del 2D è più ricco e ancora specifico.
- **Lasciare tutto in `Timeline3D.tsx` e aggiornare solo i documenti**: insufficiente, perché non riduce il debito architetturale reale del 3D.
- **Spostare subito tutto il 3D in un nuovo stack/engine**: esplicitamente fuori piano e non giustificato.

### Impatto / conseguenze
- il 3D inizia a consumare un vero model layer puro invece di duplicare il math di scena nel renderer;
- la suite ottiene `src/tests/buildTimeline3DScene.test.ts` come guardrail dedicato al kickoff della Fase 4;
- l’allineamento con il 2D cresce senza forzare ancora un contratto condiviso di selection o inspector.

### Trigger di revisione o rollback
- se il prossimo step del 3D richiederà un adapter ancora più esplicito per grouping/culling o un location diversa da `timeline-core/`;
- se emergerà che il renderer 3D deve divergere intenzionalmente dal tick/lane contract comune per motivi UX/performance;
- se una futura sincronizzazione 2D↔3D di selection/focus richiederà un ADR dedicato perché il contract `interaction` attuale resta troppo 2D-specifico.

---

## D-25 — Fase 4 slice 2: policy runtime 3D condivisa prima di focus/selection convergence

**Data:** 2026-04-23  
**Fase:** 4  
**Stato:** implemented

### Contesto
Dopo la slice 1, il math della scena 3D era già stato estratto nel `timeline-core`, ma il runtime contract del 3D restava ancora frammentato tra file diversi:

- `Timeline3DWrapper.tsx` decideva inline quality profile e fallback WebGL;
- `Timeline3D.tsx` manteneva inline i budget di rendering (`camera`, `dpr`, `stars`, `gl`, `performance`, hint copy);
- `Milestones.tsx` duplicava copy/disabled/title del toggle 3D sperimentale.

Questo manteneva il 3D come sistema ancora troppo “page + renderer specific” invece che come runtime con policy esplicita e testabile.

### Decisione
La slice 2 introduce `src/components/3d/runtimePolicy.ts` come modulo puro dedicato alla policy runtime del 3D e centralizza:

- `resolveTimeline3DQualityProfile`
- `resolveTimeline3DAvailability`
- `resolveTimeline3DToggleState`
- `getTimeline3DProfileConfig`

Il wiring attivo viene riallineato così:

- `Timeline3DWrapper.tsx` usa availability + quality-profile resolution condivisi;
- `Timeline3D.tsx` consuma la profile config per budget, hint e camera/runtime setup;
- `Milestones.tsx` usa il toggle-state condiviso per copy e gating del bottone 3D.

### Alternative valutate
- **Passare direttamente a focus/selection sync 2D↔3D**: ancora troppo presto, perché il contract `interaction` del 2D resta più ricco e specifico.
- **Lasciare la policy distribuita e coprire solo con test i file esistenti**: riduce il rischio nel brevissimo termine, ma non migliora davvero la leggibilità architetturale del runtime 3D.
- **Spostare subito anche la policy 3D dentro `timeline-core/`**: non scelto ora, perché la slice resta specifica del runtime 3D e non ha ancora consumer non-R3F abbastanza forti da giustificare il move.

### Impatto / conseguenze
- il 3D ha ora un boundary più chiaro tra scene math (`timeline-core`) e runtime policy (`components/3d/runtimePolicy.ts`);
- il wrapper, il renderer e la pagina `Milestones` condividono lo stesso contract puro per availability/copy/budgets;
- la suite cresce con `src/tests/timeline3DRuntime.test.ts` e `src/tests/timeline3DWrapper.test.tsx`, aggiungendo copertura sul runtime del 3D senza toccare ancora selection/focus sync.

### Trigger di revisione o rollback
- se emergeranno altri consumer 3D abbastanza generici da rendere `runtimePolicy.ts` un candidato migliore per `timeline-core/` o un adapter layer dedicato;
- se la prossima slice richiederà una state machine/runtime controller più ricca del semplice toggle `show3D` in `PreferencesContext`;
- se la futura convergenza 2D↔3D di focus/selection dimostrerà che parte della policy qui estratta deve essere rifusa in un contract cross-runtime più ampio.

---

## Note operative finali

- Nuove decisioni devono essere aggiunte in coda con numerazione incrementale.
- Se una decisione viene superata, non va cancellata: va marcata come `superseded` con riferimento alla decisione nuova.
- Ogni introduzione di libreria o deprecazione significativa deve comparire qui prima di considerarsi “chiusa”.

---

*Questo file è il riferimento vincolante per le scelte architetturali di Refactor 4.*

