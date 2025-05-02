import type { UnitRow } from "../components/AgeTable";

const DAY = 86400;
const YEAR = 365.25 * DAY;

export const TAB_ROWS: Record<string, UnitRow[]> = {
  Classic: [
    { label: "Years",    seconds: YEAR },
    { label: "Months",   seconds: YEAR / 12 },
    { label: "Weeks",    seconds: 7 * DAY },
    { label: "Days",     seconds: DAY },
    { label: "Hours",    seconds: 3600 },
    { label: "Minutes",  seconds: 60 },
    { label: "Seconds",  seconds: 1 },
  ],

  Biological: [
    { label: "Heartbeats", seconds: 0.8 },           // ~75 bpm
    { label: "Breaths",    seconds: 4 },             // ~15 rpm
    { label: "Dog years",  seconds: NaN },           // special nonlinear
  ],

  Cosmic: [
    { label: "Lunar cycles",  seconds: 29.530588 * DAY },
    { label: "Martian sols",  seconds: 88775 },
    { label: "Jovian years",  seconds: 11.862615 * YEAR },
    { label: "Halley orbits", seconds: 76 * YEAR },
  ],

  Geeky: [
    { label: "Flicks",   seconds: 1 / 1_417_664 },   // 1/24fps×60×60
    { label: "Jiffies",  seconds: 0.01 },            // 1/100 s
  ],
};
