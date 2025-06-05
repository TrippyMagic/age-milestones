import type { UnitRow } from "../components/AgeTable";

const DAY = 86400;
const YEAR = 365.25 * DAY;

export const TAB_ROWS: Record<string, UnitRow[]> = {
  Classic: [
    { label: "Centuries", seconds: 100 * YEAR },
    { label: "Years",    seconds: YEAR },
    { label: "Months",   seconds: YEAR / 12 },
    { label: "Weeks",    seconds: 7 * DAY },
    { label: "Days",     seconds: DAY },
    { label: "Hours",    seconds: 3600 },
    { label: "Minutes",  seconds: 60 },
    { label: "Seconds",  seconds: 1 },
  ],

  Biological: [
    { label: "Breaths",    seconds: 4 },             // ~15 rpm
    { label: "Blinks",     seconds: 3.5 },           // ~17 blinks/min 
    { label: "Heartbeats", seconds: 0.8 },           // ~75 bpm
    { label: "Dead cells", seconds:  0.00001},   
  ],

  Animals: [
    { label: "Dog years",  seconds: NaN },           // special nonlinear
    {
      label: "Mosquito years",
      seconds: (80 * YEAR) / (14 * DAY),              // 14d lifetime -> 80y human
    },
  ],

  Cosmic: [
    { label: "Halley orbits", seconds: 76 * YEAR },
    { label: "Jovian years",  seconds: 11.862615 * YEAR },
    { label: "Lunar cycles",  seconds: 29.530588 * DAY },
    { label: "Martian sols",  seconds: 88775 },
  ],

  Nerdy: [
    { label: "Bitcoin blocks",  seconds: 600 },
    { label: "Ethereum blocks", seconds: 12 },
    { label: "Eye processed frames",  seconds: 0.022222 },
  ],

  Eons: [
    { label: "Universe age",    seconds: 13.8e9 * YEAR },
    { label: "Earth age",       seconds: 4.54e9 * YEAR },
    { label: "Galactic year",   seconds: 230e6 * YEAR },
    { label: "Homo sapiens",    seconds: 300_000 * YEAR },
  ],
};
