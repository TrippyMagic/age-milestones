# Decisioni di Refactoring — Fase A
**Data di completamento:** 2026-03-15  
**Fase:** A — Fondamenta: Token CSS e Mobile Reset

---

## A-01 — Struttura dei token CSS in `:root`

**Decisione:** Aggiunti token di spacing (`--space-*`), tipografia (`--text-*`), bordi (`--border-subtle / --border-accent`), ombre (`--shadow-card / --shadow-popup`) e raggi (`--radius-sm/md/lg/xl`) direttamente in `:root` di `index.css`.

**Motivazione:** I valori `font-size`, `padding`, `border-radius` e `box-shadow` erano hardcoded e inconsistenti in 8 file CSS con 20+ variazioni. I token centralizzano i valori e garantiscono uniformità visiva nelle fasi successive.

**Alternative scartate:**
- **CSS Modules / Tailwind**: scartati per coerenza con la scelta architetturale già documentata (CSS plain BEM).
- **SCSS variables**: richiederebbe aggiungere un build step non necessario.

**Impatto:** I token sono definiti ma non ancora sostituiti nei singoli file CSS — la sostituzione avverrà progressivamente nelle Fasi B–F via search-and-replace mirato. L'impatto immediato è zero regressioni.

---

## A-02 — Classe `.card-base` e strategia di ereditarietà

**Decisione:** `.card-base` è definita come classe CSS standalone usabile direttamente via `className`. Per le classi esistenti (`.perspective-card`, `.section-card`, `.ts-era-card`, `.birth-wizard__panel`), la condivisione avviene tramite **multi-selector** all'inizio di ogni sezione CSS rilevante.

**Motivazione:** In CSS plain non esiste ereditarietà tra classi. Le opzioni pratiche sono: (a) multi-selector, (b) aggiungere `card-base` nel JSX. Il multi-selector non richiede modifiche ai TSX e applica il refactoring interamente a livello CSS.

**Trade-off accettato:** La definizione `.card-base` nel multi-selector di `components.css` viene replicata parzialmente nei file `timescales.css` e `wizard.css` — accettabile perché l'obiettivo è ridurre le varianti, non azzerare ogni ridondanza in questa fase.

**Classi incluse:**
| Classe | File | Proprietà condivise | Differenze |
|---|---|---|---|
| `.perspective-card` | components.css | background, border, shadow, backdrop | border-radius: 32px (overriden) |
| `.section-card` | components.css | background, border, shadow, backdrop, radius | ✅ nessuna differenza — eredita tutto |
| `.ts-era-card` | timescales.css | background | border: 2px (vs 1px), no backdrop-filter (intentional per densità grid) |
| `.birth-wizard__panel` | wizard.css | border, backdrop, shadow | background: gradient (non rgba flat), border-radius: 32px |

**`.card` esclusa:** La classe `.card` usa `background: #1d3252` (colore solido) e nessun `backdrop-filter` — appartiene a un pattern visivo diverso da quello glassmorphism. Esclusa deliberatamente dal multi-selector.

---

## A-03 — Strategia di conversione mobile-first

**Decisione:** Adottato approccio **mobile-first** (stili base = viewport più piccolo, `@media (min-width: X)` per desktop) in tutti i file CSS tranne `navbar.css`.

**Motivazione:** L'approccio desktop-first con `max-width` generava regole duplicate e un comportamento imprevedibile su viewport intermedi (es. 560px tra due breakpoint). La conversione mobile-first riduce le regole di override e chiarisce l'intenzione.

**Breakpoint standardizzati a 3 tier:**
| Tier | Valore | Contesto |
|---|---|---|
| Compact | `480px` | Smartphone in portrait |
| Tablet | `720px` | Tablet e smartphone landscape |
| Desktop | `1024px` | (usato solo dove necessario, nessuna regola attuale) |

**Breakpoint sostituiti:**
| Valore precedente | Nuovo valore | File |
|---|---|---|
| `max-width: 768px` | `min-width: 720px` (inverted) | index.css |
| `max-width: 640px` | `max-width: 720px` | navbar.css |
| `max-width: 420px` | `max-width: 480px` | navbar.css |
| `max-width: 900px` | `min-width: 720px` (inverted) | scale-overlay.css |
| `min-width: 560px` | `min-width: 480px` | wizard.css |
| `max-width: 560px` | convertito a `min-width: 480px` | wizard.css |

**Eccezione — `navbar.css`:** La navbar ha una logica responsive complessa che sarà completamente ridisegnata nella **Fase B** (hamburger menu, rimozione del pulsante "Edit birth date" inline). Convertire la navbar a mobile-first adesso avrebbe richiesto un redesign funzionale fuori dallo scope della Fase A. Scelta: solo standardizzazione dei valori (640→720, 420→480).

---

## A-04 — `touch-action` sulla timeline

**Decisione:**
- `.timeline` (root wrapper): `touch-action: pan-y` — permette lo scroll verticale della pagina sul wrapper esterno.
- `.timeline__axis` (asse interattivo): `touch-action: none` — blocca qualsiasi azione nativa browser sull'asse; pan e pinch sono gestiti interamente via PointerEvent/TouchEvent in JS (Fase D).
- `.timeline-3d` (container canvas 3D): `touch-action: none` — OrbitControls di Three.js richiede gestione esclusiva degli eventi touch.

**Motivazione:** Senza `touch-action: none` sull'asse, il browser intercetta gli eventi touch e li converte in scroll di pagina o in zoom nativo, impedendo il pan e il futuro pinch-to-zoom custom. Con `touch-action: pan-y` sul wrapper, si consente comunque lo scroll verticale su aree non interattive della timeline (fuori dall'asse).

**Impatto:** Nessuna regressione su desktop. Su mobile, prima di implementare il pinch-to-zoom (Fase D), l'utente potrà ancora fare pan con un dito sull'asse (già supportato via PointerEvent).

---

## A-05 — `prefers-reduced-motion`

**Decisione:** La regola `@media (prefers-reduced-motion: reduce)` è aggiunta in **`index.css`** (entry point globale) e non in ogni singolo file.

