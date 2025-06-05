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
        <label className="muted" htmlFor="date">Choose your date of birth (required)</label>
        <div>
          <DatePicker
            selected={birthDate}
            onChange={(d) => d && setBirthDate(d)}
            dateFormat="dd-MM-yyyy"
            maxDate={new Date()}
            showYearDropdown
            scrollableYearDropdown
            yearDropdownItemNumber={120}
            className="input"
            placeholderText="Type dd-MM-yyyy or pick"
          />
        </div>
        <label className="muted" htmlFor="time">Time (optional)&nbsp;</label>
        <div className="time-row">
          <input
            id="time"
            type="time"
            step={60}
            value={birthTime}
            onChange={(e) => setBirthTime(e.target.value)}
            className="input"
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
