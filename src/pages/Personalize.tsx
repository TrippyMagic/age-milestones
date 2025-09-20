import BirthDateWizard from "../components/BirthDateWizard";
import Footer from "../components/common/Footer";
import { Navbar, Title } from "../components/common/Headers";
import { useBirthWizard } from "../hooks/useBirthWizard";

export default function Personalize() {
  const { birthDate, birthTime, isOpen, openWizard, closeWizard, completeWizard } = useBirthWizard();

  return (
    <>
      <Navbar onEditBirthDate={openWizard} />
      <main className="page">
        <Title />
        <section className="section-grid">
          <article className="section-card">
            <h2 className="section-card__title">Tailor your journey</h2>
            <p className="section-card__text">
              The personalization hub will let you name milestones, pick iconography, and apply themes that
              reflect your story. Imagine toggles for night mode, typography, and mindful focus modes.
            </p>
          </article>

          <article className="section-card">
            <h2 className="section-card__title">Signature palette</h2>
            <div className="section-card__chips">
              <span className="section-card__chip">Neon dusk</span>
              <span className="section-card__chip">Aurora</span>
              <span className="section-card__chip">Minimal</span>
            </div>
            <p className="section-card__text">
              Themes will adapt backgrounds, gradients, and typographic tone so the experience always feels
              personal.
            </p>
          </article>

          <article className="section-card">
            <h2 className="section-card__title">Focus presets</h2>
            <ul className="section-card__list">
              <li>
                <span className="section-card__bullet" />Career checkpoints
              </li>
              <li>
                <span className="section-card__bullet" />Family and relationships
              </li>
              <li>
                <span className="section-card__bullet" />Health and mindfulness streaks
              </li>
            </ul>
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
