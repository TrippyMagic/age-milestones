import { useCallback, useEffect, useMemo, useState } from "react";
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
import BirthDateWizard from "../components/BirthDateWizard";
import { useBirthWizard } from "../hooks/useBirthWizard";
import { useHistoricalEvents } from "../hooks/useHistoricalEvents";
import { usePreferences } from "../context/PreferencesContext";
import { CATEGORY_META, type EventCategory } from "../types/events";

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

export default function Milestones() {
  const { state } = useMilestone();
  const { birthDate, birthTime } = state;
  const { isOpen: wizardOpen, openWizard, closeWizard, completeWizard } = useBirthWizard();
  const [tab, setTab] = useState<keyof typeof TAB_ROWS>("Classic");
  const [focusValue, setFocusValue] = useState(() => dayjs().valueOf());
  const { events: historicalEvents } = useHistoricalEvents();
  const { activeCategories, toggleCategory } = usePreferences();

  const allTabs = useMemo(() => Object.keys(TAB_ROWS) as Array<keyof typeof TAB_ROWS>, []);
  const safeTab = allTabs.includes(tab) ? tab : "Classic";
  const rows = TAB_ROWS[safeTab];
  const nav = useNavigate();

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

  const perspectiveLabel = safeTab.toLowerCase();

  return (
    <>
      <Navbar onEditBirthDate={openWizard} />
      <main className="page milestones-page">
        <section className="perspective-card">
          <div className="tabs perspective-card__tabs" role="tablist" aria-label="Perspectives">
            {allTabs.map(t => (
              <button
                key={t}
                type="button"
                className={`tab ${t === safeTab ? "tab--active" : ""}`}
                onClick={() => setTab(t)}
                aria-pressed={t === safeTab}
              >
                {t}
              </button>
            ))}
          </div>
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

        {timeline && (
          <section className="card timeline-card">
            <span className="subtitle">Explore your timeline and its upcoming milestones</span>

            {/* ── Historical event category filters ── */}
            <div className="timeline__category-filters" role="group" aria-label="Event categories">
              {CATEGORIES.map(cat => {
                const meta  = CATEGORY_META[cat];
                const active = activeCategories.has(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    className={`timeline__category-filter${active ? " timeline__category-filter--active" : ""}`}
                    onClick={() => toggleCategory(cat)}
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

            <Timeline
              range={timeline.range}
              value={focusValue}
              onChange={setFocusValue}
              events={allEvents}
              renderValue={renderFocus}
            />
          </section>
        )}
      </main>

      <Footer />

      {wizardOpen && (
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
