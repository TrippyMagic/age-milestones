import { useState } from "react";
import Footer from "../components/common/Footer";
import { Navbar } from "../components/common/Headers";
import { usePreferences } from "../context/PreferencesContext";
import { useTimescalePhenomena } from "../hooks/useTimescalePhenomena";
import { TimescaleOverview } from "../components/timescales/TimescaleOverview";
import { PhenomenaComparator } from "../components/timescales/PhenomenaComparator";
import { GeoCosmicExplorer } from "../components/timescales/GeoCosmicExplorer";
import type { PhenomenonCategory } from "../types/phenomena";
import { PHENOMENON_CATEGORY_META } from "../types/phenomena";
import type { TimescalesTab } from "../context/PreferencesContext";

const ALL_CATS: PhenomenonCategory[] = [
  "quantum", "biological", "human", "geological", "cosmic",
];

const TAB_LABELS: Record<TimescalesTab, string> = {
  overview:   "Overview",
  comparator: "Compare",
  explorer:   "Explorer",
};

export default function Timescales() {
  const { timescalesTab, setTimescalesTab } = usePreferences();
  const { phenomena, status, error }        = useTimescalePhenomena();

  // Category filter — local state for the Overview tab
  const [activeCats, setActiveCats] = useState<Set<PhenomenonCategory>>(
    () => new Set(ALL_CATS),
  );
  const toggleCat = (cat: PhenomenonCategory) =>
    setActiveCats(prev => {
      const next = new Set(prev);
      if (next.has(cat) && next.size > 1) next.delete(cat);
      else next.add(cat);
      return next;
    });

  return (
    <>
      <Navbar />

      <main className="page timescales-page">
        {/* ── Header card with tabs ── */}
        <section className="perspective-card">
          <div className="perspective-card__body">
            <h1 className="perspective-card__title">
              Explore{" "}
              <span className="perspective-card__title-accent">Timescales</span>
            </h1>
            <p className="perspective-card__subtitle">
              From the Planck time to the heat death of the universe —
              every phenomenon in perspective.
            </p>
          </div>

          <div className="tabs timescales-tabs" role="tablist" aria-label="Timescales sections">
            {(["overview", "comparator", "explorer"] as TimescalesTab[]).map(t => (
              <button
                key={t}
                type="button"
                className={`tab${timescalesTab === t ? " tab--active" : ""}`}
                onClick={() => setTimescalesTab(t)}
                role="tab"
                aria-selected={timescalesTab === t}
              >
                {TAB_LABELS[t]}
              </button>
            ))}
          </div>
        </section>

        {/* ── Overview tab ── */}
        {timescalesTab === "overview" && (
          <section
            className="card ts-section-card"
            role="tabpanel"
            aria-label="Overview panel"
          >
            {/* Category filters */}
            <div
              className="timeline__category-filters"
              role="group"
              aria-label="Phenomenon categories"
            >
              {ALL_CATS.map(cat => {
                const meta   = PHENOMENON_CATEGORY_META[cat];
                const active = activeCats.has(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    className={`timeline__category-filter${active ? " timeline__category-filter--active" : ""}`}
                    onClick={() => toggleCat(cat)}
                    aria-pressed={active}
                  >
                    <span
                      className="timeline__category-filter__dot"
                      style={{ background: meta.color }}
                      aria-hidden="true"
                    />
                    {meta.label}
                  </button>
                );
              })}
            </div>

            <TimescaleOverview
              phenomena={phenomena}
              status={status}
              activeCategories={activeCats}
            />
          </section>
        )}

        {/* ── Comparator tab ── */}
        {timescalesTab === "comparator" && (
          <section
            className="card ts-section-card"
            role="tabpanel"
            aria-label="Comparator panel"
          >
            {error && (
              <p className="ts-overview__empty">
                Failed to load phenomena: {error}
              </p>
            )}
            <PhenomenaComparator phenomena={phenomena} status={status} />
          </section>
        )}

        {/* ── Explorer tab ── */}
        {timescalesTab === "explorer" && (
          <section
            className="card ts-section-card"
            role="tabpanel"
            aria-label="Explorer panel"
          >
            <GeoCosmicExplorer />
          </section>
        )}
      </main>

      <Footer />
    </>
  );
}
