import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";

import Timeline, { type TimelineEvent, type TimelineTick } from "../components/Timeline";
import AgeTable from "../components/AgeTable";
import Footer from "../components/common/Footer.tsx";
import { Title, Navbar } from "../components/common/Headers.tsx";
import { useMilestone } from "../hooks/useMilestone";
import { TAB_ROWS } from "../utils/otherTimeUnitsConst";

import "../css/index.css";

const CENTURY_WINDOW = 40;
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
  const start = midpoint.subtract(CENTURY_WINDOW, "year");
  const end = midpoint.add(CENTURY_WINDOW, "year");

  const tenThousandDays = base.add(10_000, "day");
  const billionSeconds = base.add(1_000_000_000, "second");

  const events: TimelineEvent[] = [
    { id: "birth", label: "Birth", subLabel: base.format("MMM D, YYYY"), value: base.valueOf(), placement: "above" },
    { id: "midpoint", label: "Midpoint", subLabel: midpoint.format("MMM D, YYYY"), value: midpoint.valueOf(), placement: "above", accent: "muted" },
    { id: "today", label: "Today", subLabel: now.format("MMM D, YYYY"), value: now.valueOf(), placement: "below", markerShape: "triangle", accent: "highlight" },
    { id: "tenk", label: "10,000 days old", subLabel: tenThousandDays.format("MMM D, YYYY"), value: tenThousandDays.valueOf(), placement: "below" },
    { id: "billion", label: "1B seconds old", subLabel: billionSeconds.format("MMM D, YYYY HH:mm"), value: billionSeconds.valueOf(), placement: "above" }
  ];

  const ticks = generateTicks(start, end, TICK_STEP_YEARS);

  return {
    range: { start: start.valueOf(), end: end.valueOf() },
    events,
    ticks,
    focus: clamp(now.valueOf(), start.valueOf(), end.valueOf())
  };
};

export default function Milestones() {
  const { state } = useMilestone();
  const {  birthDate, birthTime } = state;
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

  const timeline = useMemo(() => (birthDate ? buildTimelineData(birthDate, birthTime) : null), [birthDate, birthTime]);

  useEffect(() => {
    if (timeline) setFocusValue(timeline.focus);
  }, [timeline]);

  const renderFocus = useCallback((value: number) => {
    const instant = dayjs(value);
    const now = dayjs();
    const relative = formatRelative(now, instant);

    return (
      <div className="timeline__value-content">
        <span className="timeline__value-label">Focus date</span>
        <span className="timeline__value-primary">{instant.format("MMM D, YYYY")}</span>
        <span className="timeline__value-secondary">{relative}</span>
      </div>
    );
  }, []);

  return (
    <>
      <main className="page">
        <Title/>
        <Navbar/>
        <div className="tabs">
          {allTabs.map(t => (
            <button
              key={t}
              className={`tab ${t === safeTab ? "tab--active" : ""}`}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="table-wrap">
          <h2 className="subtitle">Your age in {safeTab.toLocaleLowerCase()} perspective</h2>
          <AgeTable rows={rows} />
        </div>

        {timeline && (
          <section className="card timeline-card">
            <span className="label">Explore your timeline</span>
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
    </>
  );
}
