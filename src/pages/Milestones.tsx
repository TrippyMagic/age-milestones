import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import dayjs from "dayjs";

import Timeline, { type TimelineEvent } from "../components/Timeline";
import AgeTable from "../components/AgeTable";
import Footer from "../components/common/Footer";
import { Navbar } from "../components/common/Headers";
import { useMilestone } from "../hooks/useMilestone";
import { TAB_ROWS } from "../utils/perspectivesConstants";
import { useHistoricalEvents } from "../hooks/useHistoricalEvents";
import { useProjectedEvents } from "../hooks/useProjectedEvents";
import { usePreferences } from "../context/PreferencesContext";
import { CATEGORY_META, type EventCategory } from "../types/events";
import { Timeline3DWrapper } from "../components/3d/Timeline3DWrapper";
import { WEB_GL_SUPPORTED } from "../utils/webgl";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { LANE_META, type TimelineLane } from "../components/timeline/types";
import { SectionErrorBoundary } from "../components/SectionErrorBoundary";
import { getAboutSectionHref } from "../utils/aboutLinks";
import { resolveGlobalLaneNotice } from "../utils/globalLaneNotice";
import { Banner, Button, FormActions, Tabs, TabsContent, TabsList, TabsTrigger } from "../ui";
import {
  resolveTimeline3DAvailability,
  resolveTimeline3DToggleState,
} from "../components/3d/runtimePolicy";

const FUTURE_WINDOW_YEARS = 40;
const LOOKBACK_YEARS = 20;

