/**
 * src/components/BirthDatePicker.tsx
 * Simple inline birth-date + time selector. No modal, no steps.
 */
import { useBirthDate } from "../context/BirthDateContext";

const CURRENT_YEAR = new Date().getFullYear();
const TODAY = new Date().toISOString().slice(0, 10);

const toDateStr = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export default function BirthDatePicker() {
  const { birthDate, setBirthDate, birthTime, setBirthTime, clearBirthDate } = useBirthDate();

  const dateValue = birthDate ? toDateStr(birthDate) : "";

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
      <div className="dob-picker__field">
        <label className="dob-picker__label" htmlFor="dob-date">
          Date of birth
        </label>
        <input
          id="dob-date"
          type="date"
          className="dob-picker__input"
          max={TODAY}
          min="1900-01-01"
          value={dateValue}
          onChange={handleDate}
        />
      </div>

      <div className="dob-picker__field">
        <label className="dob-picker__label" htmlFor="dob-time">
          Time <span className="dob-picker__optional">(optional)</span>
        </label>
        <input
          id="dob-time"
          type="time"
          className="dob-picker__input"
          value={birthTime}
          onChange={handleTime}
        />
      </div>

      {birthDate && (
        <div className="dob-picker__actions">
          <button
            type="button"
            className="dob-picker__clear"
            onClick={clearBirthDate}
          >
            Clear birth date
          </button>
        </div>
      )}
    </div>
  );
}

