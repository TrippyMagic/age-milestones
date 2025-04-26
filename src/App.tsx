import { useState, useEffect } from "react";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import utc from "dayjs/plugin/utc";
import DatePicker from "react-datepicker";
import timezones from "./timezones.tsx";
import "react-datepicker/dist/react-datepicker.css";
import "./App.css";

dayjs.extend(duration);
dayjs.extend(utc);

/* ─────────  CONSTANTS  ───────── */
const units = ["years", "months", "weeks", "days", "hours", "minutes", "seconds"] as const;
type Unit = typeof units[number];

/* ─────────  COMPONENT  ───────── */
export default function App() {
  /* state */
  const [birthDate, setBirthDate] = useState<Date | null>(null);      
  const [birthTime, setBirthTime] = useState<string>("00:00");        
  const [tzOff, setTzOff]         = useState<number>(0);             
  const [amount, setAmount]       = useState<number>(1);
  const [unit, setUnit]           = useState<Unit>("years");
  const [result, setResult]       = useState<string | null>(null);
  const [error, setError]         = useState<string | null>(null);

  useEffect(() => {
    document.body.style.backgroundColor = "#111827"; 
    return () => { document.body.style.backgroundColor = ""; };
  }, []);

  /* helpers */
  const sanitizeAmount = (raw: string) => {
    const n = Math.max(1, parseInt(raw.replace(/^0+/, "") || "0", 10));
    setAmount(n);
  };

  const handleCalculate = () => {
    if (!birthDate) {
      setError("Insert your birth date first! ✋");
      setResult(null);
      return;
    }
    setError(null);

    /* Combina data + ora in stringa ISO, poi applica offset */
    const dateStr = dayjs(birthDate).format("YYYY-MM-DD");
    const dt      = dayjs(`${dateStr}T${birthTime}`).utcOffset(tzOff);

    const target  = dt.add(amount, unit).utcOffset(tzOff);

    setResult(
      `📅 You will be ${amount.toLocaleString()} ${unit} old on:\n` +
      target.format("D MMMM YYYY HH:mm:ss") +
      `  (UTC${tzOff >= 0 ? "+" : ""}${tzOff / 60})`
    );
  };

  /* ─────────  UI  ───────── */
  return (
    <main className="page">
      <h1 className="title">AGE MILESTONES</h1>
      <div className="wrapper">
        {/* ① Date */}
        <section className="card">
          <span className="label">1️⃣ Add your date of birth</span>
          <DatePicker
            selected={birthDate}
            onChange={(d) => setBirthDate(d)}
            dateFormat="dd-MM-yyyy"
            maxDate={new Date()}
            showYearDropdown         
            scrollableYearDropdown    
            yearDropdownItemNumber={120} 
            className="input"
            placeholderText="Type dd-MM-YYYY or pick"
          />
        </section>

        {/* ② Time & TZ */}
        <section className="card">
          <span className="label">2️⃣ Exact time & timezone - (both optional)</span>

          <div className="time-row">
            <label className="muted" htmlFor="time">Time&nbsp;</label>
            <input
              id="time"
              type="time"
              step={60}                            /* 1-min steps */
              value={birthTime}
              onChange={(e) => setBirthTime(e.target.value)}
              className="input"
            />
          </div>

          <div className="timezone-row">
            <label className="muted" htmlFor="tz">TZ&nbsp;</label>
            <select
              id="tz"
              className="select"
              value={tzOff}
              onChange={(e) => setTzOff(Number(e.target.value))}
            >
              {timezones.map(({ off, city }) => (
                <option key={off} value={off * 60}>
                  UTC{off >= 0 ? "+" : ""}{off} — {city}
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* ③ Milestone */}
        <section className="card">
          <span className="label">3️⃣ Set up your milestone</span>
          <p className="muted">I want to know when I will be…</p>

          <div className="milestone-row">
            <input
              type="number"
              min={1}
              value={amount}
              onChange={(e) => sanitizeAmount(e.target.value)}
              className="input short"
            />
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value as Unit)}
              className="select"
            >
              {units.map((u) => (
                <option key={u}>{u}</option>
              ))}
            </select>
            <span className="muted">old</span>
          </div>
        </section>
      </div>

      <button onClick={handleCalculate} className="button">
        Tell me! 🧙‍♂️
      </button>

      {error && <p className="error">{error}</p>}
      {result && !error && (
        <pre className="result">
          {result.split("\n").map((line) => (
            <span key={line}>{line}<br /></span>
          ))}
        </pre>
      )}
    </main>
  );
}