**Motivazione:** Centralizzare la regola in un unico punto garantisce che non venga dimenticata quando si aggiungono nuovi file CSS. Le proprietà disabilitate sono:
- `.timeline__axis--transitioning *` → `transition: none !important` (switch scala lin/log)
- `.count-scene__dot` → `animation: none !important; opacity: 1` (dot-grid pop)
- `.ts-comparator__bar-fill` → `transition: none !important` (barre comparatore)

**Note:** `Landing.css` usa già il pattern inverso (`@media (prefers-reduced-motion: no-preference)`) per le sue animazioni — questo è il pattern corretto (opt-in per le animazioni). Il nostro `reduce` pattern è complementare (opt-out per le transizioni già definite come default).

**`!important` giustificato:** Necessario per garantire che la preferenza dell'utente prevalga su qualsiasi specificità locale, inclusi eventuali inline style.

---

## A-06 — Gestione dei duplicati dopo la conversione mobile-first in `timeline.css`

**Decisione:** Dopo la conversione mobile-first, `timeline.css` contiene due definizioni di `.timeline__value-primary` e `.timeline__ctrl-scroll-hint`. Mantenute entrambe sfruttando il **cascade CSS** intenzionalmente.

**Motivazione:** La definizione originale di `.timeline__value-primary` (nella sezione "Value display") conserva `font-weight` e `color`. La definizione nella sezione responsive (in fondo al file) sovrascrive solo `font-size` come valore mobile base. Il `@media (min-width: 720px)` nella stessa sezione ripristina il `font-size` desktop. Il cascade garantisce il comportamento corretto senza duplicare le proprietà non responsive.

**Alternativa scartata:** Rimuovere la definizione originale e spostare tutto nella sezione responsive — aumenterebbe le righe di codice senza benefici, rendendo la sezione meno leggibile.

---

## A-07 — `ts-era-card` e design intenzionalmente diverso

**Decisione:** `.ts-era-card` condivide solo `background` con `.card-base` (tramite multi-selector). Non condivide `border` (usa 2px invece di 1px), `backdrop-filter` (assente per ragioni di performance su griglie dense) e `box-shadow` (assente in default, aggiunto solo su hover).

**Motivazione:** La card dell'era geologica è usata in una griglia `repeat(auto-fill, minmax(240px, 1fr))` che può contenere 20+ elementi visibili. Aggiungere `backdrop-filter: blur(18px)` a ogni card degraderebbe le performance di rendering su dispositivi mobile con GPU limitata. Il design a 2px border è anche un elemento differenziante intenzionale (evidenzia il colore dell'era tramite `--era-color`).

---

## A-08 — `wizard.css` e ordine dei blocchi responsive

**Decisione:** La conversione mobile-first del wizard ha ristrutturato le definizioni in modo che:
- `.birth-wizard__grid`: `grid-template-columns: 1fr` come base + `@media (min-width: 720px)` per 2-colonne
- `.birth-wizard__panel`: `padding: 24px 20px` come base + `@media (min-width: 480px)` per padding ampio
- `.birth-wizard__summary-list`: `grid-template-columns: 1fr` come base + `@media (min-width: 480px)` per 2-colonne
- `.birth-wizard__actions button`: `min-width: 130px` come base + `@media (min-width: 480px)` per 150px

**Nota:** Il redesign completo del wizard (quick-entry, summary cliccabile, validazione data futura) è nella **Fase C**, fuori dallo scope della Fase A.

---

## Riepilogo file modificati

| File | Tipo modifica |
|---|---|
| `src/css/index.css` | Aggiunto `:root` tokens; body/root mobile-first; rimosso `@media (max-width: 768px)`; aggiunto `@media (min-width: 720px)`; `.page`/`.wrapper` mobile-first; rimosso `@media (max-width: 480px)`; aggiunto `@media (prefers-reduced-motion: reduce)` |
| `src/css/components.css` | Aggiunto `.card-base` multi-selector; puliti `.perspective-card` e `.section-card`; rimosso blocco `@media (max-width: 720/480px)` legacy; conversione mobile-first `.card` e `.perspective-card` |
| `src/css/timeline.css` | Aggiunto `touch-action: none` a `.timeline__axis`; `touch-action: pan-y` a `.timeline`; conversione mobile-first sezione responsive; height 200px come base |
| `src/css/navbar.css` | Standardizzazione valori: 640px→720px, 420px→480px |
| `src/css/scale-overlay.css` | Conversione mobile-first: 1fr come base; `@media (min-width: 720px)` per 2-colonne (ex 900px) |
| `src/css/timescales.css` | Aggiunto `.card-base, .ts-era-card` multi-selector; conversione mobile-first della sezione responsive |
| `src/css/timeline3d.css` | Aggiunto `touch-action: none`; conversione mobile-first; 320px come base height |
| `src/css/wizard.css` | Aggiunto `.card-base, .birth-wizard__panel` multi-selector; conversione mobile-first grid/panel/actions; 560px→480px |
| `refactor_docs/refactor_2/PLAN.md` | Fase A marcata come completata |

---

# Decisioni di Refactoring — Fase B
**Data di completamento:** 2026-03-15  
**Fase:** B — Ottimizzazione Mobile: Navbar, Pagine, AgeTable

---

## B-01 — Strategia navbar mobile: duplicazione JSX con show/hide CSS

**Decisione:** Il pulsante "Edit birth date" è reso disponibile in due posti nel DOM: (1) in `.app-navbar__actions` con la classe `app-navbar__edit` (per desktop), (2) nel dropdown con la classe `app-navbar__edit-dropdown` (per mobile). CSS `display: none` / `display: inline-flex` controlla quale versione è visibile in base al breakpoint 720px.

**Motivazione:** In CSS plain non esiste un meccanismo per spostare elementi DOM tra contenitori basandosi sulla viewport. Le alternative analizzate erano:
- **Portals React**: eccessiva complessità per un bottone.
- **Elemento unico con CSS `position: absolute`**: avrebbe rotto il layout flex della navbar.
- **Duplicazione JSX**: approccio standard in progetti con CSS plain. La duplicazione è minima (un bottone, 6 righe JSX). Entrambe le versioni richiamano la stessa callback `onEditBirthDate`.

**Impatto accessibilità:** Entrambe le versioni sono tabbable/focusable. Su desktop il bottone nel dropdown ha `display: none`, quindi non è raggiungibile da tastiera. Corretto.

---

