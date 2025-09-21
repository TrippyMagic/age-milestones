import BirthDateWizard from "../components/BirthDateWizard";
import Footer from "../components/common/Footer";
import { Navbar } from "../components/common/Headers";
import { useBirthWizard } from "../hooks/useBirthWizard";
import { landingIntro } from "../components/unused/constants";

export default function About() {
  const { birthDate, birthTime, isOpen, openWizard, closeWizard, completeWizard } = useBirthWizard();
  const [, ...restParagraphs] = landingIntro.trim().split("<br/><br/>");
  const aboutContent = restParagraphs.length
    ? restParagraphs.join("<br/><br/>")
    : landingIntro.trim();

  return (
    <>
      <Navbar onEditBirthDate={openWizard} />
      <main className="page">
        <section className="card about-card">
          <h2 className="section-card__title">A deeper look</h2>
          <div
            className="about-card__content"
            dangerouslySetInnerHTML={{
              __html: aboutContent,
            }}
          />
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
