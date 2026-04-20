import type { UnitRow } from "../components/AgeTable";

const DAY = 86400;
const YEAR = 365.25 * DAY;

const est = (label: string, seconds: number, low: number, high: number, personalizable = false): UnitRow => ({
  label, seconds, type: "estimate", rangeFactor: { low, high }, personalizable,
});

export const TAB_ROWS: Record<string, UnitRow[]> = {
  Classic: [
    { label: "Years", seconds: YEAR },
    { label: "Months", seconds: YEAR / 12 },
    { label: "Weeks", seconds: 7 * DAY },
    { label: "Days", seconds: DAY },
    { label: "Hours", seconds: 3600 },
    { label: "Minutes", seconds: 60 },
    { label: "Seconds", seconds: 1 },
    { label: "Nanoseconds", seconds: 0.000000001 },
  ],

  Biological: [
    est("Breaths",                    4,           0.75, 1.33, true),   // 12–20 rpm
    est("Air inhaled (Liters)",       8.64,        0.75, 1.33),
    est("Blinks",                     3.5,         0.7,  1.5),         // 15–20/min
    est("Heartbeats",                 0.8,         0.8,  1.33, true),  // 60–100 bpm
    est("Blood pumped (Liters)",      12,          0.8,  1.25),
    est("Dead and replaced cells",    0.0000099,   0.7,  1.4),
    est("Liquid drank (Liters)",      DAY / 2.25,  0.7,  1.5),
    est("Food eaten (kilograms)",     DAY / 1.2,   0.6,  1.5),
    est("Calories burned (kcal)",     DAY / 2100,  0.7,  1.4, true),
    est("Hair grown (cm)",            2010000,     0.8,  1.3),
    est("Nail grown (cm)",            8640000,     0.8,  1.3),
    est("Toilet visits",              DAY / 5,     0.5,  1.6),
    est("Dog years",                  NaN,         0.9,  1.1),
  ],

  Everyday: [
    est("Steps taken",      DAY / 6000,   0.5,  2.0, true),   // 3k–12k/day
    est("Kilometers walked", DAY / 4,     0.5,  2.0, true),
    est("Showers",          DAY / 0.55,   0.5,  1.8),
    est("Songs played",     DAY / 20,     0.3,  2.5),
    est("Words spoken",     DAY / 11000,  0.5,  2.0),
    est("Curses spoken",    DAY / 40,     0.2,  3.0),
    est("Laughs",           DAY / 13,     0.5,  2.0),
    est("Sneezes",          DAY / 0.5,    0.3,  2.0),
    est("Yawns",            DAY / 7.2,    0.5,  1.5),
  ],

  Nerdy: [
    est("Smartphone unlocks",          DAY / 36,    0.3, 2.5, true),
    est("Photos taken",                DAY / 12.5,  0.2, 3.0),
    est("Videos taken",                DAY / 0.3,   0.2, 3.0),
    est("Keystrokes",                  DAY / 12000, 0.3, 2.5),
    est("Mouse clicks",               DAY / 4000,  0.3, 2.5),
    est("Notifications",              DAY / 100,   0.3, 2.5),
    est("Gigabytes downloaded",        DAY / 8,     0.3, 3.0),
    est("Gigabytes uploaded",          DAY / 0.75,  0.3, 3.0),
    { label: "Mined Bitcoin blocks",   seconds: 600 },
    { label: "Chained Ethereum blocks", seconds: 12 },
    est("Eye processed frames",        0.022222,    0.8, 1.2),
  ],

  Cosmic: [
    { label: "Sun equatorial rotations",    seconds: 24.5 * DAY },
    { label: "Lunar cycles",                seconds: 29.530588 * DAY },
    { label: "Venus days",                  seconds: 243 * DAY },
    { label: "Venus years",                 seconds: 225 * DAY },
    { label: "Martian days",                seconds: 88775 },
    { label: "Martian years",               seconds: 687 * DAY },
    { label: "Jovian days",                 seconds: 35700 },
    { label: "Jovian years",                seconds: 11.862615 * YEAR },
    { label: "Halley comet orbits",         seconds: 76 * YEAR },
    { label: "Kms in equatorial rotations", seconds: 1 / 0.4651 },
    { label: "Kms in solar orbit",          seconds: 1 / 29.78 },
    { label: "Kms in galactic motion",      seconds: 1 / 220 },
    { label: "Kms in Local Group motion ",  seconds: 1 / 620 },
  ],

  Eons: [
    { label: "Universe age portion",   seconds: 13.9e9 * YEAR,  displayMode: "fraction" as const },
    { label: "Earth age portion",      seconds: 4.54e9 * YEAR,  displayMode: "fraction" as const },
    { label: "Life on Earth portion",  seconds: 3.7e9 * YEAR,   displayMode: "fraction" as const },
    { label: "Complex life portion",   seconds: 650e6 * YEAR,   displayMode: "fraction" as const },
    { label: "Galactic year portion",  seconds: 230e6 * YEAR,   displayMode: "fraction" as const },
    { label: "Fire controlled portion",seconds: 1.5e6 * YEAR,   displayMode: "fraction" as const },
    { label: "Homo sapiens portion",   seconds: 300_000 * YEAR, displayMode: "fraction" as const },
    { label: "Written history portion",seconds: 5200 * YEAR,    displayMode: "fraction" as const },
  ],
};