## B-02 — Pannello perspectives collassabile: `useState` con inizializzazione `window.innerWidth`

**Decisione:** Usato `useState(() => typeof window !== "undefined" ? window.innerWidth >= 720 : true)` per inizializzare il pannello open su desktop e closed su mobile.

**Motivazione:** Le alternative analizzate:
- **`<details>` HTML nativo**: CSS non può controllare l'attributo `open` tramite media query, quindi non è possibile forzarlo aperto su desktop senza JS. Richiederebbe `!important` su regole UA stylesheet — fragile.
- **`useMediaQuery` custom hook**: aggiunge un listener su resize — overkill per questa funzione.
- **SSR default `true`**: sicuro perché l'app non usa SSR (Vite SPA). La check `typeof window !== "undefined"` è precauzionale.

**Trade-off:** Il pannello NON si riaprirà automaticamente se l'utente ridimensiona la finestra da mobile a desktop (la checkbox `perspOpen` rimane `false`). Questo è accettabile per Phase B — un fix con `matchMedia` listener può essere aggiunto in Fase F se necessario.

---

## B-03 — Toggle button visibile solo su mobile

**Decisione:** Il bottone `.perspectives-panel__toggle` è sempre presente nel DOM (non condizionale), ma nascosto su desktop con `@media (min-width: 720px) { display: none }`. Il contenuto della sezione è invece condizionale (`{perspOpen && <section>...</section>}`).

**Motivazione:** Il bottone deve sempre avere il corretto `aria-expanded` per screen reader anche quando è nascosto visivamente su desktop. Tenerlo nel DOM ma nascosto via CSS garantisce che, se uno screen reader ignora `display:none`, l'utente mobile possa comunque navigarlo.

**Alternativa scartata:** Rendere anche il bottone condizionale (`{!isDesktop && ...}`) — richiederebbe un hook `useWindowSize` aggiuntivo.

---

## B-04 — `border-radius` mobile: 20px (`--radius-lg`)

**Decisione:** Su mobile (<720px), sia `.perspective-card` che `.birth-wizard__panel` usano `border-radius: var(--radius-lg)` = 20px. Su desktop, `.perspective-card` ripristina 32px e `.birth-wizard__panel` 32px.

**Motivazione:** I raggi elevati (32px) su mobile consumano spazio visivo prezioso, comprimono il contenuto e sembrano "gonfiati" su viewport stretti. 20px è il valore che garantisce l'aspetto arrotondato senza sprechi. Il token `--radius-lg` corrisponde esattamente al valore usato da `.ts-era-card` e dal container 3D, creando coerenza nel sistema.

---

## B-05 — AgeTable: wrapper con overflow-x invece di table-layout fixed

**Decisione:** La tabella `.age-table` è avvolta in un `<div className="age-table__wrap">` con `overflow-x: auto`. La tabella stessa NON usa `table-layout: fixed`.

**Motivazione:** `table-layout: fixed` richiede larghezze colonne esplicite. Con dati dinamici (numeri con 4-10 cifre + overflow hint button), la larghezza delle celle non è prevedibile. Il `div` wrapper con scroll orizzontale è più robusto e non tronca i valori numerici.

**`white-space: nowrap` su `.age-val`:** Impedisce che i valori (es. "1,234,567,890.12") vadano a capo a metà numero, che è il principale problema visivo. Con il wrapper scroll, questo non causa overflow della viewport ma viene scrollabile.

**`text-overflow: ellipsis`:** Aggiunto come safety net per scenari estremi (max-width: 200px), ma nella pratica il wrapping sarà prevenuto da `white-space: nowrap` + scroll del wrapper.

---

## B-06 — `.timeline__label` clamping: viewport-based `min()` invece della formula `left: clamp(...)`

**Decisione:** Applicato `max-width: min(240px, calc(100vw - var(--space-xl)))` invece della formula `left: clamp(90px, 50%, calc(100% - 90px))` suggerita nel piano.

**Motivazione:** La formula `left: clamp(90px, 50%, calc(100% - 90px))` del piano è valida se `100%` si riferisce alla larghezza dell'`.timeline__axis`. Ma la `.timeline__label` è posizionata relativamente alla `.timeline__event` (un container di 18px), quindi `100%` = 18px — la formula produrrebbe un clamping inutile (`clamp(90px, 9px, -72px)` = 90px sempre).

Applicare un vero clamping edge-aware richiederebbe:
- Conoscere `--axis-width` e `--event-left-px` come CSS variables impostate da JS.
- O usare `position: fixed` per la label (rompe il layout).

Per Phase B, la soluzione CSS più sicura è limitare la `max-width` della label alla viewport, in modo che anche se la label deborda dal'asse, non superi mai la larghezza del dispositivo. Il fix completo basato su posizione JS è previsto in **Fase F**.

**`min-width` ridotto:** Da 180px a 160px per dare più respiro ai tooltip su viewport di 360px.

---

## Riepilogo file modificati (Fase B)

| File | Tipo modifica |
|---|---|
| `src/css/navbar.css` | Rimossi blocchi `max-width: 720px` e `max-width: 480px`; aggiunta `.app-navbar__edit { display: none }` mobile-base; aggiunto `.app-navbar__edit-dropdown`; `@media (min-width: 720px)` ripristina edit inline e menu label |
| `src/components/common/Headers.tsx` | Aggiunto `app-navbar__edit-dropdown` nel dropdown nav; doppio rendering del bottone con CSS show/hide |
| `src/pages/Milestones.tsx` | Aggiunto `perspOpen` state con init `window.innerWidth >= 720`; wrappato `perspective-card` in `.perspectives-panel` con toggle button |
| `src/css/components.css` | Aggiunto `.perspectives-panel` + `.perspectives-panel__toggle`; `border-radius` perspective-card 20px mobile base; aggiunto `.age-table__wrap`; `white-space: nowrap` + `text-overflow: ellipsis` su `.age-val` |
| `src/css/wizard.css` | `birth-wizard__panel` mobile `border-radius: var(--radius-lg)`; `@media (min-width: 720px)` ripristina 32px |
| `src/components/AgeTable.tsx` | Tabella wrappata in `<div className="age-table__wrap">` |
| `src/css/timeline.css` | `.timeline__label` `max-width: min(240px, calc(100vw - var(--space-xl)))`; `min-width` ridotto da 180px a 160px |
| `refactor_docs/refactor_2/PLAN.md` | Fase B marcata come completata |

