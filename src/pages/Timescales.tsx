import BirthDateWizard from "../components/BirthDateWizard";
import Footer from "../components/common/Footer";
import { Navbar, Title } from "../components/common/Headers";
import { useBirthWizard } from "../hooks/useBirthWizard";

export default function Timescales() {
  const { birthDate, birthTime, isOpen, openWizard, closeWizard, completeWizard } = useBirthWizard();

  return (
    <>
      <Navbar onEditBirthDate={openWizard} />
      <main className="page">
        <Title />
        <section className="section-grid">
          <article className="section-card">
            <h2 className="section-card__title">Layered timescales</h2>
            <p className="section-card__text">
              Preview how your life aligns with cosmic, cultural, and biological clocks. Each block will
              become an interactive lens that recalculates your milestones on the fly.
            </p>
            <ul className="section-card__list">
              <li>
                <span className="section-card__bullet" />Solar cycles and equinox rhythms
              </li>
              <li>
                <span className="section-card__bullet" />Planetary orbits compared side by side
              </li>
              <li>
                <span className="section-card__bullet" />Meaningful anniversaries auto-detected
              </li>
            </ul>
          </article>

          <article className="section-card">
            <h2 className="section-card__title">Timeline preview</h2>
            <div className="section-card__preview">Interactive mock timeline</div>
            <p className="section-card__text">
              Drag through decades, zoom into months, and reveal hidden events generated from your birth data.
              Tooltips and contextual hints will help make sense of every tick.
            </p>
            <div className="section-card__chips">
              <span className="section-card__chip">Daily</span>
              <span className="section-card__chip">Seasonal</span>
              <span className="section-card__chip">Deep time</span>
            </div>
          </article>

          <article className="section-card">
            <h2 className="section-card__title">What&apos;s next</h2>
            <p className="section-card__text">
              This area will soon host widgets that let you bookmark key checkpoints, compare them with friends,
              and export custom countdowns.
            </p>
          </article>
        </section>
      </main>
      <Footer />

      {isOpen && (
        <BirthDateWizard
          initialDate={birthDate}
          initialTime={birthTime}
          onCancel={closeWizard}
          onComplete={completeWizard}
        />
      )}
    </>
  );
}
