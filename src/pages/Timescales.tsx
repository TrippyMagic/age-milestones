import BirthDateWizard from "../components/BirthDateWizard";
import Footer from "../components/common/Footer";
import { Navbar } from "../components/common/Headers";
import MockCard from "../components/common/MockCard";
import { useBirthWizard } from "../hooks/useBirthWizard";

export default function Timescales() {
  const { birthDate, birthTime, isOpen, openWizard, closeWizard, completeWizard } = useBirthWizard();

  return (
    <>
      <Navbar onEditBirthDate={openWizard} />
      <main className="page">
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
