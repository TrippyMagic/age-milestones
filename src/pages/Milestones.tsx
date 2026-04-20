import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";

import Timeline, { type TimelineEvent } from "../components/Timeline";
import AgeTable from "../components/AgeTable";
import Footer from "../components/common/Footer";
import { Navbar } from "../components/common/Headers";
import { useMilestone } from "../hooks/useMilestone";
import { TAB_ROWS } from "../utils/perspectivesConstants";
import { formatDisplay } from "../utils/format";
import { HowMuchHint } from "../components/common/scaleHint.tsx";
import { inferKindUnit } from "../utils/scaleConstants.ts";
import { useHistoricalEvents } from "../hooks/useHistoricalEvents";
import { usePreferences } from "../context/PreferencesContext";
import { CATEGORY_META, type EventCategory } from "../types/events";
import { Timeline3DWrapper } from "../components/3d/Timeline3DWrapper";
import { WEB_GL_SUPPORTED } from "../utils/webgl";
import { useMediaQuery } from "../hooks/useMediaQuery";

const FUTURE_WINDOW_YEARS = 40;
const LOOKBACK_YEARS = 20;

type TimelineData = {
  range: { start: number; end: number };
  events: TimelineEvent[];
  focus: number;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

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

  const events: TimelineEvent[] = [
    { id: "birth", label: "Birth", subLabel: formatWithWeekday(base), value: base.valueOf(), placement: "above", accent: "highlight" },
    { id: "midpoint", label: "Midpoint", subLabel: formatWithWeekday(midpoint), value: midpoint.valueOf(), placement: "above", accent: "muted" },
    { id: "today", label: "Today", subLabel: formatWithWeekday(now), value: now.valueOf(), placement: "below", markerShape: "triangle", accent: "highlight" },
    { id: "10kdays", label: "10,000 days old", subLabel: formatWithWeekday(tenThousandDays), value: tenThousandDays.valueOf(), placement: "below" },
    { id: "1Bseconds", label: "1 billion seconds old", subLabel: formatWithWeekday(billionSeconds, true), value: billionSeconds.valueOf(), placement: "above" },
    { id: "500months", label: "500 months old", subLabel: formatWithWeekday(fiveHundredMonth, true), value: fiveHundredMonth.valueOf(), placement: "above" },
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
  const { events: historicalEvents } = useHistoricalEvents();
  const { activeCategories, toggleCategory, show3D, setShow3D } = usePreferences();
  /** Perspectives panel: always open on desktop, toggle on mobile */
  const isDesktop = useMediaQuery("(min-width:720px)");
  const [perspMobileOpen, setPerspMobileOpen] = useState(false);
  const perspOpen = isDesktop || perspMobileOpen;

  const allTabs = useMemo(() => Object.keys(TAB_ROWS) as Array<keyof typeof TAB_ROWS>, []);
  const safeTab = allTabs.includes(tab) ? tab : "Classic";
  const rows = TAB_ROWS[safeTab];

  useEffect(() => {
    if (!birthDate) nav("/");
  }, [birthDate, nav]);
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

  /** Merge personal + filtered historical events */
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
      }));

    return [...personal, ...historical];
  }, [timeline, historicalEvents, activeCategories]);

  const CATEGORIES = Object.keys(CATEGORY_META) as EventCategory[];

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

  const renderNumber = useCallback((value: number, label: string) => {
    const { kind, unit, disableOverlay } = inferKindUnit(label);
    return (
      <span className="inline-flex items-center">
        <span>{formatDisplay(value)}</span>
        <HowMuchHint value={value} unit={unit} kind={kind} disabled={disableOverlay} />
      </span>
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

  const perspectiveLabel = safeTab.toLowerCase();

  return (
    <>
      <Navbar onEditBirthDate={() => nav("/personalize")} />
      <main className="page milestones-page">

        {/* ── Collapsible perspectives panel ── */}
        <div className="perspectives-panel">
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
              <div className="tabs perspective-card__tabs" role="tablist" aria-label="Perspectives">
                {allTabs.map(t => {
                  const isLocked = !unlockedTabs.has(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      className={`tab ${t === safeTab ? "tab--active" : ""} ${isLocked ? "tab--locked" : ""}`}
                      onClick={() => handleTabClick(t)}
                      aria-pressed={t === safeTab}
                      title={isLocked ? "Click to unlock this perspective" : undefined}
                    >
                      {isLocked && <span className="tab__lock" aria-hidden="true">🔒</span>}
                      {t}
                    </button>
                  );
                })}
              </div>
              
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

              <div className="perspective-card__body">
                <h2 className="perspective-card__title">
                  Your age in{" "}
                  <span className="perspective-card__title-accent">{perspectiveLabel}</span>{" "}
                  perspective
                </h2>
                <p className="perspective-card__subtitle">
                  Switch the lens to reveal how your lifetime translates across different units.
                </p>
                <div className="perspective-card__table">
                  <AgeTable rows={rows} renderNumber={renderNumber} />
                </div>
              </div>
            </section>
          )}
        </div>

        {timeline && (
          <section className="card timeline-card">
            {/* ── Section header + 3D toggle ── */}
            <div className="timeline-3d__toggle-row">
              <span className="subtitle">
                Explore your timeline and its upcoming milestones
              </span>
              <button
                type="button"
                className={`timeline-3d__toggle-btn${show3D ? " timeline-3d__toggle-btn--active" : ""}`}
                onClick={() => setShow3D(!show3D)}
                disabled={!WEB_GL_SUPPORTED}
                title={
                  !WEB_GL_SUPPORTED
                    ? "WebGL is not supported in this browser"
                    : show3D
                    ? "Switch back to 2D"
                    : "Switch to 3D view"
                }
              >
                <span aria-hidden="true">🌐</span>
                {show3D ? "2D" : "3D"}
              </button>
            </div>

            {/* ── Historical event category filters (only in 2D mode) ── */}
            {!show3D && (
              <div className="timeline__filter-section">
                <span className="timeline__filter-section__label">Filter events</span>
                <div className="timeline__category-filters" role="group" aria-label="Event categories">
                  {CATEGORIES.map(cat => {
                    const meta   = CATEGORY_META[cat];
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
            )}

            {/* ── Timeline (2D or 3D) ── */}
            {show3D ? (
              <Timeline3DWrapper
                events={allEvents}
                range={timeline.range}
                focusValue={focusValue}
                onExitTo2D={() => setShow3D(false)}
              />
            ) : (
              <Timeline
                range={timeline.range}
                value={focusValue}
                onChange={setFocusValue}
                events={allEvents}
                renderValue={renderFocus}
              />
            )}
          </section>
        )}
      </main>

      <Footer />
    </>
  );
}
