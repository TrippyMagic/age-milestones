import { useEffect, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";

import Footer from "../components/common/Footer";
import { Navbar } from "../components/common/Headers";
import { SectionErrorBoundary } from "../components/SectionErrorBoundary";
import {
  ABOUT_SECTION_LABELS,
  ABOUT_SECTION_ORDER,
  getAboutSectionHref,
  isAboutSectionId,
  type AboutSectionId,
} from "../utils/aboutLinks";

const FAQ_SECTIONS: Array<{
  id: AboutSectionId;
  eyebrow: string;
  title: string;
  intro: string;
  items: Array<{ question: string; answer: ReactNode }>;
  actions: Array<{ label: string; to: string }>;
}> = [
  {
    id: "general",
    eyebrow: "FAQ 01",
    title: "General concept",
    intro: "Kronoscope is designed as a readable guide to the system, not as lore. Start here if you want the core idea before diving into the timeline or timescales tools.",
    items: [
      {
        question: "What is Kronoscope actually for?",
        answer: (
          <p>
            Kronoscope is a sandbox for exploring time through multiple lenses. It turns your birth date
            into a starting point, then lets you inspect your life as ordinary durations, estimated body
            rhythms, world events, and cosmic scales.
          </p>
        ),
      },
      {
        question: "Why do some numbers use ~ and ≈ instead of exact values?",
        answer: (
          <p>
            Because not every metric is equally knowable. Seconds and days are deterministic. Heartbeats,
            steps, screen time, and similar figures are estimates based on typical ranges. Kronoscope marks
            those values explicitly so the app stays honest about uncertainty.
          </p>
        ),
      },
      {
        question: "Does Kronoscope gamify my life?",
        answer: (
          <p>
            No. There are no scores, unlock trees, streaks, or social mechanics. The goal is perspective,
            not optimization. The product is meant to stay calm, explanatory, and exploratory.
          </p>
        ),
      },
    ],
    actions: [
      { label: "Open home", to: "/" },
      { label: "Jump to timeline FAQ", to: getAboutSectionHref("timeline") },
    ],
  },
  {
    id: "timeline",
    eyebrow: "FAQ 02",
    title: "Timeline system",
    intro: "The Milestones page is built as a two-lane time map. This section explains what the timeline is showing and why future items are treated differently from past events.",
    items: [
      {
        question: "How does the time map work?",
        answer: (
          <p>
            The timeline shares one zoomable viewport across two lanes: <strong>Personal</strong> for your
            own anchor points, and <strong>Global</strong> for historical events, references, and future
            projections. You can pan, pinch, or use Ctrl + scroll to move across the range.
          </p>
        ),
      },
      {
        question: "Why are future projections not shown like past events?",
        answer: (
          <p>
            Because the future is not settled evidence. Kronoscope separates past events from future
            projections semantically and visually so the timeline does not imply the same level of certainty
            for both.
          </p>
        ),
      },
      {
        question: "What are the age perspectives above the timeline?",
        answer: (
          <p>
            They are alternate measurement systems for the same elapsed lifetime. Classic stays grounded in
            familiar units, while the other perspectives translate the same span into biological, everyday,
            digital, cosmic, or deep-time frames.
          </p>
        ),
      },
    ],
    actions: [
      { label: "Open Milestones", to: "/milestones" },
      { label: "Jump to Settings FAQ", to: getAboutSectionHref("settings") },
    ],
  },
  {
    id: "timescales",
    eyebrow: "FAQ 03",
    title: "Timescales system",
    intro: "Timescales answers a different question from Milestones: instead of centering your life, it compares phenomena across the full range from quantum events to cosmic futures.",
    items: [
      {
        question: "What is the difference between Milestones and Timescales?",
        answer: (
          <p>
            Milestones uses your birth date as the anchor. Timescales does not. It is a standalone explorer
            for comparing durations across science, biology, human activity, geology, and cosmology.
          </p>
        ),
      },
      {
        question: "What do the Overview, Compare, and Explorer tabs do?",
        answer: (
          <p>
            <strong>Overview</strong> lays phenomena out on a shared ruler, <strong>Compare</strong> lets you
            inspect two durations side by side, and <strong>Explorer</strong> is the drill-down surface for
            moving between categories and scales more freely.
          </p>
        ),
      },
      {
        question: "Why are categories filterable?",
        answer: (
          <p>
            The dataset spans radically different domains. Filters let you reduce noise and compare only the
            regions of time that matter to the question you are asking.
          </p>
        ),
      },
    ],
    actions: [
      { label: "Open Timescales", to: "/timescales" },
      { label: "Jump to general FAQ", to: getAboutSectionHref("general") },
    ],
  },
  {
    id: "settings",
    eyebrow: "FAQ 04",
    title: "Settings system",
    intro: "Settings is the single source of truth for your birth date and optional personal metrics. This section explains why Kronoscope centralizes those values and how they affect estimates.",
    items: [
      {
        question: "Why is my birth date managed only in Settings?",
        answer: (
          <p>
            Centralizing DOB avoids conflicting entry points and makes the rules easier to understand.
            Milestones, timeline ranges, and many age-based estimates depend on that single value, so it is
            treated as primary configuration rather than an inline shortcut.
          </p>
        ),
      },
      {
        question: "Do optional profile fields replace estimates with exact data?",
        answer: (
          <p>
            No. They refine ranges; they do not turn uncertain metrics into facts. For example, a resting
            heart rate can tighten the heartbeat estimate, but Kronoscope still treats it as a personal range
            rather than a mathematically exact lifetime total.
          </p>
        ),
      },
      {
        question: "Why do I see red and yellow warnings in Settings?",
        answer: (
          <p>
            Red warnings mean the system is missing your birth date, which blocks DOB-dependent views.
            Yellow warnings mean the app can still work, but your estimated metrics will stay less personal
            until you add more optional details.
          </p>
        ),
      },
    ],
    actions: [
      { label: "Open Settings", to: "/settings" },
      { label: "Jump to timescales FAQ", to: getAboutSectionHref("timescales") },
    ],
  },
];

export default function About() {
  const location = useLocation();
  const activeHash = decodeURIComponent(location.hash.replace(/^#/, "").trim());

  useEffect(() => {
    if (!activeHash) {
      window.scrollTo({ top: 0, behavior: "auto" });
      return;
    }

    if (!isAboutSectionId(activeHash)) return;

    const frame = window.requestAnimationFrame(() => {
      const target = document.getElementById(activeHash);
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [activeHash]);

  return (
    <>
      <Navbar />
      <main className="page about-page">
        <SectionErrorBoundary
          title="About content unavailable"
          message="The about page hit a local rendering problem. Try refreshing this section."
        >
          <section className="card about-card about-card--hero">
            <p className="about-faq__eyebrow">How Kronoscope works</p>
            <h1 className="section-card__title about-faq__hero-title">Usage guide &amp; FAQ</h1>
            <div className="about-card__content about-card__content--hero">
              <p>
                This page explains the product in practical terms: what the timeline means, how estimates
                work, why Settings matters, and how the Timescales view differs from Milestones.
              </p>
              <p>
                Use the section links below to jump straight to the part you need.
              </p>
            </div>

            <nav className="about-faq__nav" aria-label="About sections">
              {ABOUT_SECTION_ORDER.map((sectionId, index) => {
                const sectionHref = getAboutSectionHref(sectionId);
                const isActive = activeHash === sectionId;
                return (
                  <Link
                    key={sectionId}
                    to={sectionHref}
                    className={`about-faq__nav-link${isActive ? " about-faq__nav-link--active" : ""}`}
                  >
                    <span className="about-faq__nav-index" aria-hidden="true">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span>{ABOUT_SECTION_LABELS[sectionId]}</span>
                  </Link>
                );
              })}
            </nav>
          </section>

          {FAQ_SECTIONS.map(section => (
            <section
              key={section.id}
              id={section.id}
              className="card about-card about-faq__section"
              aria-labelledby={`${section.id}-title`}
              tabIndex={-1}
            >
              <div className="about-faq__section-header">
                <p className="about-faq__eyebrow">{section.eyebrow}</p>
                <h2 id={`${section.id}-title`} className="section-card__title about-faq__section-title">
                  {section.title}
                </h2>
                <p className="about-faq__intro">{section.intro}</p>
              </div>

              <div className="about-faq__items">
                {section.items.map(item => (
                  <article key={item.question} className="about-faq__item">
                    <h3 className="about-faq__question">{item.question}</h3>
                    <div className="about-faq__answer">{item.answer}</div>
                  </article>
                ))}
              </div>

              <div className="about-faq__actions">
                {section.actions.map(action => (
                  <Link key={action.label} to={action.to} className="help-link help-link--card">
                    {action.label}
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </SectionErrorBoundary>
      </main>
      <Footer />
    </>
  );
}
