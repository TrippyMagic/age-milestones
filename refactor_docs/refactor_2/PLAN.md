## Piano di Refactoring UI/UX — Age Milestones

### Executive Summary

Il progetto è stato portato da monolite a modulare (Fasi 0–5) con successo, ma l'interfaccia è cresciuta senza un design system mobile-first. Le criticità principali sono: **layout desktop-first** con media query a breakpoint reattive anziché adattive; **BirthDateWizard** a 4 step troppo rigido su mobile; **scrolling e overflow** mal gestiti in timeline, sub-timeline e overlay; **assenza di gesture touch** (pinch-to-zoom); **sub-timeline** non ancorata e con glitch visuali. Il piano propone un'evoluzione incrementale in 6 fasi, senza redesign radicale, mantenendo CSS plain con BEM e la stessa architettura React/Context.

**Priorità:** Mobile UX > Scrolling/overflow > Pinch-to-zoom > Sub-timeline > Wizard DOB > Stile unificato
**Rischi principali:** Regressioni CSS su desktop durante la migrazione mobile-first; conflitti z-index tra overlay, wizard e sub-timeline; test manuali su dispositivi touch indispensabili.
**Benefici attesi:** App pienamente usabile su smartphone; interazione timeline naturale; UX wizard più rapida; eliminazione glitch di sovrapposizione e scrolling.

---

### 1 — Analisi dello stato attuale

#### 1.1 Layout e Responsive

- **[index.css](../../src/css/index.css)**: il `body` usa `padding: clamp(16px, 4vw, 48px)` e `#root` ha `width: min(--layout-max-width, 100%)`. Il layout è centrato su desktop ma su viewport < 768px il breakpoint cambia ad `align-items: stretch` — unica media query per il layout globale.
- **[components.css](../../src/css/components.css)**: `.card` ha `max-width: 720px` con solo un breakpoint 480px. `.perspective-card` ha `border-radius: 32px` e `padding: 36px` — troppo generoso su smartphone. `.tabs` usa `flex-wrap: wrap` ma le pill sono 6 (una per prospettiva) e su schermi < 360px fuoriescono o si impilano in modo caotico.
- **[navbar.css](../../src/css/navbar.css)**: Navbar passa da layout riga a colonna sotto 640px, poi sotto 420px diventa full-width stacked — **3 breakpoint separati** con possibile sovrapposizione. Il dropdown menu ha `z-index: 1200` e la navbar `z-index: 1800`, ma il wizard usa `z-index: 20` (`position: fixed`) — inversione di livelli.
- **[Milestones.tsx](../../src/pages/Milestones.tsx)**: La pagina dispone `<Navbar>` → `<perspective-card>` (tabs + AgeTable) → `<timeline-card>` (filtri + timeline) in sequenza verticale senza alcuna sezione collassabile. Su mobile, lo scroll per raggiungere la timeline è lungo.

#### 1.2 BirthDateWizard

- **[BirthDateWizard.tsx](../../src/components/BirthDateWizard.tsx)**: 4 step rigidi (year → month → day → hour). Il wizard usa un layout a 2 colonne (`birth-wizard__grid` con `grid-template-columns: 0.95fr 1.2fr`) che collassa a 1 colonna sotto 720px. La sidebar `aside` con progress + summary è portata dopo il contenuto (order: 2) — spreca spazio verticale su mobile.
- Il wizard NON valida date future (PC-04 del FINAL_REPORT). Manca completamente la possibilità di modificare un singolo campo senza ripercorrere tutti gli step.
- Input `type="number"` per l'anno: su iOS genera tastiera decimale, non ideale. Manca `aria-invalid` per feedback d'errore.

#### 1.3 Timeline e SubTimeline

