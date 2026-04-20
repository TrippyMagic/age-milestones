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