---

# Decisioni di Refactoring — Fase C
**Data di completamento:** 2026-03-15  
**Fase:** C — Refactor Wizard DOB

---

## C-01 — Quick entry: form separato anziché step aggiuntivo

**Decisione:** La quick entry è implementata come `mode === "quick"` che rimpiazza completamente il form dello step-wizard nella stessa modale, anziché essere uno step "step 0" del flusso esistente.

**Motivazione:** Aggiungere la quick entry come step 0 avrebbe rotto la logica `STEPS.length` e i progress-step indicator. La soluzione a due modalità (`"steps" | "quick"`) è più pulita e non tocca la logica esistente degli step. Il reset di modalità avviene all'apertura del wizard (sempre da `"steps"`), rendendo il flusso prevedibile.

**Stato condiviso:** I due form condividono i valori `year/month/day/hour` (step mode) e `quickDate/quickTime` (quick mode) come state separati. NON si sincronizzano tra loro — una scelta deliberata per evitare complessità, dato che chi usa la quick entry raramente tornerà alla modalità guidata.

**`max={TODAY_STR}` sul `<input type="date">`:** Blocca nativamente la selezione di date future tramite il calendario nativo del browser. Complementa la validazione lato form.

**`color-scheme: dark`:** Aggiunto agli input `type="date"` e `type="time"` per garantire che il date picker nativo (Chrome/Edge/Safari) usi il tema scuro, coerente con l'app.

---

## C-02 — Summary items cliccabili: jump libero a qualsiasi step

**Decisione:** Clicking su un summary item permette di saltare a **qualsiasi step**, inclusi quelli futuri non ancora compilati (non solo quelli già completati).

**Motivazione:** Bloccare la navigazione verso step futuri renderebbe il summary inutile come shortcut. L'utente che clicca su "Day" senza aver compilato mese e anno saprebbe già cosa fare. La validazione a ogni step (`canContinue`) previene ugualmente di procedere senza dati validi.

**Accessibilità:** Gli item cliccabili usano `role="button"`, `tabIndex={0}`, `onKeyDown` (Enter/Space), `title` per tooltip e `:focus-visible` outline. L'`aside` ha già `aria-hidden="true"` nel JSX — il summary è decorativo (le stesse informazioni si possono leggere dal form corrente), quindi non costituisce una perdita di accessibilità.

**L'item "Complete date" è non-cliccabile:** Non corrisponde a nessuno step specifico; è un valore derivato. Discriminato tramite `stepIdx: null` nel summary array.

---

## C-03 — Validazione data futura: blocco + `aria-invalid`

**Decisione:** La validazione futura è **bloccante** (`canContinue = false`) sia per l'anno che per la data di completa. Il messaggio di errore è mostrato solo quando c'è effettivamente un valore invalid (no "touched" flag).

**Motivazione:** L'app calcola milestone dalla data di nascita. Una data futura produrrebbe risultati privi di senso (es. "10,000 days old" in futuro). Bloccare il progresso è la scelta più sicura rispetto a un warning non-bloccante.

**Nessun "touched" flag:** Il piano non richiedeva una UX avanzata con stato "touched". Il feedback appare non appena il valore digitato è invalido. Questo è accettabile perché:
1. L'input ha `min` e `max` che guidano l'utente prima che digiti
2. L'`aria-invalid` è tecnicamente corretto anche senza "touched" (WCAG non richiede il flag)

**`isFutureYear` è ridondante con `isYearValid`?** No: `isYearValid` include `year <= CURRENT_YEAR`, ma mostrare un messaggio specifico "Year cannot be in the future" è più chiaro di "invalid value". Le due validazioni coesistono.

**`isFutureDate` sulla data completa:** Controllo separato dall'anno perché un anno valido (es. 2026) con mese/giorno futuro (es. dicembre) può formare una data futura.

---

## C-04 — Nascondere l'aside su mobile: `display: none` come base CSS

**Decisione:** `.birth-wizard__aside { display: none }` è ora il valore **base** (mobile, < 480px). `@media (min-width: 480px)` lo ripristina a `display: flex`.

**Motivazione:** Il plan diceva "nasconderla del tutto con `display: none`" sotto 480px (ex 560px, rinominato in Fase A). Su schermi molto stretti (320–479px), la sidebar dei progressi + summary occupa tutto lo schermo impilata sotto il form, rendendo il wizard non usabile. Nasconderla non causa perdite di informazioni poiché l'aside è `aria-hidden="true"` (non letta dallo screen reader) e il step indicator è visibile nell'header (`Step X of Y`).

---

## C-05 — `pattern="[0-9]*"` su tutti gli input numerici

**Decisione:** `pattern="[0-9]*"` aggiunto a **year, day e hour** (non solo year come da piano). Mantenuto anche `inputMode="numeric"` già esistente.

**Motivazione:** `inputMode="numeric"` è sufficiente per mostrare la tastiera numerica su Android. Su iOS Safari, `inputMode="numeric"` non ha effetto sugli input `type="number"` — solo `pattern="[0-9]*"` forza la tastiera numerica corretta (senza virgola decimale). Il piano citava solo l'anno, ma day e hour hanno lo stesso problema.

**`type="number"` mantenuto:** Nonostante i problemi noti (`type="number"` può essere tricky su mobile), mantenuto per coerenza con il codice esistente. Una sostituzione con `type="text"` + validazione custom è possibile in una fase successiva.

---

## Riepilogo file modificati (Fase C)

| File | Tipo modifica |
|---|---|
| `src/components/BirthDateWizard.tsx` | Completa riscrittura con `mode` state, quick form, validazione futura, `aria-invalid`, `pattern`, summary cliccabile, `toDateInputValue` helper |
| `src/css/wizard.css` | `.birth-wizard__aside { display: none }` base; `@media (min-width: 480px)` ripristina; aggiunti stili per `.birth-wizard__quick`, `.birth-wizard__mode-toggle`, `.birth-wizard__error`, `.birth-wizard__summary-item--clickable/--active`; `input[aria-invalid="true"]` ring rosso |
| `refactor_docs/refactor_2/PLAN.md` | Fase C marcata come completata |

---