type TimelineData = {
  range: { start: number; end: number };
  events: TimelineEvent[];
  focus: number;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const getTemporalStatus = (value: number, nowValue: number): TimelineEvent["temporalStatus"] => {
  if (Math.abs(value - nowValue) < 1_000) return "present";
  return value > nowValue ? "future" : "past";
};

const formatRelative = (now: dayjs.Dayjs, target: dayjs.Dayjs) => {
  if (target.isSame(now, "day")) return "Today";
  const diffYears = target.diff(now, "year", true);
  const years = Math.abs(diffYears);
  if (years >= 1) {
    const value = years >= 10 ? Math.round(years) : years.toFixed(1);
    return diffYears >= 0 ? `In ${value} years` : `${value} years ago`;
  }
  const diffMonths = target.diff(now, "month", true);
  const months = Math.abs(diffMonths);
  if (months >= 1) {
    const value = months >= 10 ? Math.round(months) : months.toFixed(1);
    return diffMonths >= 0 ? `In ${value} months` : `${value} months ago`;
  }
  const diffDays = target.startOf("day").diff(now.startOf("day"), "day");
  if (diffDays === 0) return target.isAfter(now) ? "Later today" : "Earlier today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  return diffDays > 0 ? `In ${diffDays} days` : `${Math.abs(diffDays)} days ago`;
};

const formatWithWeekday = (instant: dayjs.Dayjs, withTime = false) =>
  instant.format(withTime ? "ddd, MMM D, YYYY HH:mm" : "ddd, MMM D, YYYY");

const buildTimelineData = (birthDate: Date, birthTime: string): TimelineData | null => {
  const base = dayjs(`${dayjs(birthDate).format("YYYY-MM-DD")}T${birthTime}`);
  if (!base.isValid()) return null;
  const now = dayjs();
  const midpointValue = base.valueOf() + (now.valueOf() - base.valueOf()) / 2;
  const midpoint = dayjs(midpointValue);
  const start = base.subtract(LOOKBACK_YEARS, "year");
  let end = midpoint.add(FUTURE_WINDOW_YEARS, "year");
  if (!end.isAfter(start)) end = start.add(FUTURE_WINDOW_YEARS * 2, "year");

  const tenThousandDays = base.add(10_000, "day");
  const fiveHundredMonth = base.add(500, "month");
  const billionSeconds = base.add(1_000_000_000, "second");
  const nowValue = now.valueOf();

  const events: TimelineEvent[] = [
    {
      id: "birth",
      label: "Birth",
      subLabel: formatWithWeekday(base),
      value: base.valueOf(),
      placement: "above",
      accent: "highlight",
      lane: "personal",
      semanticKind: "personal",
      temporalStatus: getTemporalStatus(base.valueOf(), nowValue),
    },
    {
      id: "midpoint",
      label: "Midpoint",
      subLabel: formatWithWeekday(midpoint),
      value: midpoint.valueOf(),
      placement: "above",
      accent: "muted",
      lane: "personal",
      semanticKind: "personal",
      temporalStatus: getTemporalStatus(midpoint.valueOf(), nowValue),
    },
    {
      id: "today",
      label: "Today",
      subLabel: formatWithWeekday(now),
      value: nowValue,
      placement: "below",
      markerShape: "triangle",
      accent: "highlight",
      lane: "personal",
      semanticKind: "personal",
      temporalStatus: "present",
    },
    {
      id: "10kdays",
      label: "10,000 days old",
      subLabel: formatWithWeekday(tenThousandDays),
      value: tenThousandDays.valueOf(),
      placement: "below",
      lane: "personal",
      semanticKind: "personal",
      temporalStatus: getTemporalStatus(tenThousandDays.valueOf(), nowValue),
      accent: "default",
    },
    {
      id: "1Bseconds",
      label: "1 billion seconds old",
      subLabel: formatWithWeekday(billionSeconds, true),
      value: billionSeconds.valueOf(),
      placement: "above",
      lane: "personal",
      semanticKind: "personal",
      temporalStatus: getTemporalStatus(billionSeconds.valueOf(), nowValue),
      accent: "default",
    },
    {
      id: "500months",
      label: "500 months old",
      subLabel: formatWithWeekday(fiveHundredMonth, true),
      value: fiveHundredMonth.valueOf(),
      placement: "above",
      lane: "personal",
      semanticKind: "personal",
      temporalStatus: getTemporalStatus(fiveHundredMonth.valueOf(), nowValue),
      accent: "default",
    },
  ];

  return {
    range: { start: start.valueOf(), end: end.valueOf() },
    events,
    focus: clamp(now.valueOf(), start.valueOf(), end.valueOf()),
  };
};

const LS_UNLOCKED = "pref_unlockedPerspectives";
const ALWAYS_UNLOCKED = "Classic";

const TAB_TEASERS: Record<string, string> = {
  Biological: "Heartbeats, breaths, and the rhythms your body keeps without asking.",
  Everyday:   "Steps, showers, laughs — the small acts that fill a lifetime.",
  Nerdy:      "Keystrokes, unlocks, blocks mined — your digital footprint in numbers.",
  Cosmic:     "Lunar cycles, Martian years — your life measured against the cosmos.",
  Eons:       "How much of the universe's lifetime have you witnessed?",
};

export default function Milestones() {
  const { state } = useMilestone();
  const { birthDate, birthTime } = state;
  const nav = useNavigate();
  const [tab, setTab] = useState<keyof typeof TAB_ROWS>("Classic");
  const [focusValue, setFocusValue] = useState(() => dayjs().valueOf());
  const {
    events: historicalEvents,
    status: historicalStatus,
    error: historicalError,
  } = useHistoricalEvents();
  const {
    events: projectedEvents,
    status: projectedStatus,
    error: projectedError,
  } = useProjectedEvents();
  const {
    activeCategories,
    toggleCategory,
    show3D,
    setShow3D,
    visibleTimelineLanes,
    toggleTimelineLane,
  } = usePreferences();
  /** Perspectives panel: always open on desktop, toggle on mobile */
  const isDesktop = useMediaQuery("(min-width:720px)");
  const [perspMobileOpen, setPerspMobileOpen] = useState(false);
  const perspOpen = isDesktop || perspMobileOpen;

  const allTabs = useMemo(() => Object.keys(TAB_ROWS) as Array<keyof typeof TAB_ROWS>, []);
  const safeTab = allTabs.includes(tab) ? tab : "Classic";

  useEffect(() => {
    document.body.style.backgroundColor = "#111827";
    return () => {
      document.body.style.backgroundColor = "";
    };
  }, []);

  const timeline = useMemo(
    () => (birthDate ? buildTimelineData(birthDate, birthTime) : null),
    [birthDate, birthTime],
  );
  useEffect(() => {
    if (timeline) setFocusValue(timeline.focus);
  }, [timeline]);

  /** Merge personal + filtered global events */
  const allEvents = useMemo<TimelineEvent[]>(() => {
    if (!timeline) return [];
    const { range, events: personal } = timeline;

    const historical: TimelineEvent[] = historicalEvents
      .filter(e =>
        activeCategories.has(e.category) &&
        e.timestamp >= range.start &&
        e.timestamp <= range.end
      )
      .map(e => ({
        id: `hist-${e.id}`,
        label: e.label,
        value: e.timestamp,
        subLabel: e.description,
        placement: e.placement ?? "above",
        accent: "muted" as const,
        color: CATEGORY_META[e.category].color,
        lane: "global" as const,
        category: e.category,
        semanticKind: "event" as const,
        temporalStatus: "past" as const,
      }));

    const projections: TimelineEvent[] = projectedEvents
      .filter(e =>
        activeCategories.has(e.category) &&
        e.timestamp >= range.start &&
        e.timestamp <= range.end
      )
      .map(e => ({
        id: `proj-${e.id}`,
        label: e.label,
        value: e.timestamp,
        subLabel: e.description,
        placement: e.placement ?? "above",
        accent: "default" as const,
        color: CATEGORY_META[e.category].color,
        lane: "global" as const,
        category: e.category,
        semanticKind: "projection" as const,
        temporalStatus: "future" as const,
        projectionType: e.projectionType,
        certainty: e.certainty,
      }));

    const merged = [...personal, ...historical, ...projections];
    return merged.filter(event => visibleTimelineLanes.has(event.lane ?? "personal"));
  }, [timeline, historicalEvents, projectedEvents, activeCategories, visibleTimelineLanes]);

  const CATEGORIES = Object.keys(CATEGORY_META) as EventCategory[];
  const LANE_KEYS = Object.keys(LANE_META) as TimelineLane[];
  const timeline3DAvailability = useMemo(() => resolveTimeline3DAvailability(WEB_GL_SUPPORTED), []);
  const timeline3DToggle = useMemo(
    () => resolveTimeline3DToggleState({
      availability: timeline3DAvailability,
      show3D,
    }),
    [show3D, timeline3DAvailability],
  );
  const visibleGlobalItems = allEvents.filter(event => (event.lane ?? "personal") === "global");
  const noTimelineItems = allEvents.length === 0;
  const noGlobalItems = visibleGlobalItems.length === 0;
  const globalLaneNotice = resolveGlobalLaneNotice({
    historicalStatus,
    projectedStatus,
    noGlobalItems,
  });
  const globalLaneError = [historicalError, projectedError].filter(Boolean).join(" • ");

  const renderFocus = useCallback((value: number) => {
    const instant = dayjs(value);
    const now = dayjs();
    const relative = formatRelative(now, instant);
    return (
      <div className="timeline__value-content">
        <span className="timeline__value-primary">{formatWithWeekday(instant)}</span>
        <span className="timeline__value-secondary">{relative}</span>
      </div>
    );
  }, []);

  /** Micro-onboarding: progressive disclosure for perspectives */
  const [unlockedTabs, setUnlockedTabs] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(LS_UNLOCKED);
      if (raw) return new Set<string>([ALWAYS_UNLOCKED, ...JSON.parse(raw)]);
    } catch { /* noop */ }
    return new Set<string>([ALWAYS_UNLOCKED]);
  });
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const unlockTab = useCallback((t: string) => {
    setUnlockedTabs(prev => {
      const next = new Set(prev);
      next.add(t);
      try { localStorage.setItem(LS_UNLOCKED, JSON.stringify([...next].filter(k => k !== ALWAYS_UNLOCKED))); } catch { /* noop */ }
      return next;
    });
    const teaser = TAB_TEASERS[t];
    if (teaser) {
      setToastMsg(`${t} unlocked — ${teaser}`);
      if (toastTimer.current) clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setToastMsg(null), 3500);
    }
  }, []);

  const handleTabClick = useCallback((t: keyof typeof TAB_ROWS) => {
    if (!unlockedTabs.has(t)) unlockTab(t);
    setTab(t);
  }, [unlockedTabs, unlockTab]);

  const handlePerspectiveTabChange = useCallback((value: string) => {
    if (!allTabs.includes(value as keyof typeof TAB_ROWS)) return;
    handleTabClick(value as keyof typeof TAB_ROWS);
  }, [allTabs, handleTabClick]);

  return (
    <>
      <Navbar />
      <main className="page milestones-page">

        {!birthDate && (
          <section className="card timeline-card">
            <Banner tone="danger" role="alert" aria-live="assertive" title="Birth date required">
              <p>
                Milestones depends on your date of birth. Set it in Settings before exploring the timeline or age perspectives.
              </p>
              <FormActions>
                <Button onClick={() => nav("/settings")}>Open Settings</Button>
                <Button variant="ghost" onClick={() => nav("/")}>Go home</Button>
              </FormActions>
            </Banner>
          </section>
        )}

        {/* ── Collapsible perspectives panel ── */}
        {birthDate && <div className="perspectives-panel">
          {/* Toggle shown only on mobile (CSS hides on ≥720px) */}
          <button
            type="button"
            className="perspectives-panel__toggle"
            onClick={() => setPerspMobileOpen(v => !v)}
            aria-expanded={perspOpen}
          >
            <span>Age Perspectives</span>
            <span className="perspectives-panel__chevron" aria-hidden="true">
              {perspOpen ? "▲" : "▼"}
            </span>
          </button>

          {perspOpen && (
            <section className="perspective-card">
              <Tabs value={safeTab} onValueChange={handlePerspectiveTabChange} activationMode="manual">
                <TabsList className="perspective-card__tabs" aria-label="Perspectives">
                  {allTabs.map(t => {
                    const isLocked = !unlockedTabs.has(t);
                    return (
                      <TabsTrigger
                        key={t}
                        value={t}
                        className="perspective-card__tab-trigger"
                        data-locked={isLocked ? "true" : undefined}
                        title={isLocked ? "Click to unlock this perspective" : undefined}
                      >
                        {isLocked && <span className="ui-tabs__lock" aria-hidden="true">🔒</span>}
                        {t}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
              
                {/* Micro-onboarding toast */}
                {toastMsg && (
                  <div className="perspective-card__toast" role="status" aria-live="polite">
                    {toastMsg}
                  </div>
                )}

                {/* Micro-hint when only Classic is unlocked */}
                {unlockedTabs.size === 1 && unlockedTabs.has(ALWAYS_UNLOCKED) && !toastMsg && (
                  <p className="perspective-card__hint">
                    Tap a locked tab to discover new perspectives
                  </p>
                )}

                {allTabs.map(t => (
                  <TabsContent key={t} value={t} className="perspective-card__content">
                    <div className="perspective-card__body">
                      <h2 className="perspective-card__title">
                        Your age in{" "}
                        <span className="perspective-card__title-accent">{t.toLowerCase()}</span>{" "}
                        perspective
                      </h2>
                      <p className="perspective-card__subtitle">
                        Switch the lens to reveal how your lifetime translates across different units.
                      </p>
                      <Link to={getAboutSectionHref("general")} className="help-link help-link--inline">
                        How estimates and perspectives work
                      </Link>
                      <div className="perspective-card__table">
                        <SectionErrorBoundary
                          compact
                          title="Perspective unavailable"
                          message="This perspective failed to render. Try switching tabs or reload the section."
                        >
                          <AgeTable rows={TAB_ROWS[t]} />
                        </SectionErrorBoundary>
                      </div>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </section>
          )}
        </div>}

        {birthDate && timeline && (
          <section className="card timeline-card">
            <div className="timeline__section-header">
              <div className="timeline__section-copy">
                <h2 className="timeline__section-title">Time map</h2>
                <p className="timeline__section-description">
                  Pan across your personal lane and the wider global lane. Pinch or Ctrl+scroll to zoom.
                </p>
                <Link to={getAboutSectionHref("timeline")} className="help-link help-link--inline">
                  How the time map works
                </Link>
              </div>

              <button
                type="button"
                className={`timeline__experimental-btn${show3D ? " timeline__experimental-btn--active" : ""}`}
                onClick={() => setShow3D(!show3D)}
                disabled={timeline3DToggle.disabled}
                title={timeline3DToggle.title}
              >
                <span aria-hidden="true">🌐</span>
                {timeline3DToggle.label}
              </button>
            </div>

            {!show3D && (
              <p className="timeline__surface-note">
                Personal markers stay separate from world events, global references, and future projections.
              </p>
            )}

            {/* ── Historical event category filters (only in 2D mode) ── */}
            {!show3D && (
              <div className="timeline__filter-stack">
                <div className="timeline__filter-section">
                  <span className="timeline__filter-section__label">Filter global events</span>
                  <div className="timeline__category-filters" role="group" aria-label="Event categories">
                    {CATEGORIES.map(cat => {
                      const meta = CATEGORY_META[cat];
                      const active = activeCategories.has(cat);
                      return (
                        <button
                          key={cat}
                          type="button"
                          className={`timeline__category-filter${active ? " timeline__category-filter--active" : ""}`}
                          onClick={() => toggleCategory(cat)}
                          aria-pressed={active}
                          style={active ? { background: `${meta.color}33`, borderColor: meta.color } : undefined}
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
                </div>

                <div className="timeline__filter-section">
                  <span className="timeline__filter-section__label">Visible lanes</span>
                  <div className="timeline__category-filters" role="group" aria-label="Timeline lanes">
                    {LANE_KEYS.map(lane => {
                      const active = visibleTimelineLanes.has(lane);
                      return (
                        <button
                          key={lane}
                          type="button"
                          className={`timeline__category-filter${active ? " timeline__category-filter--active" : ""}`}
                          onClick={() => toggleTimelineLane(lane)}
                          aria-pressed={active}
                        >
                          {LANE_META[lane].label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ── Timeline (2D or 3D) ── */}
            {show3D ? (
              <SectionErrorBoundary
                title="Experimental 3D scene unavailable"
                message="The experimental 3D scene hit a problem. Return to the standard time map and try again."
                actionLabel="Return to time map"
                onAction={() => setShow3D(false)}
              >
                <Timeline3DWrapper
                  events={allEvents}
                  range={timeline.range}
                  focusValue={focusValue}
                  onExitTo2D={() => setShow3D(false)}
                />
              </SectionErrorBoundary>
            ) : (
              <>
                {noTimelineItems ? (
                  <div className="timeline__empty-state" role="status" aria-live="polite">
                    <h3 className="timeline__empty-title">Nothing to show right now</h3>
                    <p className="timeline__empty-text">
                      Re-enable at least one lane to rebuild the time map.
                    </p>
                  </div>
                ) : (
                  <SectionErrorBoundary
                    title="Timeline unavailable"
                    message="The time map hit a local rendering problem. Reset the section and try again."
                    actionLabel="Reset section"
                    onAction={() => setFocusValue(timeline.focus)}
                  >
                    <Timeline
                      range={timeline.range}
                      value={focusValue}
                      onChange={setFocusValue}
                      events={allEvents}
                      renderValue={renderFocus}
                    />
                  </SectionErrorBoundary>
                )}

                {noGlobalItems && !noTimelineItems && visibleTimelineLanes.has("global") && globalLaneNotice === "loading" && (
                  <div className="timeline__surface-note" role="status" aria-live="polite">
                    Loading global events and projections for the world lane…
                  </div>
                )}

                {noGlobalItems && !noTimelineItems && visibleTimelineLanes.has("global") && globalLaneNotice === "error" && (
                  <div className="timeline__surface-note timeline__surface-note--warning" role="status" aria-live="polite">
                    Global items could not be loaded right now{globalLaneError ? `: ${globalLaneError}` : "."}
                  </div>
                )}

                {noGlobalItems && !noTimelineItems && visibleTimelineLanes.has("global") && globalLaneNotice === "empty" && (
                  <div className="timeline__surface-note timeline__surface-note--warning" role="status">
                    No global items match the current filters or visible time window. Re-enable categories or pan the time map to bring the world lane back.
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {!timeline && birthDate && (
          <section className="card timeline-card">
            <div className="timeline__empty-state" role="status" aria-live="polite">
              <h3 className="timeline__empty-title">Time map unavailable</h3>
              <p className="timeline__empty-text">
                Your saved birth date could not be converted into a valid timeline range. Update it in Settings and try again.
              </p>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </>
  );
}
