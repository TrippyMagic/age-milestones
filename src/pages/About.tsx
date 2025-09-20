import BirthDateWizard from "../components/BirthDateWizard";
import Footer from "../components/common/Footer";
import { Navbar, Title } from "../components/common/Headers";
import { useBirthWizard } from "../hooks/useBirthWizard";

export default function About() {
  const { birthDate, birthTime, isOpen, openWizard, closeWizard, completeWizard } = useBirthWizard();

  return (
    <>
      <Navbar onEditBirthDate={openWizard} />
      <main className="page">
        <Title />
        <section className="section-grid">
          <article className="section-card">
            <h2 className="section-card__title">Our mission</h2>
            <p className="section-card__text">
              Age Milestones is being designed as a calm companion that reframes time. By blending scientific
              references with poetic storytelling we hope to help you feel grounded, inspired, and curious about
              every chapter ahead.
            </p>
          </article>

          <article className="section-card">
            <h2 className="section-card__title">Built with curiosity</h2>
            <p className="section-card__text">
              The project is crafted in Florence by Niccolò Mei Innocenti. This space will later include a short
              bio, credits, and behind-the-scenes notes about the tools used to bring each visualization to life.
            </p>
          </article>

          <article className="section-card">
            <h2 className="section-card__title">What&apos;s coming</h2>
            <p className="section-card__text">
              Expect deep dives on how perspectives are calculated, transparency about data usage, and links to
              further readings. If you have suggestions, the upcoming feedback form will be the best way to reach out.
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