# Decisioni di Refactoring — Fase D
**Data di completamento:** 2026-03-15  
**Fase:** D — Pinch-to-Zoom sulla Timeline

---

## D-01 — Architettura dell'hook: `usePinchZoom` con `isPinchingRef` condiviso

**Decisione:** L'hook `usePinchZoom` non gestisce internamente la coesistenza con il pan. Invece, riceve dall'esterno un `isPinchingRef: MutableRefObject<boolean>` che muta, e un callback `onPinchStart?: () => void` che `Timeline.tsx` fornisce per abbortire il pan attivo.

**Motivazione:** Se l'hook gestisse tutto internamente, avrebbe bisogno di accedere a `panStartRef`, `isPanningRef` e `setIsPanning` — lo stato interno del pan di `Timeline.tsx`. Questo creerebbe un coupling bidirezionale difficile da testare. Separare le responsabilità:
- `usePinchZoom` → gestisce i 2 dita, muta `isPinchingRef`, notifica via `onPinchStart`
- `Timeline.tsx` → gestisce il pan, controlla `isPinchingRef.current` prima di agire

**Alternativa scartata:** Unificare pan e pinch in un unico hook `useGesture` — eccessiva complessità per lo scope attuale. Se in futuro si aggiunge inerzia o velocity-based pan, si può valutare `@use-gesture/react` (documentato nelle Raccomandazioni del piano).

---

## D-02 — Touch events vs. Pointer events per la pinch

**Decisione:** La pinch-to-zoom usa `addEventListener("touchstart/touchmove/touchend/touchcancel", ...)` con `passive: false`, mentre il pan usa `ReactPointerEvent` (onPointerDown/Move/Up nel JSX). I due sistemi coesistono.

**Motivazione:** I PointerEvent gestiscono correttamente il pan singolo dito su tutti i device (mouse, touch, stylus) tramite `setPointerCapture`. Ma per il pinch (2 tocchi simultanei), `PointerEvent` richiederebbe di tracciare due `pointerId` separati e gestire le variazioni di distanza — significativamente più complesso.

`TouchEvent` dà accesso diretto a `e.touches[]` come array sincronizzato, rendendo la logica pinch molto più pulita. Sui browser moderni (Chrome, Safari, Firefox) `TouchEvent` e `PointerEvent` coesistono senza conflitti se gestiti correttamente (la firma `passive: false` garantisce che `preventDefault()` funzioni).

**Sequenza eventi garantita:** `touchstart` → `pointerdown` per lo stesso punto di contatto. Quindi quando il secondo dito tocca: (1) `touchstart(2 dita)` → `isPinchingRef = true`, `panStartRef = null` via callback; (2) `pointerdown(2° dito)` → trova `isPinchingRef.current === true` → ritorna subito. L'ordine è deterministico in tutti i browser moderni.

---

## D-03 — Zoom incrementale vs. assoluto

**Decisione:** Ogni frame `touchmove` calcola il fattore `factor = prevDist / newDist` rispetto alla distanza del frame precedente (**incrementale**), non rispetto alla distanza iniziale del gesto (**assoluto**).

**Motivazione:**
- **Assoluto** (`initDist / newDist`): richiede di conservare `initDist` e `initMidX` dall'inizio del gesto. Se l'utente sposta le dita lateralmente durante la pinch, il punto medio cambia ma `initMidX` è fisso → l'ancoraggio deriva progressivamente.
- **Incrementale** (`prevDist / newDist`): ogni frame usa l'ancoraggio del midpoint attuale. Il risultato è uno zoom che segue naturalmente il punto medio istantaneo tra le dita, anche durante movimenti combinati (pinch + pan).

Lo svantaggio (maggiore sensibilità a micro-jitter del touchscreen) è mitigato dal fatto che `applyZoom` usa `clamp(newSpan, MIN_SPAN_MS, MAX_SPAN_MS)` per limitare il range.

---

## D-04 — `isPinchingRef.current` nei `useCallback` senza aggiunta alle deps

**Decisione:** `isPinchingRef` (ref stabile) è letto in `handleAxisPointerDown` e `handleAxisPointerMove` senza essere aggiunto alle dipendenze dei `useCallback`.

**Motivazione:** I React ref (`useRef`) restituiscono lo stesso oggetto per tutta la vita del componente — il valore cambia ma l'oggetto rimane identico. Aggiungere un ref alle deps di `useCallback` non causerebbe re-creazione della funzione (le dipendenze sono confrontate con `Object.is` sull'oggetto ref, non su `.current`). ESLint `exhaustive-deps` non segnala le variabili `...Ref.current` come mancanti nelle deps (le segnala solo se `.current` viene letto fuori dall'effect — ma qui è letto durante l'evento, non alla creazione del callback).

---

## D-05 — Hint "Pinch to zoom": una sola volta, al primo touch

**Decisione:** L'hint appare una sola volta, al **primo touch** (non al primo pinch), e dura 3 secondi. Dopo che è stato mostrato, `hintShownRef.current` rimane `true` per tutta la vita del componente — nessun reset.

**Motivazione:** Mostrare l'hint al primo touch (anche a un dito) è più efficace di aspettare un pinch: se l'utente fa tap su un evento prima di provare la pinch, vedrà comunque la guida. L'hint non si ripete per non infastidire gli utenti esperti. Il timer di 3s è hardcoded perché coincide con la durata dell'animazione CSS `pinch-hint-fade`.

**`prefers-reduced-motion`:** L'animazione viene disabilitata in `index.css` (`animation: none !important; opacity: 1`). In questo caso l'hint rimane visibile senza animazione finché non viene rimosso dal DOM (dopo 3s). Questo è comportamento corretto.

---

## D-06 — Struttura del file hook e `useEffect` con dipendenze vuote

**Decisione:** `usePinchZoom` usa un `useEffect` con deps array **vuoto** (`[]`), aggiungendo un commento `// eslint-disable-next-line react-hooks/exhaustive-deps` motivato.

**Motivazione:** Tutti i valori acceduti nell'effect (`axisNodeRef`, `viewportRef`, `scaleModeRef`, `setViewport`, `isPinchingRef`) sono ref o il setter stabile di `useState`. Nessuno di questi cambierà identità durante la vita del componente. Re-registrare i listener ad ogni render sarebbe costoso e inutile. Il pattern è identico a quello già usato nel `Ctrl+wheel` handler in `Timeline.tsx` (commentato con `// viewportRef is a stable ref — no re-registration needed`).

