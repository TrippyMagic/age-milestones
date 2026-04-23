/**
 * src/components/BirthDatePicker.tsx
 * Simple inline birth-date + time selector. No modal, no steps.
 */
import { useBirthDate } from "../context/BirthDateContext";
import { Button, Field } from "../ui";

const CURRENT_YEAR = new Date().getFullYear();

const toDateStr = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const formatSavedBirthDate = (birthDate: Date, birthTime: string) => {
  const formattedDate = birthDate.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  return `${formattedDate} • ${birthTime}`;
};

export default function BirthDatePicker() {
  const { birthDate, setBirthDate, birthTime, setBirthTime, clearBirthDate } = useBirthDate();

  const dateValue = birthDate ? toDateStr(birthDate) : "";
  const today = toDateStr(new Date());
  const summary = birthDate ? formatSavedBirthDate(birthDate, birthTime) : null;

  const handleDate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!val) {
      clearBirthDate();
      return;
    }
    const [y, m, d] = val.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    date.setHours(0, 0, 0, 0);
    if (date <= new Date() && y >= 1900 && y <= CURRENT_YEAR) {
      setBirthDate(date);
    }
  };

  const handleTime = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBirthTime(e.target.value || "00:00");
  };

  return (
    <div className="dob-picker">
      <Field label="Date of birth" htmlFor="dob-date" className="dob-picker__field">
        <input
          id="dob-date"
          type="date"
          className="ui-input"
          max={today}
          min="1900-01-01"
          value={dateValue}
          onChange={handleDate}
          autoComplete="bday"
          aria-describedby={summary ? "dob-picker-summary" : undefined}
        />
      </Field>

      <Field
        label={<>Time <span className="dob-picker__optional">(optional)</span></>}
        htmlFor="dob-time"
        className="dob-picker__field"
      >
        <input
          id="dob-time"
          type="time"
          className="ui-input"
          value={birthTime}
          onChange={handleTime}
          aria-describedby={summary ? "dob-picker-summary" : undefined}
        />
      </Field>

      {summary && (
        <div className="dob-picker__meta" id="dob-picker-summary" role="status" aria-live="polite">
          <p className="dob-picker__summary">Saved birth date: {summary}</p>
          <p className="dob-picker__meta-note">
            This shared picker stays in sync across Landing, Settings, and Milestones.
          </p>
        </div>
      )}

      {birthDate && (
        <div className="dob-picker__actions">
          <Button variant="danger" onClick={clearBirthDate}>
            Clear birth date
          </Button>
        </div>
      )}
    </div>
  );
}

