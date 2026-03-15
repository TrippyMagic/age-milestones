import { FormEvent, useMemo, useState } from "react";

type BirthDateWizardProps = {
  initialDate: Date | null;
  initialTime: string;
  onCancel: () => void;
  onComplete: (date: Date, time: string) => void;
};

const MONTHS = [
  "Gennaio",
  "Febbraio",
  "Marzo",
  "Aprile",
  "Maggio",
  "Giugno",
  "Luglio",
  "Agosto",
  "Settembre",
  "Ottobre",
  "Novembre",
  "Dicembre",
];

const STEPS = ["year", "month", "day", "hour"] as const;
const CURRENT_YEAR = new Date().getFullYear();
const MIN_YEAR = 1900;

const STEP_LABELS: Record<(typeof STEPS)[number], string> = {
  year: "Year",
  month: "Month",
  day: "Day",
  hour: "Hour",
};

const STEP_DESCRIPTIONS: Record<(typeof STEPS)[number], string> = {
  year: "Start with the year that marks your arrival.",
  month: "Choose the month to narrow things down.",
  day: "Pick the day you were born on.",
  hour: "Add the hour if you know it, 24h format.",
};

// Format a Date to "YYYY-MM-DD" for <input type="date">
const toDateInputValue = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const TODAY_STR = toDateInputValue(new Date());

