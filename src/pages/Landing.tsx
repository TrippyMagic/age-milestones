import { useEffect, useMemo, useState } from "react";
import { useBirthDate } from "../context/BirthDateContext";
import { useNavigate } from "react-router-dom";
import { landingIntro } from "../utils/constants";
import Footer from "../components/Footer";
import BirthDateWizard from "../components/BirthDateWizard";

export default function Landing() {
  const { birthDate, setBirthDate, birthTime, setBirthTime } = useBirthDate();
  const nav = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [firstParagraph, ...restParagraphs] = landingIntro
    .trim()
    .split("<br/><br/>");
  const remainder = restParagraphs.join("<br/><br/>");
  const storedSummary = useMemo(() => {
    if (!birthDate) return null;
    const [hour = "00"] = birthTime.split(":");
    const formatted = birthDate.toLocaleDateString(undefined, {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
    return `${formatted} • ${hour.padStart(2, "0")}:00`;
  }, [birthDate, birthTime]);

  useEffect(() => {
    if (!wizardOpen) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [wizardOpen]);

  const handleComplete = (date: Date, time: string) => {
    setBirthDate(date);
    setBirthTime(time);
    setWizardOpen(false);
    nav("/milestones");
  };

  return (
    <>
      <div className={`landing__content ${wizardOpen ? "landing__content--blurred" : ""}`}>
        <main className="page">
          <h1 className="title">AGE MILESTONES</h1>

          <section className="card">
            <div
              className="intro"
              dangerouslySetInnerHTML={{
                __html: expanded ? `${firstParagraph}<br/><br/>${remainder}` : firstParagraph,
              }}
            />
            <button className="button more-btn" onClick={() => setExpanded(!expanded)}>
              Learn more
            </button>
            <hr className="divider" />
            <div className="landing__cta">
              <p className="muted">
                Rispondi a quattro domande per impostare la tua data di nascita.
              </p>
              {storedSummary && (
                <p className="landing__summary">Ultima selezione: {storedSummary}</p>
              )}
              <button className="button" onClick={() => setWizardOpen(true)}>
                Dive in!
              </button>
            </div>
          </section>
        </main>
        <Footer />
      </div>

      {wizardOpen && (
        <BirthDateWizard
          initialDate={birthDate}
          initialTime={birthTime}
          onCancel={() => setWizardOpen(false)}
          onComplete={handleComplete}
        />
      )}
    </>
  );
}
