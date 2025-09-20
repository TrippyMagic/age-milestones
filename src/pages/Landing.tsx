import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { landingIntro } from "../components/unused/constants.ts";
import Footer from "../components/common/Footer.tsx";
import BirthDateWizard from "../components/BirthDateWizard";
import { Title } from "../components/common/Headers.tsx";
import { useBirthWizard } from "../hooks/useBirthWizard";

export default function Landing() {
  const nav = useNavigate();
  const { birthDate, birthTime, isOpen: wizardOpen, openWizard, closeWizard, completeWizard } =
    useBirthWizard();
  const [expanded, setExpanded] = useState(false);
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

  const handleComplete = useCallback(
    (date: Date, time: string) => {
      completeWizard(date, time);
      nav("/milestones");
    },
    [completeWizard, nav],
  );

  return (
    <>
      <div className={`landing__content ${wizardOpen ? "landing__content--blurred" : ""}`}>
        <main className="page">
          <Title />
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
              <p className="muted">Set up your date of birth here</p>
              {storedSummary && <p className="landing__summary">Last selection: {storedSummary}</p>}
              <div className="landing__buttons">
                <button className="button" onClick={openWizard}>
                  Dive in!
                </button>
                {storedSummary && (
                  <button className="button button--ghost" onClick={() => nav("/milestones")}>
                    Use saved details
                  </button>
                )}
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </div>

      {wizardOpen && (
        <BirthDateWizard
          initialDate={birthDate}
          initialTime={birthTime}
          onCancel={closeWizard}
          onComplete={handleComplete}
        />
      )}
    </>
  );
}
