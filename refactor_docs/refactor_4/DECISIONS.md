# DECISIONS — Refactor 4: UI Platform Stabilization & Timeline Systems

**Data di apertura:** 2026-04-22  
**Stato:** 🟡 In corso

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

## Note operative finali

- Nuove decisioni devono essere aggiunte in coda con numerazione incrementale.
- Se una decisione viene superata, non va cancellata: va marcata come `superseded` con riferimento alla decisione nuova.
- Ogni introduzione di libreria o deprecazione significativa deve comparire qui prima di considerarsi “chiusa”.

---

*Questo file è il riferimento vincolante per le scelte architetturali di Refactor 4.*