- **[timeline/Timeline.tsx](../../src/components/timeline/Timeline.tsx)**: Gestisce solo `PointerEvent` e `wheel` per pan/zoom — nessun supporto per touch multi-dito (pinch-to-zoom). Lo zoom via mouse wheel richiede `Ctrl`, bloccato da `evt.preventDefault()` — su touchpad Mac può interferire con lo scroll del browser.
- **[SubTimeline.tsx](../../src/components/timeline/SubTimeline.tsx)**: Si posiziona con `left` in px assoluti e `width` calcolata in JS. Il contenitore ha `min-height: 220px` fisso. L'`useOutsideClick` chiude la sub-timeline, ma su mobile un tap accidentale fuori la chiude troppo facilmente. Nessuna animazione di apertura/chiusura. Lo z-index non è definito esplicitamente, causando sovrapposizioni con focus-stem e hover-tooltip. I connettori SVG (`<line>` dashed) non scalano su mobile.
- **[timeline.css](../../src/css/timeline.css)**: `.timeline__axis` ha `height: 240px` (200px a 480px) — fissata, non adattiva. `.timeline__subtimeline` ha `position: relative` con `margin-top: 0` — il gap tra asse e sub-timeline è gestito solo dalla CSS variable `--timeline-sub-gap`, ma il valore è calcolato a runtime e non ha un fallback fluido. `.timeline__label` tooltip usa `transform: translate(-50%)` che può fuoriuscire dai bordi dello schermo su mobile.

#### 1.4 Scale Overlay

- **[scaleOverlay.tsx](../../src/components/scaleOverlay.tsx)**: Usa `createPortal` + `framer-motion` (`AnimatePresence`, `motion`) per l'animazione. Il layout a 2 colonne (`grid-template-columns: 1.15fr 0.85fr`) collassa a 1fr sotto 900px — corretto. Tuttavia il pannello usa `width: min(960px, 100%)` — su mobile il dot-grid (`count-scene__grid` con grid di dot 20×20px + gap 8px) può essere eccessivamente grande.

#### 1.5 Timescales

- **[timescales.css](../../src/css/timescales.css)**: Il Comparator usa `grid-template-columns: 1fr auto 1fr` che collassa a `1fr` sotto 720px — buono. L'Overview SVG container ha `height: 720px` (ridotto a 600px e poi 520px) — troppo alto su mobile, con overflow nascosto. L'Explorer grid `repeat(auto-fill, minmax(240px, 1fr))` diventa 1fr sotto 720px. La `PhenomenaSearch` dropdown ha `z-index: 100` — potenziale conflitto con header assoluti.

#### 1.6 Scrolling e Overflow

- Il `body` ha `overflow: hidden` impostato da `useBirthWizard` quando il wizard è aperto — corretto. Ma `.timeline-3d` con `overflow: hidden` e altezza fissa (520px → 380px → 320px) non ha scrollbar alternative. La `SubTimeline` non ha overflow isolato — se contiene molti eventi il contenuto può fuoriuscire dal contenitore. Lo scroll dell'AgeTable non è necessario su desktop ma la tabella non ha `overflow-x: auto` per schermi stretti dove le celle di testo possono wrappare male.

---

### 2 — Linee guida di refactoring

#### 2.1 Stile e Design System leggero

- **Token CSS**: standardizzare spaziatura (aggiungere `--space-xs: 4px`, `--space-sm: 8px`, `--space-md: 16px`, `--space-lg: 24px`, `--space-xl: 32px`) in [`:root` di index.css](../../src/css/index.css). Sostituire i `clamp()` ad hoc con token uniformi.
- **Tipografia**: definire scale tipografiche (`--text-xs`, `--text-sm`, `--text-base`, `--text-lg`, `--text-xl`, `--text-2xl`) nel `:root`. Attualmente i `font-size` sono hardcoded a `.72rem`, `.78rem`, `.82rem`, `.85rem`, `.9rem`, `.95rem` in modo inconsistente tra i moduli CSS.
- **Bordi e ombre**: creare variabili per `--border-subtle`, `--border-accent`, `--shadow-card`, `--shadow-popup` — usati identicamente in 20+ posti con valori rgba inline.
- **Componente `.card-base`**: estrarre le proprietà condivise (border-radius, background rgba, border, backdrop-filter, box-shadow) in una classe base. Attualmente `.card`, `.perspective-card`, `.section-card`, `.ts-era-card`, `.ts-comparator__selected-card`, `.birth-wizard__panel` definiscono tutte lo stesso pattern con varianti minime.

