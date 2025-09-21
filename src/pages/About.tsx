import BirthDateWizard from "../components/BirthDateWizard";
import Footer from "../components/common/Footer";
import { Navbar, Title } from "../components/common/Headers";
import MockCard from "../components/common/MockCard";
import { useBirthWizard } from "../hooks/useBirthWizard";

export default function About() {
  const { birthDate, birthTime, isOpen, openWizard, closeWizard, completeWizard } = useBirthWizard();

  return (
    <>
      <Navbar onEditBirthDate={openWizard} />
      <main className="page">
        <Title />
        <section className="section-grid">
          <MockCard />
          <MockCard />
          <MockCard />
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
