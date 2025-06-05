import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useState } from "react";
import { useBirthDate } from "../context/BirthDateContext";
import { useNavigate } from "react-router-dom";
import { landingIntro } from "../utils/constants";
import Footer from "../components/Footer";

export default function Landing() {
  const { birthDate, setBirthDate, birthTime, setBirthTime } = useBirthDate();
  const nav = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [firstParagraph, ...restParagraphs] = landingIntro
    .trim()
    .split("<br/><br/>");
  const remainder = restParagraphs.join("<br/><br/>");

  const selectedDT = (() => {
    if (!birthDate) return null;
    const [h, m] = birthTime.split(":").map(Number);
    const dt = new Date(birthDate);
    dt.setHours(h);
    dt.setMinutes(m);
    dt.setSeconds(0);
    dt.setMilliseconds(0);
    return dt;
  })();

  const handleChange = (d: Date | null) => {
    if (d) {
      setBirthDate(d);
      setBirthTime(d.toTimeString().slice(0, 5));
    }
  };

  return (
    <>
      <main className="page">
      <h1 className="title">AGE MILESTONES</h1>

      <section className="card">
         {/* ---------- intro panel ---------- */}
         <div
            className="intro"
            dangerouslySetInnerHTML={{
              __html: expanded ? `${firstParagraph}<br/><br/>${remainder}` : firstParagraph,
            }}
          />
         <button className="button more-btn" onClick={() => setExpanded(!expanded)}>
           Learn more
         </button>
        {/* ---------- divider ---------- */}
        <hr className="divider" />
        <label className="muted" htmlFor="date">Choose your date and time</label>
        <div>
          <DatePicker
            selected={selectedDT}
            onChange={handleChange}
            dateFormat="dd-MM-yyyy HH:mm"
            maxDate={new Date()}
            showTimeSelect
            timeIntervals={60}
            showYearDropdown
            scrollableYearDropdown
            yearDropdownItemNumber={120}
            className="input datetime"
            placeholderText="Pick a date and time"
          />
        </div>

        <button
          className="button"
          disabled={!birthDate}
          onClick={() => nav("/milestones")}
        >
          Dive in!
        </button>
      </section>
    </main>
    <Footer/>
    </>
  );
}