#### 2.2 Layout Responsive Mobile-First

- **Invertire l'approccio**: riscrivere le regole di base come mobile (1 colonna, padding ridotti, font-size compatti) e aggiungere `@media (min-width: X)` per le espansioni desktop. Attualmente il CSS è desktop-first con `max-width` breakpoint.
- **Breakpoint unificati**: definire tre breakpoint come custom media variables (commenti di convenzione, dato che CSS custom media non sono supportati nativamente senza PostCSS): `480px` (compact), `720px` (tablet), `1024px` (desktop). Attualmente i breakpoint sono 420px, 480px, 560px, 640px, 720px, 768px, 900px — 7 valori diversi sparsi in 8 file CSS.
- **Sezioni collassabili**: Su mobile, la `perspective-card` (Milestones) dovrebbe avere l'AgeTable in un `<details>/<summary>` nativo o un accordion Framer Motion, così l'utente raggiunge più velocemente la timeline.

#### 2.3 Accessibilità e Semantica

- Aggiungere `aria-label` a tutti i `<button>` icon-only (pulsanti zoom +/−/↺, toggle 3D, close wizard).
- I `.tab` in `Milestones.tsx` usano `aria-pressed` — dovrebbero essere `role="tab"` + `aria-selected` (come già fatto in `Timescales.tsx`). Unificare il pattern.
- L'AgeTable è un `<table>` senza `<caption>` né `<thead>`. Aggiungere `<caption className="sr-only">` per screen reader.
- I `<li>` in `PhenomenaSearch` mancano di `tabIndex` e `onKeyDown` (già segnalato come PC-03).
- Aggiungere `prefers-reduced-motion: reduce` per disabilitare le transizioni CSS (`transition: left 0.38s` della timeline, `animation: count-pop` del dot-grid).

#### 2.4 Interazioni Touch

- **Pinch-to-zoom**: aggiungere handler `touchstart` / `touchmove` / `touchend` all'asse della timeline. Calcolare la distanza tra due tocchi con `Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY)`, memorizzare la distanza iniziale su `touchstart`, e mappare il rapporto `currentDistance / initialDistance` a `applyZoom` da [scaleTransform.ts](../../src/utils/scaleTransform.ts), usando il punto medio come ancoraggio.
- **Pan a un dito**: già supportato via PointerEvent (funziona su touch), ma verificare che `setPointerCapture` funzioni correttamente con touch su iOS Safari.
- **touch-action**: Aggiungere `touch-action: none` a `.timeline__axis` per prevenire lo scroll del browser durante il pan/pinch. Attualmente manca questa proprietà.

#### 2.5 Sub-Timeline

- **Ancoraggio**: il componente dovrebbe animare la sua apertura con `framer-motion` (`AnimatePresence` + `motion.div` con `initial={{ opacity: 0, height: 0 }}` → `animate={{ opacity: 1, height: "auto" }}`). Framer Motion è già installato e importato in `scaleOverlay.tsx` — espandere l'utilizzo.
- **Close button esplicito**: aggiungere un pulsante `✕` visibile nell'angolo superiore destro del wrapper, non solo `useOutsideClick`. Su mobile, fuori-click è inaffidabile.
- **z-index**: assegnare esplicitamente `z-index: 6` alla `.timeline__subtimeline` (attualmente non definito) per stare sopra ticks (z:1), eventi (z:3), focus (z:4), label (z:5).
- **Dimensioni responsive**: `SUB_TIMELINE_MIN_WIDTH = 320` è troppo largo su viewport < 360px. Rendere la min-width responsiva: `Math.min(320, axisWidth * 0.9)`.
- **Connettori SVG**: su mobile i connettori dashed possono apparire fuori proporzione. Ridurre `stroke-width` e `stroke-dasharray` sotto 480px.

