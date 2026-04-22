# DECISIONS — Refactor 4: UI Platform Stabilization & Timeline Systems

**Data di apertura:** 2026-04-22  
**Stato:** 🟡 In corso — Fase 0 completata

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

## Note operative finali

- Nuove decisioni devono essere aggiunte in coda con numerazione incrementale.
- Se una decisione viene superata, non va cancellata: va marcata come `superseded` con riferimento alla decisione nuova.
- Ogni introduzione di libreria o deprecazione significativa deve comparire qui prima di considerarsi “chiusa”.

---

*Questo file è il riferimento vincolante per le scelte architetturali di Refactor 4.*