---

## Riepilogo file modificati (Fase D)

| File | Tipo modifica |
|---|---|
| `src/hooks/usePinchZoom.ts` | **Nuovo file** — hook con touchstart/touchmove/touchend/touchcancel handlers, zoom incrementale, hint management |
| `src/components/timeline/Timeline.tsx` | Import `usePinchZoom`; aggiunto `isPinchingRef`; chiamata hook con `onPinchStart` callback; guard `isPinchingRef.current` in `handleAxisPointerDown` e `handleAxisPointerMove`; rendering `showPinchHint` nell'asse |
| `src/css/timeline.css` | Aggiunto `.timeline__pinch-hint` + `@keyframes pinch-hint-fade` |
| `src/css/index.css` | Estesa regola `prefers-reduced-motion: reduce` con `.timeline__pinch-hint { animation: none; opacity: 1 }` |
| `refactor_docs/refactor_2/PLAN.md` | Fase D marcata come completata |

---

# Decisioni di Refactoring — Fase E
**Data di completamento:** 2026-03-15  
**Fase:** E — Redesign Sub-Timeline

---

## E-01 — Architettura animazione: `AnimatePresence` in Timeline.tsx + `motion.div` in SubTimeline.tsx

**Decisione:** `<AnimatePresence>` è in `Timeline.tsx`, wrappa il rendering condizionale di `<SubTimeline>`. Il root element di `SubTimeline` è un `<motion.div>` con le props `initial/animate/exit/transition`. `key={activeGroup.id}` è obbligatorio sul `SubTimeline` per garantire il ciclo mount/unmount corretto (senza key, React potrebbe riusare il nodo DOM e l'`exit` non sarebbe mai triggerato).

**Motivazione:** `AnimatePresence` deve avere la `motion.div` (o il componente che la contiene) come **discendente diretto** nel React tree affinché la rimozione condizionale venga intercettata. Il pattern è identico a quello già usato per lo `ScaleOverlay` (`AnimatePresence` nel parent + `motion.div` nel child).

**Desktop vs. mobile:** Due set di props distinti, selezionati da `isMobile` state:
- Desktop: `scaleY: 0.8 → 1`, `transformOrigin: "top center"` — la sub-timeline si "apre" dall'alto verso il basso.
- Mobile: `y: "100%" → 0` — la sub-timeline scivola su dal basso (coerente con il bottom-sheet).

**Curva easing:** `[0.4, 0, 0.2, 1]` per desktop (Material Design standard), `[0.32, 0.72, 0, 1]` per mobile (iOS spring-like). Entrambe rispettano `prefers-reduced-motion` tramite Framer Motion che disabilita le animazioni quando il flag è attivo.

---

## E-02 — Pulsante ✕: posizionamento assoluto nell'axis-wrapper

**Decisione:** Il pulsante `.timeline__subtimeline-close` è posizionato `absolute; top: 10px; right: 10px; z-index: 10` all'interno di `.timeline__subtimeline-axis-wrapper`, non nell'outer `motion.div`.

**Motivazione:** Posizionarlo nell'outer div (`.timeline__subtimeline`) avrebbe richiesto `position: relative` sull'outer — già implicito su desktop ma non su mobile (dove è `position: fixed`). Nell'`axis-wrapper` (sempre `position: relative/absolute` a seconda del breakpoint), il pulsante è sempre visibile nell'angolo giusto sia su mobile che su desktop.

**Coesistenza con `useOutsideClick`:** L'`useOutsideClick` è su `containerRef` (l'`axis-wrapper`). Cliccando il pulsante ✕ si chiama `onClose` direttamente, prima che `useOutsideClick` possa intercettare il click — l'ordine degli eventi garantisce una chiusura pulita senza doppio trigger.

**`z-index: 10`:** Identico ai `.timeline__controls` (pulsanti zoom) — corretta parità semantica tra i due tipi di controllo UI sovrapposti alla timeline.

---

## E-03 — z-index della sub-timeline: 6 su desktop, 50 su mobile

**Decisione:**
- Desktop (inline, `position: relative`): `z-index: 6` — sopra label (z:5), sotto wizard (z:20).
- Mobile (bottom-sheet, `position: fixed`): `z-index: 50` — sopra qualsiasi contenuto normale, sotto navbar (z:1800) e wizard (z:20+).

**Motivazione:** Su desktop il z-index: 6 opera nel contesto del normale stacking flow. Su mobile, `position: fixed` crea un nuovo stacking context globale: z:6 sarebbe insufficiente (finirebbe sotto elementi con z:10 o z:100 nella pagina). z:50 è un valore sicuro che non interferisce con wizard e navbar.

**Nota:** Il piano originale indicava z:6 come unico valore. La distinzione per breakpoint è una decisione di implementazione necessaria, non un cambiamento dell'intenzione.

---

## E-04 — `responsiveMinWidth`: formula `Math.min(320, axisWidth * 0.9)`

**Decisione:** Il calcolo `responsiveMinWidth = Math.min(SUB_TIMELINE_MIN_WIDTH, axisWidth * 0.9)` sostituisce `SUB_TIMELINE_MIN_WIDTH` (costante 320px) nel calcolo di `desiredWidth`.

**Motivazione:** Su viewport ≤ 355px, `axisWidth * 0.9 ≈ 288px` → il `Math.min` sceglie 288px, evitando che la sub-timeline sia più larga dell'asse e causi overflow orizzontale della pagina. Su viewport più ampi, `axisWidth * 0.9 > 320` → il `Math.min` sceglie 320px, mantenendo il comportamento preesistente.

**Applicazione:** Questo calcolo è rilevante solo su desktop (≥ 720px) dove la sub-timeline è inline. Su mobile (< 720px) la sub-timeline è un bottom-sheet `left: 0; right: 0` e il calcolo di `width/left` non è applicato (per via di `axisWrapperStyle = {}` su mobile).

---

## E-05 — Bottom-sheet su mobile: CSS-only via `position: fixed`