export default function BirthDateWizard({
  initialDate,
  initialTime,
  onCancel,
  onComplete,
}: BirthDateWizardProps) {
  // ── Mode ────────────────────────────────────────────────
  type WizardMode = "steps" | "quick";
  const [mode, setMode] = useState<WizardMode>("steps");

  // ── Step-mode state ─────────────────────────────────────
  const [stepIndex, setStepIndex] = useState(0);
  const [year, setYear] = useState<number | "">(
    initialDate ? initialDate.getFullYear() : "",
  );
  const [month, setMonth] = useState<number | "">(
    initialDate ? initialDate.getMonth() + 1 : "",
  );
  const [day, setDay] = useState<number | "">(
    initialDate ? initialDate.getDate() : "",
  );
  const [hour, setHour] = useState<number | "">(() => {
    const [rawHour] = initialTime.split(":");
    const parsed = Number(rawHour);
    return Number.isFinite(parsed) ? parsed : "";
  });

  // ── Quick-entry state ────────────────────────────────────
  const [quickDate, setQuickDate] = useState(() =>
    initialDate ? toDateInputValue(initialDate) : ""
  );
  const [quickTime, setQuickTime] = useState(initialTime || "00:00");

  // ── Derived step data ────────────────────────────────────
  const step = STEPS[stepIndex];
  const isLastStep = step === "hour";
  const questionId = `birth-wizard-question-${step}`;
  const hintId = `birth-wizard-hint-${step}`;

  const daysInMonth = useMemo(() => {
    if (typeof month !== "number") return 31;
    const baseYear = typeof year === "number" ? year : CURRENT_YEAR;
    return new Date(baseYear, month, 0).getDate();
  }, [month, year]);

  const monthLabel = typeof month === "number" ? MONTHS[month - 1] : "questo mese";

  // ── Validation ───────────────────────────────────────────
  const isYearValid = typeof year === "number" && year >= MIN_YEAR && year <= CURRENT_YEAR;
  const isMonthValid = typeof month === "number" && month >= 1 && month <= 12;
  const isDayValid =
    typeof day === "number" &&
    typeof month === "number" &&
    day >= 1 &&
    day <= daysInMonth;
  const isHourValid = typeof hour === "number" && hour >= 0 && hour <= 23;

  // Future-date checks
  const isFutureYear = typeof year === "number" && year > CURRENT_YEAR;
  const constructedDate = useMemo(() => {
    if (typeof year !== "number" || typeof month !== "number" || typeof day !== "number") return null;
    return new Date(year, month - 1, day);
  }, [year, month, day]);
  const isFutureDate = constructedDate !== null && constructedDate > new Date();

  const yearError = isFutureYear
    ? `Year cannot be in the future (max: ${CURRENT_YEAR}).`
    : typeof year === "number" && year < MIN_YEAR
    ? `Year must be ${MIN_YEAR} or later.`
    : null;
  const dateError = isFutureDate ? "This date hasn't happened yet." : null;

  const canContinue = (() => {
    switch (step) {
      case "year":
        return isYearValid && !isFutureYear;
      case "month":
        return isMonthValid && isYearValid;
      case "day":
        return isDayValid && !isFutureDate;
      case "hour":
        return isHourValid;
      default:
        return false;
    }
  })();

  // ── Handlers ─────────────────────────────────────────────
  const goBack = () => stepIndex === 0 ? onCancel() : setStepIndex(i => i - 1);

  const finish = (finalHour: number) => {
    if (typeof year !== "number" || typeof month !== "number" || typeof day !== "number") return;
    const result = new Date(year, month - 1, day);
    result.setHours(0, 0, 0, 0);
    const safeHour = Math.min(Math.max(Number.isFinite(finalHour) ? finalHour : 0, 0), 23);
    onComplete(result, `${String(safeHour).padStart(2, "0")}:00`);
  };

  const handleStepSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canContinue) return;
    if (isLastStep && typeof hour === "number") { finish(hour); return; }
    setStepIndex(i => Math.min(i + 1, STEPS.length - 1));
  };

  const handleQuickSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!quickDate) return;
    const [y, m, d] = quickDate.split("-").map(Number);
    const result = new Date(y, m - 1, d);
    onComplete(result, quickTime || "00:00");
  };

  // ── Summary (step mode) ──────────────────────────────────
  const hintText = (() => {
    switch (step) {
      case "year":
        return `Choose the year between ${MIN_YEAR} and ${CURRENT_YEAR}.`;
      case "month":
        return "Choose the month";
      case "day":
        return `This month has ${daysInMonth} days`;
      case "hour":
        return "24 hour format (0-23)";
      default:
        return "";
    }
  })();

  const summary = useMemo(() => {
    const summaryMonth = typeof month === "number" ? MONTHS[month - 1] : "—";
    const summaryDay =
      typeof day === "number" ? day.toString().padStart(2, "0") : "—";
    const summaryHour =
      typeof hour === "number" ? `${hour.toString().padStart(2, "0")}:00` : "—";
    const hasFullDate =
      typeof year === "number" && typeof month === "number" && typeof day === "number";
    return [
      { label: "Year", value: typeof year === "number" ? `${year}` : "—", stepIdx: 0 },
      { label: "Month", value: summaryMonth,                                stepIdx: 1 },
      { label: "Day",   value: summaryDay,                                  stepIdx: 2 },
      { label: "Time",  value: summaryHour,                                 stepIdx: 3 },
      { label: "Complete date", value: hasFullDate
          ? new Date(year as number, (month as number) - 1, day as number).toLocaleDateString(undefined, {
              day: "2-digit", month: "long", year: "numeric",
            })
          : "—",
        stepIdx: null },
    ];
  }, [day, hour, month, year]);

  // ── Render ───────────────────────────────────────────────
  return (
    <div className="birth-wizard" role="dialog" aria-modal="true" aria-labelledby={questionId}>

      {/* ── Quick-entry mode ── */}
      {mode === "quick" && (
        <form className="birth-wizard__panel" onSubmit={handleQuickSubmit}>
          <header className="birth-wizard__header">
            <p className="birth-wizard__step">Quick entry</p>
            <h2 className="birth-wizard__question" id={questionId}>
              Enter your birth date
            </h2>
            <p className="birth-wizard__description">
              Fill in date and time in one step.
            </p>
          </header>

          <div className="birth-wizard__quick">
            <div className="birth-wizard__field">
              <label className="birth-wizard__quick-label" htmlFor="quick-date">
                Date of birth
              </label>
              <input
                id="quick-date"
                type="date"
                max={TODAY_STR}
                value={quickDate}
                onChange={e => setQuickDate(e.target.value)}
                required
              />
            </div>

            <div className="birth-wizard__field">
              <label className="birth-wizard__quick-label" htmlFor="quick-time">
                Time <span className="birth-wizard__quick-optional">(optional)</span>
              </label>
              <input
                id="quick-time"
                type="time"
                value={quickTime}
                onChange={e => setQuickTime(e.target.value)}
              />
            </div>

            <div className="birth-wizard__actions">
              <button type="button" className="birth-wizard__secondary" onClick={onCancel}>
                Cancel
              </button>
              <button type="submit" className="birth-wizard__primary" disabled={!quickDate}>
                Confirm data
              </button>
            </div>

            <button
              type="button"
              className="birth-wizard__mode-toggle"
              onClick={() => setMode("steps")}
            >
              ← Step-by-step instead
            </button>
          </div>
        </form>
      )}

      {/* ── Step-by-step mode ── */}
      {mode === "steps" && (
        <form className="birth-wizard__panel" aria-describedby={hintId} onSubmit={handleStepSubmit}>
          <header className="birth-wizard__header">
            <p className="birth-wizard__step">Step {stepIndex + 1} of {STEPS.length}</p>
            <h2 className="birth-wizard__question" id={questionId}>
              {step === "year"  && "What year were you born?"}
              {step === "month" && "What month?"}
              {step === "day"   && "What day?"}
              {step === "hour"  && "What time?"}
            </h2>
            <p className="birth-wizard__description">{STEP_DESCRIPTIONS[step]}</p>
          </header>

          <div className="birth-wizard__grid">
            {/* ── Sidebar (hidden on very small screens) ── */}
            <aside className="birth-wizard__aside" aria-hidden="true">
              <div className="birth-wizard__progress">
                {STEPS.map((key, index) => (
                  <div
                    key={key}
                    className={`birth-wizard__progress-step ${
                      index < stepIndex  ? "birth-wizard__progress-step--done"
                      : index === stepIndex ? "birth-wizard__progress-step--active"
                      : ""
                    }`}
                  >
                    <span className="birth-wizard__progress-index">{index + 1}</span>
                    <span className="birth-wizard__progress-label">{STEP_LABELS[key]}</span>
                  </div>
                ))}
              </div>

              <div className="birth-wizard__summary">
                <h3 className="birth-wizard__summary-title">Current selection</h3>
                <dl className="birth-wizard__summary-list">
                  {summary.map(item => (
                    item.stepIdx !== null ? (
                      /* Clickable items — jump directly to that step */
                      <div
                        key={item.label}
                        className={`birth-wizard__summary-item birth-wizard__summary-item--clickable${
                          item.stepIdx === stepIndex ? " birth-wizard__summary-item--active" : ""
                        }`}
                        role="button"
                        tabIndex={0}
                        title={`Go to ${item.label} step`}
                        onClick={() => setStepIndex(item.stepIdx as number)}
                        onKeyDown={e => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setStepIndex(item.stepIdx as number);
                          }
                        }}
                      >
                        <dt>{item.label}</dt>
                        <dd>{item.value}</dd>
                      </div>
                    ) : (
                      <div key={item.label} className="birth-wizard__summary-item">
                        <dt>{item.label}</dt>
                        <dd>{item.value}</dd>
                      </div>
                    )
                  ))}
                </dl>
              </div>
            </aside>

            {/* ── Step content ── */}
            <div className="birth-wizard__content">
              <div className="birth-wizard__field">
                {step === "year" && (
                  <>
                    <input
                      type="number"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      min={MIN_YEAR}
                      max={CURRENT_YEAR}
                      value={year}
                      onChange={e => {
                        const v = e.target.value;
                        const p = Number(v);
                        setYear(v === "" || Number.isNaN(p) ? "" : p);
                      }}
                      aria-describedby={hintId}
                      aria-invalid={yearError !== null || undefined}
                      required
                    />
                    {yearError && (
                      <span className="birth-wizard__error" role="alert">{yearError}</span>
                    )}
                  </>
                )}

                {step === "month" && (
                  <select
                    value={month === "" ? "" : month}
                    onChange={e => {
                      const v = e.target.value;
                      setMonth(v === "" ? "" : Number(v));
                    }}
                    aria-describedby={hintId}
                    required
                  >
                    <option value="" disabled>Seleziona il mese</option>
                    {MONTHS.map((label, idx) => (
                      <option key={label} value={idx + 1}>{label}</option>
                    ))}
                  </select>
                )}

                {step === "day" && (
                  <>
                    <input
                      type="number"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      min={1}
                      max={daysInMonth}
                      value={day}
                      onChange={e => {
                        const v = e.target.value;
                        const p = Number(v);
                        setDay(v === "" || Number.isNaN(p) ? "" : p);
                      }}
                      aria-describedby={hintId}
                      aria-invalid={dateError !== null || undefined}
                      required
                    />
                    {dateError && (
                      <span className="birth-wizard__error" role="alert">{dateError}</span>
                    )}
                  </>
                )}

                {step === "hour" && (
                  <input
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    min={0}
                    max={23}
                    value={hour}
                    onChange={e => {
                      const v = e.target.value;
                      const p = Number(v);
                      setHour(v === "" || Number.isNaN(p) ? "" : p);
                    }}
                    aria-describedby={hintId}
                    required
                  />
                )}
              </div>

              <p className="birth-wizard__hint" id={hintId}>
                {step === "day" ? `${hintText} (${monthLabel})` : hintText}
              </p>

              <div className="birth-wizard__actions">
                <button type="button" className="birth-wizard__secondary" onClick={goBack}>
                  {stepIndex === 0 ? "Close" : "Back"}
                </button>
                <button type="submit" className="birth-wizard__primary" disabled={!canContinue}>
                  {isLastStep ? "Confirm data" : "Next"}
                </button>
              </div>

              {step === "hour" && (
                <button type="button" className="birth-wizard__skip" onClick={() => finish(0)}>
                  I don't remember (using 00:00)
                </button>
              )}

              {/* Quick-entry toggle link */}
              <button
                type="button"
                className="birth-wizard__mode-toggle"
                onClick={() => setMode("quick")}
              >
                ⚡ Quick entry (single form)
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
