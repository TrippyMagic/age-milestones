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

export default function BirthDateWizard({
  initialDate,
  initialTime,
  onCancel,
  onComplete,
}: BirthDateWizardProps) {
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

  const isYearValid = typeof year === "number" && year >= MIN_YEAR && year <= CURRENT_YEAR;
  const isMonthValid = typeof month === "number" && month >= 1 && month <= 12;
  const isDayValid =
    typeof day === "number" &&
    typeof month === "number" &&
    day >= 1 &&
    day <= daysInMonth;
  const isHourValid = typeof hour === "number" && hour >= 0 && hour <= 23;

  const canContinue = (() => {
    switch (step) {
      case "year":
        return isYearValid;
      case "month":
        return isMonthValid && isYearValid;
      case "day":
        return isDayValid;
      case "hour":
        return isHourValid;
      default:
        return false;
    }
  })();

  const goBack = () => {
    if (stepIndex === 0) {
      onCancel();
    } else {
      setStepIndex(index => index - 1);
    }
  };

  const finish = (finalHour: number) => {
    if (typeof year !== "number" || typeof month !== "number" || typeof day !== "number") {
      return;
    }
    const result = new Date(year, month - 1, day);
    result.setHours(0, 0, 0, 0);
    const safeHour = Number.isFinite(finalHour) ? finalHour : 0;
    const normalizedHour = Math.min(Math.max(safeHour, 0), 23);
    const time = `${normalizedHour.toString().padStart(2, "0")}:00`;
    onComplete(result, time);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canContinue) return;
    if (isLastStep && typeof hour === "number") {
      finish(hour);
      return;
    }
    setStepIndex(index => Math.min(index + 1, STEPS.length - 1));
  };

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
    const summaryDate = hasFullDate
      ? new Date(year, month - 1, day).toLocaleDateString(undefined, {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })
      : "—";
    return [
      { label: "Year", value: typeof year === "number" ? `${year}` : "—" },
      { label: "Month", value: summaryMonth },
      { label: "Day", value: summaryDay },
      { label: "Time", value: summaryHour },
      { label: "Complete date", value: summaryDate },
    ];
  }, [day, hour, month, year]);

  return (
    <div className="birth-wizard" role="dialog" aria-modal="true" aria-labelledby={questionId}>
      <form className="birth-wizard__panel" aria-describedby={hintId} onSubmit={handleSubmit}>
        <header className="birth-wizard__header">
          <p className="birth-wizard__step">Step {stepIndex + 1} of {STEPS.length}</p>
          <h2 className="birth-wizard__question" id={questionId}>
            {step === "year" && "What year were you born?"}
            {step === "month" && "What month?"}
            {step === "day" && "What day?"}
            {step === "hour" && "What time?"}
          </h2>
          <p className="birth-wizard__description">{STEP_DESCRIPTIONS[step]}</p>
        </header>

        <div className="birth-wizard__grid">
          <aside className="birth-wizard__aside" aria-hidden="true">
            <div className="birth-wizard__progress">
              {STEPS.map((key, index) => (
                <div
                  key={key}
                  className={`birth-wizard__progress-step ${
                    index < stepIndex
                      ? "birth-wizard__progress-step--done"
                      : index === stepIndex
                      ? "birth-wizard__progress-step--active"
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
                  <div className="birth-wizard__summary-item" key={item.label}>
                    <dt>{item.label}</dt>
                    <dd>{item.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </aside>

          <div className="birth-wizard__content">
            <div className="birth-wizard__field">
              {step === "year" && (
                <input
                  type="number"
                  inputMode="numeric"
                  min={MIN_YEAR}
                  max={CURRENT_YEAR}
                  value={year}
                  onChange={event => {
                    const value = event.target.value;
                    const parsed = Number(value);
                    setYear(value === "" || Number.isNaN(parsed) ? "" : parsed);
                  }}
                  aria-describedby={hintId}
                  required
                />
              )}

              {step === "month" && (
                <select
                  value={month === "" ? "" : month}
                  onChange={event => {
                    const value = event.target.value;
                    setMonth(value === "" ? "" : Number(value));
                  }}
                  aria-describedby={hintId}
                  required
                >
                  <option value="" disabled>
                    Seleziona il mese
                  </option>
                  {MONTHS.map((label, index) => (
                    <option key={label} value={index + 1}>
                      {label}
                    </option>
                  ))}
                </select>
              )}

              {step === "day" && (
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={daysInMonth}
                  value={day}
                  onChange={event => {
                    const value = event.target.value;
                    const parsed = Number(value);
                    setDay(value === "" || Number.isNaN(parsed) ? "" : parsed);
                  }}
                  aria-describedby={hintId}
                  required
                />
              )}

              {step === "hour" && (
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={23}
                  value={hour}
                  onChange={event => {
                    const value = event.target.value;
                    const parsed = Number(value);
                    setHour(value === "" || Number.isNaN(parsed) ? "" : parsed);
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
              <button
                type="button"
                className="birth-wizard__skip"
                onClick={() => finish(0)}
              >
                I dont remember (using 00:00)
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