#### 2.6 Wizard DOB

- **Opzione single-step**: offrire una modalità alternativa "Quick input" con un singolo form inline (3 input: data completa via `<input type="date">` nativo + ora via `<input type="time">`) sotto i 4 step wizard, mostrato come link "Quick entry" nel footer del wizard. Preservare il wizard a 4 step come opzione "Guided".
- **Modifica diretta**: nel summary panel laterale, ogni campo (Year, Month, Day, Time) dovrebbe essere cliccabile per saltare direttamente allo step corrispondente (`setStepIndex(targetIndex)`). Questo elimina il problema di "ripercorrere tutto il wizard".
- **Validazione date future**: aggiungere un check al `day` step: `new Date(year, month-1, day) <= new Date()`. Mostrare un messaggio di errore inline (`aria-invalid="true"` + testo sotto l'input).
- **Tastiera mobile**: per l'input dell'anno, usare `inputMode="numeric"` + `pattern="[0-9]*"` che forza la tastiera numerica su iOS.

---

### 3 — Piano per fasi

#### ✅ Fase A — Fondamenta: Token CSS e Mobile Reset (Completata: 2026-03-15)

1. ✅ Aggiunto token CSS (`--space-*`, `--text-*`, `--border-*`, `--shadow-*`, `--radius-*`) al `:root` in [index.css](../../src/css/index.css).
2. ✅ Creata classe `.card-base` in [components.css](../../src/css/components.css); ereditata da `.perspective-card`, `.section-card` (components.css), `.ts-era-card` (timescales.css), `.birth-wizard__panel` (wizard.css).
3. ✅ Unificati i breakpoint a 3 (480 / 720 / 1024) e convertite le media query da `max-width` a `min-width` (mobile-first) progressivamente in tutti i file CSS: index.css, components.css, timeline.css, scale-overlay.css, timescales.css, timeline3d.css, wizard.css. navbar.css: solo standardizzazione dei valori (640→720, 420→480); redesign completo nella Fase B.
4. ✅ Aggiunto `touch-action: none` a `.timeline__axis` e `touch-action: pan-y` a `.timeline` in [timeline.css](../../src/css/timeline.css). Aggiunto `touch-action: none` anche a `.timeline-3d` in [timeline3d.css](../../src/css/timeline3d.css).
5. ✅ Aggiunta regola `@media (prefers-reduced-motion: reduce)` globale in [index.css](../../src/css/index.css) che disabilita `transition` e `animation` su `.timeline__axis--transitioning *`, `.count-scene__dot`, `.ts-comparator__bar-fill`.

#### ✅ Fase B — Ottimizzazione Mobile: Navbar, Pagine, AgeTable (Completata: 2026-03-15)

1. ✅ Riscritta la navbar responsive: sotto 720px barra compatta con brand a sinistra e hamburger a destra. "Edit birth date" spostato nel dropdown (mobile) tramite classe `.app-navbar__edit-dropdown`; inline solo su desktop (≥720px). Rimossi i breakpoint intermedi.
2. ✅ Pagina Milestones: `<section className="perspective-card">` wrappata in `<div className="perspectives-panel">` con toggle button (chiuso di default su mobile, aperto su desktop via `window.innerWidth >= 720`). La timeline rimane sempre visibile.
3. ✅ `border-radius` ridotto: `.perspective-card` mobile base 20px (era 26px), desktop 32px. `.birth-wizard__panel` mobile base 20px (era 32px), desktop 32px.
4. ✅ `.age-table`: aggiunto wrapper `.age-table__wrap` con `overflow-x: auto; -webkit-overflow-scrolling: touch`. Celle `.age-val` ora hanno `white-space: nowrap; overflow: hidden; text-overflow: ellipsis`.
5. ✅ `.timeline__label`: aggiunto `max-width: min(240px, calc(100vw - var(--space-xl)))` per impedire overflow del tooltip oltre i bordi del viewport su schermi stretti.

#### ✅ Fase C — Refactor Wizard DOB (Completata: 2026-03-15)

1. ✅ Aggiunto link "⚡ Quick entry" nel wizard che mostra un form compatto con `<input type="date" max={TODAY}>` + `<input type="time">` in una sola schermata. Toggle bidirezionale: "← Step-by-step instead" riporta alla modalità guidata.
2. ✅ I campi del summary panel (`Year`, `Month`, `Day`, `Time`) sono ora cliccabili con `onClick={() => setStepIndex(idx)}` e accessibili via tastiera (`role="button"`, `tabIndex={0}`, `onKeyDown`). Il campo attivo è evidenziato con `.birth-wizard__summary-item--active`.
3. ✅ Validazione data futura implementata: `yearError` (anno > anno corrente) e `dateError` (data completa > oggi) con messaggio inline `.birth-wizard__error` (`role="alert"`) e `aria-invalid` sull'input. `canContinue` blocca il progresso se la data è futura.
4. ✅ Sidebar `.birth-wizard__aside` nascosta completamente su mobile (`display: none` base) e ripristinata a `@media (min-width: 480px)`.
5. ✅ Aggiunto `pattern="[0-9]*"` a tutti gli input numerici (year, day, hour) per forzare la tastiera numerica su iOS.

#### ✅ Fase D — Pinch-to-Zoom sulla Timeline (Completata: 2026-03-15)

1. ✅ Creato hook custom `usePinchZoom` in [`src/hooks/usePinchZoom.ts`](../../src/hooks/usePinchZoom.ts). Gestisce `touchstart` (salva distanza iniziale e notifica abort-pan), `touchmove` (calcola fattore incrementale, mappa midpoint→anchorMs, chiama `applyZoom`), `touchend`/`touchcancel` (resetta stato). Usa `{ passive: false }` + `evt.preventDefault()`.
2. ✅ Collegato `usePinchZoom` all'asse in `Timeline.tsx`. Il calcolo dell'ancoraggio usa `ratioToValue(relative, viewportToRange(vp), scaleModeRef.current)` identico al `Ctrl+scroll` handler.
3. ✅ Coesistenza pan 1 dito + pinch 2 dita: `isPinchingRef` (MutableRefObject condiviso) blocca i `PointerEvent` pan handler durante la pinch; `onPinchStart` callback azzera `panStartRef` e chiama `setIsPanning(false)`. `handleAxisPointerDown` guarda `isPinchingRef.current` e `panStartRef !== null` per non sovrascrivere il pan con il secondo dito.
4. ✅ Hint `Ctrl+scroll` già nascosto a 720px (Fase A). Verificato.
5. ✅ Aggiunto hint "Pinch to zoom" (`.timeline__pinch-hint`) che appare per 3s al primo touch tramite `showPinchHint` state + `setTimeout`. Animazione `pinch-hint-fade` con fade-in/hold/fade-out. Disabilitata via `@media (prefers-reduced-motion: reduce)` in `index.css`.

#### ✅ Fase E — Redesign Sub-Timeline (Completata: 2026-03-15)

1. ✅ Wrappata la `SubTimeline` in `<AnimatePresence>` (in `Timeline.tsx`) + `<motion.div>` come root element del componente. Desktop: `initial={{ opacity: 0, scaleY: 0.8 }}` → `animate={{ opacity: 1, scaleY: 1 }}` → `exit={{ opacity: 0, scaleY: 0.8 }}`, `transformOrigin: "top center"`, durata 220ms. Mobile: `initial={{ opacity: 0, y: "100%" }}` → slide-up 280ms. `key={activeGroup.id}` garantisce il ciclo mount/unmount corretto.
2. ✅ Aggiunto pulsante `✕` `.timeline__subtimeline-close` in posizione `absolute; top: 10px; right: 10px; z-index: 10` all'interno di `.timeline__subtimeline-axis-wrapper`, con `aria-label="Close expanded events"`, `:hover` e `:focus-visible`.
3. ✅ Definito `z-index: 6` su `.timeline__subtimeline` nel blocco `@media (min-width: 720px)` di [timeline.css](../../src/css/timeline.css). Mobile usa `z-index: 50` (position: fixed bottom-sheet).
4. ✅ `SUB_TIMELINE_MIN_WIDTH` sostituito con `responsiveMinWidth = Math.min(320, axisWidth * 0.9)` in [SubTimeline.tsx](../../src/components/timeline/SubTimeline.tsx).
5. ✅ Su mobile (< 720px) la sub-timeline è un pannello bottom-sheet `position: fixed; bottom: 0; left: 0; right: 0; max-height: 60vh; overflow-y: auto; border-radius: 20px 20px 0 0` con drag-handle `::before` e sfondo glassmorphism. `axisWrapperStyle` è vuoto su mobile — il layout si adatta tramite CSS. L'SVG dei connettori è nascosto su mobile (`display: none` base) e ripristinato su desktop (`@media (min-width: 720px)`).
6. ✅ I connettori SVG sono visibili solo a ≥ 720px. La riduzione di `stroke-width`/`stroke-dasharray` a < 480px è moot in quanto i connettori non vengono mostrati sotto quella soglia.

#### ✅ Fase F — Scrolling, Overflow, Polish e z-index (Completata: 2026-03-15)

1. ✅ **Mappa z-index globale** (F-01): aggiunti 15 custom properties `--z-*` in `:root` di `index.css` con tabella di riferimento commentata. Tutti i valori hardcoded sostituiti con `var(--z-*)` in: `timeline.css` (10 sostituzioni), `wizard.css`, `scale-overlay.css`, `timescales.css` (2), `navbar.css` (2), `timeline3d.css`.
2. ✅ **Isolamento stacking context 3D** (F-02): aggiunto `isolation: isolate` a `.timeline-3d` in `timeline3d.css`. Crea un nuovo stacking context che impedisce agli eventi di OrbitControls di propagarsi e di conflitti z-index con elementi parent.
3. ✅ **AgeTable overflow verticale** (F-03): aggiunto `overflow-y: auto; max-height: 55vh` a `.age-table__wrap` come base mobile; `max-height: none` ripristinato a `@media (min-width: 720px)`. Tabelle molto lunghe sono ora scorrevoli verticalmente su mobile.
4. ✅ **iOS scroll lock fix** (F-04): `useBirthWizard.ts` usa ora la tecnica `position: fixed + top: -${scrollY}px + width: 100%` invece di solo `overflow: hidden`. Il `scrollY` viene salvato prima dell'apertura e ripristinato con `window.scrollTo(0, scrollY)` alla chiusura, evitando il salto della pagina su iOS Safari.
5. ✅ **`will-change: transform`** (F-05): aggiunto a `.timeline__axis--panning` in `timeline.css`. La proprietà è attiva solo durante il pan (classe applicata da JS) e rimossa automaticamente quando la classe è rimossa — nessuna layer promotion permanente.
   - `z-index: 1` — ticks timeline
   - `z-index: 3` — eventi
   - `z-index: 4` — focus, gruppi
   - `z-index: 5` — label tooltip
   - `z-index: 6` — sub-timeline
   - `z-index: 10` — controls, 3D overlay header
   - `z-index: 20` — wizard backdrop
   - `z-index: 100` — dropdown PhenomenaSearch
   - `z-index: 1200` — navbar dropdown
   - `z-index: 1800` — navbar
   - `z-index: 2400` — scale overlay
2. Isolare l'overflow del canvas 3D: `.timeline-3d` ha già `overflow: hidden` — verificare che OrbitControls non propaga eventi al body. Aggiungere `touch-action: none` al contenitore.
3. Aggiungere `overflow-y: auto; -webkit-overflow-scrolling: touch` al contenitore dell'AgeTable per schermi stretti.
4. Fix: quando il wizard apre (`body.style.overflow = "hidden"` in [useBirthWizard.ts](../../src/hooks/useBirthWizard.ts)), salvare e ripristinare anche `scrollY` per evitare salti della pagina su iOS.
5. Aggiungere `will-change: transform` solo durante pan/zoom sulla timeline per indicare al browser l'ottimizzazione compositing, e rimuoverlo quando il pan termina (evitare layer promotion permanente).

---

### 4 — Test e Accessibilità

#### Test unitari (Vitest)

- Aggiungere test per il nuovo hook `usePinchZoom`: simulare `TouchEvent` e verificare che `applyZoom` sia chiamato con il fattore corretto.
- Test per la validazione data futura nel wizard.
- Test per il calcolo responsivo di `SUB_TIMELINE_MIN_WIDTH`.
- Estendere i test di `scaleTransform.test.ts` con edge case: ancoraggio a 0%, 100%, valori negativi.

#### Test E2E (raccomandati)

- Usare **Playwright** con `page.touchscreen` per testare pinch-to-zoom: due touchpoint che si avvicinano/allontanano → verificare che il viewport span cambi.
- Test scroll: aprire wizard → verificare che body non scrolla → chiudere → verificare scroll ripristinato.
- Test sub-timeline: click su gruppo → verifica che la sub-timeline appaia → click fuori → verifica chiusura → verifica su viewport mobile che il bottom-sheet appaia.

#### Accessibilità

- Audit Lighthouse dopo ogni fase — target ≥ 90 Accessibility.
- Testare con VoiceOver (iOS) e TalkBack (Android) in particolare la navigazione nel wizard e nella timeline.
- Verificare contrasto minimo (4.5:1) su tutti i testi `--text-muted` sopra `rgba(15, 23, 42, 0.55)` — attualmente potrebbe essere sotto soglia.
- Aggiungere `focus-visible` outline coerente (anello indigo) su tutti i componenti interattivi — attualmente solo `.tab` e `.timeline__event` hanno `:focus-visible` esplicito.

---

### 5 — Raccomandazioni finali

#### Decisioni architetturali

| Decisione | Raccomandazione |
|---|---|
| CSS Modules / Tailwind | **No.** Mantenere CSS plain BEM. I token CSS sono sufficienti per uniformare. |
| Framer Motion | **Sì, espanderne l'uso.** È già installato e usato in `scaleOverlay.tsx`. Usarlo per sub-timeline e wizard transitions. |
| Libreria gesture (e.g. `@use-gesture/react`) | **Valutare.** Se il custom `usePinchZoom` diventa complesso (gestione inerzia, threshold, conflitto con pan), adottare `@use-gesture/react` (~3 kB gzip). Per il MVP, un hook custom è sufficiente. |
| State management | **Nessun cambio.** Il doppio Context è sufficiente. |
| Bottom-sheet library | **No.** Implementare il bottom-sheet con CSS + Framer Motion. Evitare `react-bottom-sheet` o simili. |

#### Trade-off

- **Mobile-first rewrite CSS** vs. patch incrementale: la riscrittura mobile-first è più pulita ma rischia regressioni desktop. Mitigare con screenshot diff (Playwright visual regression) prima/dopo.
- **4-step wizard vs. single-step**: il wizard guidato è un punto di forza UX. Aggiungere l'opzione "Quick entry" senza rimuovere i 4 step.
- **Bottom-sheet sub-timeline vs. inline**: il bottom-sheet è più naturale su mobile ma richiede un path di rendering separato. Usare un breakpoint CSS e un flag JS per switchare tra le due modalità.

#### Aspetti da rimandare

- Migrazione `src/components/unused/` (DT-2): funziona, non interferisce con il refactoring UI.
- i18n: rimandare a dopo il polish mobile.
- Pagina Personalize: resta placeholder — non in scope.
- Error Boundary per 3D (PC-02): utile ma indipendente dal refactoring UI.
- EventMarker3D click → pannello dettaglio: nice-to-have post-refactoring.

