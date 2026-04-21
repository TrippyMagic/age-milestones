import Footer from "../components/common/Footer";
import { Navbar } from "../components/common/Headers";
import { SectionErrorBoundary } from "../components/SectionErrorBoundary";

export default function About() {
  return (
    <>
      <Navbar />
      <main className="page about-page">
        <SectionErrorBoundary
          title="About content unavailable"
          message="The about page hit a local rendering problem. Try refreshing this section."
        >
          <section className="card about-card">
            <h1 className="section-card__title">What is Kronoscope?</h1>
            <div className="about-card__content">
              <p>
                Kronoscope is an open sandbox for exploring time. Enter your birth date and watch
                your lifetime unfold through dozens of lenses — from familiar years and days to
                heartbeats, cosmic cycles, and geological eons.
              </p>
              <p>
                It's not a calculator. It's a shift in perspective.
              </p>
            </div>
          </section>

          <section className="card about-card">
            <h2 className="section-card__title">Why these numbers aren't precise</h2>
            <div className="about-card__content">
              <p>
                Some metrics — seconds, days, lunar cycles — are deterministic: they follow
                universal physical constants. Others — heartbeats, steps, screen unlocks — are
                <em> estimates</em> based on population averages.
              </p>
              <p>
                Estimates are shown with a <strong>~</strong> prefix and an <strong>≈</strong> badge.
                Hover or tap them to see the plausible range. You can narrow these ranges by
                filling in your personal details on the <strong>Settings</strong> page.
              </p>
              <p>
                This distinction matters. Displaying "2,847,293,847 Heartbeats" suggests a precision
                that doesn't exist. Showing "~2.8B" with a range of "2.2B – 3.7B" is more honest —
                and more interesting.
              </p>
            </div>
          </section>

          <section className="card about-card">
            <h2 className="section-card__title">Six perspectives</h2>
            <div className="about-card__content">
              <p>
                <strong>Classic</strong> — the familiar units: years, months, seconds.<br />
                <strong>Biological</strong> — heartbeats, breaths, the rhythms your body keeps without asking.<br />
                <strong>Everyday</strong> — steps, showers, laughs — small acts that fill a lifetime.<br />
                <strong>Nerdy</strong> — keystrokes, unlocks, blocks mined — your digital footprint.<br />
                <strong>Cosmic</strong> — lunar cycles, Martian years — your life against the cosmos.<br />
                <strong>Eons</strong> — what fraction of the universe's lifetime have you witnessed?
              </p>
              <p>
                Each perspective is a different lens on the same stream of time.
                None is more "real" than another.
              </p>
            </div>
          </section>

          <section className="card about-card">
            <h2 className="section-card__title">The nature of time perception</h2>
            <div className="about-card__content">
              <p>
                We digest time in small, familiar bites: hours, days, birthdays. Stretch those
                slices across a full-length timeline and the raw numbers become hard to grasp,
                even a little unsettling.
              </p>
              <p>
                As Heraclitus observed:{" "}
                <span className="quote">"No man ever steps in the same river twice"</span> and{" "}
                <span className="quote">"The road up and the road down are one and the same."</span>{" "}
                These are more than clever catch-phrases — they are enduring truths about the
                fluid, irreversible nature of time.
              </p>
            </div>
          </section>

          <section className="card about-card">
            <h2 className="section-card__title">Open sandbox</h2>
            <div className="about-card__content">
              <p>
                There is no score, no achievement, no social feed. Kronoscope is a tool for
                quiet exploration. Pan across your timeline, compare cosmic scales, refine your
                estimates with personal data — or simply watch the seconds tick.
              </p>
              <p>
                No sugar-coating, no melodrama. Just a clear shift in perspective and a glimpse
                into the infinite stream of time that carries us all.
              </p>
            </div>
          </section>
        </SectionErrorBoundary>
      </main>
      <Footer />
    </>
  );
}