**Decisione:** Il bottom-sheet è implementato **interamente via CSS** con `position: fixed; bottom: 0; left: 0; right: 0`. Il componente non ha logica JSX separata per mobile vs. desktop (tranne `isMobile` per l'animazione). Il `::before` drag-handle è puramente decorativo (nessuna gesture di swipe-to-dismiss — fuori scope).

**Motivazione:** Implementare un bottom-sheet con swipe-to-dismiss richiederebbe un hook `useDrag` o una libreria dedicata. Per la Fase E, il bottom-sheet è visivamente corretto e funzionale (l'utente chiude con ✕ o tap fuori). Il drag handle comunica l'affordance senza implementare la gesture.

**`useOutsideClick`:** Su mobile, un click fuori dall'`axis-wrapper` (ma dentro il bottom-sheet overlay) non chiude la sub-timeline — questo è corretto, dato che lo sfondo del bottom-sheet è parte dell'overlay visivo. Il `✕` e il tasto Escape (gestito in `Timeline.tsx`) sono i canali di chiusura espliciti.

**`axisWrapperStyle` condizionale:** Su mobile, `axisWrapperStyle = {}` lascia che il CSS controlli completamente il layout dell'axis-wrapper (full-width, padding, nessun border). Su desktop, `{ width: Xpx, left: Ypx }` posiziona inline come prima.

---

## E-06 — Connettori SVG: nascosti su mobile, visibili su desktop

**Decisione:** I connettori SVG (`timeline__subtimeline-connectors`) hanno `display: none` come valore base (mobile) e vengono ripristinati con `display: block` a `@media (min-width: 720px)`.

**Motivazione:** I connettori collegano visivamente il gruppo sulla timeline all'inizio e alla fine della sub-timeline inline. Su mobile (bottom-sheet `position: fixed`), i connettori non hanno un punto di ancoraggio visivo sensato (la sub-timeline non è spazialmente adiacente al gruppo). Nasconderli elimina anche la complessità del calcolo `left/width` (che fa uso di coordinate della timeline principale, inaccessibili in modo stabile quando la sub-timeline è `position: fixed`)).

**SVG `aria-hidden="true"`:** Aggiunto al tag `<svg>` in SubTimeline.tsx — i connettori sono puramente decorativi e non devono essere letti dagli screen reader.

---

## Riepilogo file modificati (Fase E)

| File | Tipo modifica |
|---|---|
| `src/components/timeline/SubTimeline.tsx` | Import `motion` da framer-motion; aggiunto `isMobile` state + `useEffect` resize; `responsiveMinWidth` calcolo; root `<div>` → `<motion.div>` con animazione; `axisWrapperStyle` condizionale; pulsante `.timeline__subtimeline-close`; `aria-hidden` sull'SVG |
| `src/components/timeline/Timeline.tsx` | Import `AnimatePresence`; `{activeGroup && ...}` avvolto in `<AnimatePresence>`; `key={activeGroup.id}` su `<SubTimeline>` |
| `src/css/timeline.css` | `.timeline__subtimeline` riscritta mobile-first (bottom-sheet base, inline desktop); `.timeline__subtimeline::before` drag-handle; `.timeline__subtimeline-connectors` `display: none` base → `display: block` a 720px; `.timeline__subtimeline-axis-wrapper` regola `@media (max-width: 719px)` full-width; aggiunta classe `.timeline__subtimeline-close` |
| `refactor_docs/refactor_2/PLAN.md` | Fase E marcata come completata |

---

# Decisioni di Refactoring — Fase F
**Data di completamento:** 2026-03-15  
**Fase:** F — Scrolling, Overflow, Polish e z-index

---

## F-01 — Mappa z-index globale: custom properties `--z-*` in `:root`

**Decisione:** Aggiunti 15 custom properties `--z-*` in `:root` di `index.css`, con una tabella ASCII di riferimento commentata. I valori hardcoded in tutti i file CSS sono stati sostituiti con `var(--z-*)`.

**Valori standardizzati:**
| Variabile | Valore | Utilizzo |
|---|---|---|
| `--z-timeline-line` | 0 | `.timeline__line` (baseline) |
| `--z-timeline-ticks` | 1 | ticks, `.timeline__group-range` |
| `--z-hover-tooltip` | 2 | hover tooltip, sub-eventi |
| `--z-events` | 3 | `.timeline__event` |
| `--z-focus-groups` | 4 | `.timeline__focus`, `.timeline__group` |
| `--z-label-tooltip` | 5 | `.timeline__label` |
| `--z-subtimeline` | 6 | sub-timeline inline (desktop) |
| `--z-pinch-hint` | 8 | pinch-to-zoom hint |
| `--z-controls` | 10 | zoom controls, close btn, 3D header |
| `--z-wizard` | 20 | wizard backdrop, tooltip locale timescales |
| `--z-subtimeline-mob` | 50 | sub-timeline bottom-sheet (mobile fixed) |
| `--z-phenomena-dd` | 100 | PhenomenaSearch dropdown |
| `--z-navbar-dropdown` | 1200 | navbar dropdown menu |
| `--z-navbar` | 1800 | `.app-navbar` |
| `--z-overlay` | 2400 | scale overlay backdrop |

**Motivazione:** Con 20+ utilizzi di `z-index` sparsi in 8 file CSS, ogni modifica richiedeva una ricerca globale per non rompere l'ordine di stacking. Le custom properties centralizzano la definizione e rendono il significato semantico esplicito (es. `var(--z-wizard)` è autoesplicativo, `20` non lo è).

**Doppio uso di `--z-wizard` (valore 20):** Usato sia per `.birth-wizard` (position: fixed) che per `.ts-overview__tooltip` (locale). Condividono lo stesso livello numerico senza conflitti reali — il tooltip è in un stacking context locale (position: relative), il wizard è global (position: fixed). Il commento `/* local popup — same stacking level as wizard backdrop */` chiarisce l'intento.

**`--z-subtimeline-mob` (50) vs `--z-subtimeline` (6):** Due variabili per la stessa componente in due contesti di positioning diversi. `position: relative` (desktop) e `position: fixed` (mobile) creano stacking context con semantica diversa — un unico valore non può soddisfare entrambe.

**Alternativa scartata:** CSS `@property` con syntax descriptor per i valori integer. Non supportato in Safari 15 e aggiunge complessità senza benefici pratici.

---

## F-02 — `isolation: isolate` su `.timeline-3d`

**Decisione:** Aggiunto `isolation: isolate` a `.timeline-3d` in `timeline3d.css`.

**Motivazione:** `isolation: isolate` crea un nuovo stacking context senza dover specificare `z-index` o `position`. Questo garantisce che:
1. I z-index degli elementi figli (`.timeline-3d__header` a z:10) non competono con elementi *parent* che potrebbero avere z-index minori ma stacking context diverso.
2. Gli eventi DOM generati da OrbitControls (Three.js) che risalgono il DOM vengono contenuti nel context — riduce il rischio di interazione accidentale con handler di pointer su elementi parent (es. il `onPointerDown` del main axis).

**Impatto:** Nessun effetto visivo. Effetto funzionale: gli handler di Three.js non possono più causare interazioni accidentali con elementi fuori dal canvas 3D.

---

## F-03 — AgeTable overflow verticale su mobile

**Decisione:** `.age-table__wrap` ora ha `overflow-y: auto; max-height: 55vh` come valori base (mobile). `max-height: none` ripristinato via `@media (min-width: 720px)`.

**Motivazione:** Su schermi piccoli con molte righe nella tabella (es. 12 milestones), la tabella può occupare l'intera altezza della schermata, costringendo l'utente a scorrere molto per raggiungere la timeline. Il `max-height: 55vh` limita l'altezza della tabella senza troncare il contenuto (grazie a `overflow-y: auto` che la rende scrollabile internamente).

**55vh vs. 60vh:** La sub-timeline bottom-sheet usa `max-height: 60vh`. 55vh differenzia i due elementi e lascia spazio sufficiente per vedere le righe più importanti della tabella senza scroll.

**`overflow-x` e `overflow-y` entrambi auto:** Questa combinazione è sicura — non attiva lo scroll su entrambi gli assi contemporaneamente; ogni asse si attiva solo se il contenuto eccede. `-webkit-overflow-scrolling: touch` già presente dal refactor Fase B.

---

## F-04 — iOS scroll lock fix in `useBirthWizard.ts`

**Decisione:** L'effect che blocca lo scroll alla apertura del wizard usa la tecnica **position-fixed con top negativo**:

```typescript
const scrollY = window.scrollY;
body.style.overflow  = "hidden";
body.style.position  = "fixed";
body.style.top       = `-${scrollY}px`;
body.style.width     = "100%";
// cleanup:
body.style.position  = prevPosition;
body.style.top       = prevTop;
body.style.width     = prevWidth;
window.scrollTo(0, scrollY);
```

**Problema risolto:** Su iOS Safari, `overflow: hidden` sul `body` causa:
1. Scroll della pagina verso `scrollTop = 0` (layout jump).
2. Impossibilità di bloccare lo scroll (iOS ignora `overflow: hidden` su `body` nelle versioni precedenti alla 15.4).

La tecnica `position: fixed + top: -scrollY` risolve entrambi i problemi: la pagina è visivamente ferma nella stessa posizione, e iOS rispetta `overflow: hidden` su un `position: fixed` element.

**Ripristino valori precedenti invece di stringa vuota:** `prevOverflow`, `prevPosition`, `prevTop`, `prevWidth` salvati prima della modifica. Se il wizard viene aperto mentre il body ha già stili applicati da altro codice, questi vengono preservati invece di essere azzerati.

**Alternativa scartata:** Usare `scrollbar-gutter: stable` per evitare il layout shift quando la scrollbar scompare. Non risolve il problema iOS e richiede un browser moderno.

---

## F-05 — `will-change: transform` durante il pan

**Decisione:** Aggiunto `will-change: transform` a `.timeline__axis--panning` in `timeline.css`. La proprietà è assente da `.timeline__axis` (non-panning), garantendo che il browser non promuova il layer in modo permanente.

**Motivazione:** Durante il pan, il browser re-renderizza la posizione di 10-50 elementi (`left: X%`) ad ogni frame di animazione (60fps). `will-change: transform` segnala al browser di preparare un layer compositing per l'asse, riducendo il costo di paint. Il beneficio è maggiore su dispositivi mobile con GPU limitata.

**`will-change: transform` vs. `will-change: left`:** `will-change: left` non è un compositor hint valido (solo `transform`, `opacity`, `filter` e pochi altri abilitano GPU compositing). `will-change: transform` è il suggerimento corretto anche se tecnicamente stiamo aggiornando `left` — il browser userà il hint per ottimizzare il rendering del layer, non per il tipo di proprietà CSS che cambia.

**Layer promotion temporanea:** La classe `.timeline__axis--panning` è aggiunta da `setIsPanning(true)` in `handleAxisPointerMove` e rimossa da `setIsPanning(false)` in `handleAxisPointerUp` e `handleAxisPointerDown` cleanup. Il layer è promosso solo durante il gesto attivo — nessun overhead permanente.

---

## Riepilogo file modificati (Fase F)

| File | Tipo modifica |
|---|---|
| `src/css/index.css` | Aggiunto blocco `--z-*` custom properties (15 variabili) in `:root` con tabella ASCII |
| `src/css/timeline.css` | 10 sostituzioni `z-index: N` → `var(--z-*)`; aggiunto `will-change: transform` a `.timeline__axis--panning` |
| `src/css/wizard.css` | `z-index: 20` → `var(--z-wizard)` |
| `src/css/scale-overlay.css` | `z-index: 2400` → `var(--z-overlay)` |
| `src/css/timescales.css` | `z-index: 20` → `var(--z-wizard)` (tooltip); `z-index: 100` → `var(--z-phenomena-dd)` |
| `src/css/navbar.css` | `z-index: 1800` → `var(--z-navbar)`; `z-index: 1200` → `var(--z-navbar-dropdown)` |
| `src/css/timeline3d.css` | `z-index: 10` → `var(--z-controls)`; aggiunto `isolation: isolate` a `.timeline-3d` |
| `src/css/components.css` | `.age-table__wrap`: aggiunto `overflow-y: auto`, `max-height: 55vh` mobile; ripristinato a 720px |
| `src/hooks/useBirthWizard.ts` | iOS scroll lock fix: `position: fixed + top: -scrollY` invece di solo `overflow: hidden` |
| `refactor_docs/refactor_2/PLAN.md` | Fase F marcata come completata |
