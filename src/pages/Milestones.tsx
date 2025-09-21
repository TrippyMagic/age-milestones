import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";

import Timeline, { type TimelineEvent, type TimelineTick } from "../components/Timeline";
import AgeTable from "../components/AgeTable";
import Footer from "../components/common/Footer";
import { Title, Navbar } from "../components/common/Headers";
import { useMilestone } from "../hooks/useMilestone";
import { TAB_ROWS } from "../utils/perspectivesConstants";
import "../css/index.css";
import { formatDisplay } from "../utils/format";
import { HowMuchHint } from "../components/common/scaleHint.tsx";
import { inferKindUnit } from "../utils/scaleConstants.ts";
import BirthDateWizard from "../components/BirthDateWizard";
import { useBirthWizard } from "../hooks/useBirthWizard";

const FUTURE_WINDOW_YEARS = 40;
const LOOKBACK_YEARS = 20;
const TICK_STEP_YEARS = 10;

type TimelineData = {
  range: { start: number; end: number };
  events: TimelineEvent[];
  ticks: TimelineTick[];
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

const generateTicks = (start: dayjs.Dayjs, end: dayjs.Dayjs, stepYears: number): TimelineTick[] => {
  if (stepYears <= 0) return [];
  const ticks: TimelineTick[] = [];
  const seen = new Set<number>();
  const pushTick = (instant: dayjs.Dayjs, key: string) => {
    const value = instant.valueOf();
    if (value < start.valueOf() || value > end.valueOf()) return;
    if (seen.has(value)) return;
    seen.add(value);
    ticks.push({ id: `${key}-${value}`, value, label: instant.format("YYYY") });
  };
  pushTick(start, "start");
  const firstYear = Math.ceil(start.year() / stepYears) * stepYears;
  let cursor = dayjs(`${firstYear}-01-01T00:00:00`);
  if (cursor.isBefore(start)) cursor = cursor.add(stepYears, "year");
  while (!cursor.isAfter(end)) {
    pushTick(cursor, "tick");
    cursor = cursor.add(stepYears, "year");
  }
  pushTick(end, "end");
  return ticks.sort((a, b) => a.value - b.value);
};

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

  const ticks = generateTicks(start, end, TICK_STEP_YEARS);

  return {
    range: { start: start.valueOf(), end: end.valueOf() },
    events,
    ticks,
    focus: clamp(now.valueOf(), start.valueOf(), end.valueOf()),
  };
};

export default function Milestones() {
  const { state } = useMilestone();
  const { birthDate, birthTime } = state;
  const { isOpen: wizardOpen, openWizard, closeWizard, completeWizard } = useBirthWizard();
  const [tab, setTab] = useState<keyof typeof TAB_ROWS>("Classic");
  const [focusValue, setFocusValue] = useState(() => dayjs().valueOf());

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

  const renderFocus = useCallback((value: number) => {
    const instant = dayjs(value);
    const now = dayjs();
    const relative = formatRelative(now, instant);
    return (
      <div className="timeline__value-content">
        <span className="timeline__value-label">Slider position</span>
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
        <Title />
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
            <Timeline
              range={timeline.range}
              value={focusValue}
              onChange={setFocusValue}
              events={timeline.events}
              ticks={timeline.ticks}
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
