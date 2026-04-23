import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
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
import { SectionErrorBoundary } from "../components/SectionErrorBoundary";
import { getAboutSectionHref } from "../utils/aboutLinks";
import { Button, Panel, Tabs, TabsContent, TabsList, TabsTrigger } from "../ui";

const ALL_CATS: PhenomenonCategory[] = [
  "quantum", "biological", "human", "geological", "cosmic",
];

const TAB_LABELS: Record<TimescalesTab, string> = {
  overview:   "Overview",
  comparator: "Compare",
  explorer:   "Explorer",
};

const formatOverviewSummary = (visibleCount: number, activeCategoryCount: number): string => {
  const phenomenonLabel = visibleCount === 1 ? "phenomenon" : "phenomena";
  const categoryLabel = activeCategoryCount === 1 ? "category" : "categories";
  return `${visibleCount} ${phenomenonLabel} shown across ${activeCategoryCount} active ${categoryLabel}.`;
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

  const resetCats = () => setActiveCats(new Set(ALL_CATS));

  const filteredPhenomena = useMemo(
    () => phenomena.filter(phenomenon => activeCats.has(phenomenon.category)),
    [activeCats, phenomena],
  );

  const allCatsSelected = activeCats.size === ALL_CATS.length;
  const overviewSummary = formatOverviewSummary(filteredPhenomena.length, activeCats.size);
  const overviewNote = status === "loading"
    ? "Loading the overview ruler and preparing the visible phenomena list…"
    : status === "error"
    ? `Could not load timescale phenomena${error ? `: ${error}` : "."}`
    : filteredPhenomena.length === 0
    ? "No visible phenomena match the current filters. Reset the categories to rebuild the overview."
    : "Tap or focus any overview marker to pin its details below the ruler — useful on touch devices where hover is unavailable.";

  const handleTabChange = (value: string) => {
    if (value === "overview" || value === "comparator" || value === "explorer") {
      setTimescalesTab(value);
    }
  };

  return (
    <>
      <Navbar />

      <main className="page timescales-page">
        <Tabs value={timescalesTab} onValueChange={handleTabChange}>
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
              <Link to={getAboutSectionHref("timescales")} className="help-link help-link--inline">
                How this view works
              </Link>
            </div>

            <TabsList className="timescales-tabs" aria-label="Timescales sections">
              {(["overview", "comparator", "explorer"] as TimescalesTab[]).map(t => (
                <TabsTrigger key={t} value={t}>
                  {TAB_LABELS[t]}
                </TabsTrigger>
              ))}
            </TabsList>
          </section>

          <TabsContent value="overview" className="card ts-section-card" aria-label="Overview panel">
            <Panel
              className="ts-overview-shell"
              title="Overview ruler"
              description="Scan the full temporal ladder, then narrow the visible categories before drilling into a specific phenomenon."
            >
              <div className="ts-overview-toolbar">
                <div className="ts-overview-toolbar__copy" role="status" aria-live="polite">
                  <p className="ts-overview-toolbar__summary">{overviewSummary}</p>
                  <p className="ts-overview-toolbar__note">{overviewNote}</p>
                </div>

                <div className="ts-overview-toolbar__actions">
                  <span className="ts-overview-toolbar__eyebrow">Visible categories</span>
                  <Button variant="ghost" onClick={resetCats} disabled={allCatsSelected}>
                    Reset filters
                  </Button>
                </div>
              </div>

              <div
                className="timeline__category-filters ts-overview-toolbar__filters"
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
                      style={active ? { background: `${meta.color}24`, borderColor: meta.color } : undefined}
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
            </Panel>

            <SectionErrorBoundary
              title="Overview unavailable"
              message="The overview ruler hit a local rendering problem. Try this section again."
            >
              <TimescaleOverview
                phenomena={phenomena}
                status={status}
                activeCategories={activeCats}
              />
            </SectionErrorBoundary>
          </TabsContent>

          <TabsContent value="comparator" className="card ts-section-card" aria-label="Comparator panel">
            {error && (
              <p className="ts-overview__empty">
                Failed to load phenomena: {error}
              </p>
            )}
            <SectionErrorBoundary
              title="Comparator unavailable"
              message="The comparison panel hit a local rendering problem. Try reloading this section."
            >
              <PhenomenaComparator phenomena={phenomena} status={status} />
            </SectionErrorBoundary>
          </TabsContent>

          <TabsContent value="explorer" className="card ts-section-card" aria-label="Explorer panel">
            <SectionErrorBoundary
              title="Explorer unavailable"
              message="The explorer panel hit a local rendering problem. Try opening it again."
            >
              <GeoCosmicExplorer />
            </SectionErrorBoundary>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </>
  );
}
