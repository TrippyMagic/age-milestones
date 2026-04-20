import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import Footer from "../components/common/Footer.tsx";
import BirthDatePicker from "../components/BirthDatePicker";
import { Title } from "../components/common/Headers.tsx";
import { useBirthDate } from "../context/BirthDateContext";

export default function Landing() {
  const nav = useNavigate();
  const { birthDate, birthTime } = useBirthDate();

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

  return (
    <>
      <div className="landing__content">
        <main className="page">
          <Title />
          <section className="card">
            <p className="intro">
              Kronoscope offers a fresh way to <em>interpret</em> time — not just count it.
              It turns abstract counts into concrete waypoints, showing how far you've travelled
              and how vast the road ahead can be.
            </p>
            <hr className="divider" />

            <div className="landing__cta">
              <p className="muted">Enter your date of birth to begin</p>
              <BirthDatePicker />
              {storedSummary && (
                <p className="landing__summary">Current: {storedSummary}</p>
              )}
              <div className="landing__buttons">
                <button
                  className="button"
                  disabled={!birthDate}
                  onClick={() => nav("/milestones")}
                >
                  Explore
                </button>
                <button
                  className="button button--ghost"
                  onClick={() => nav("/personalize")}
                >
                  Personalize
                </button>
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
}
