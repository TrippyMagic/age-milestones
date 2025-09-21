import type { UnitRow } from "../components/AgeTable";

const DAY = 86400;
const YEAR = 365.25 * DAY;
// { label: "", seconds: DAY },

export const TAB_ROWS: Record<string, UnitRow[]> = {
  Classic: [
    { label: "Years", seconds: YEAR },
    { label: "Months", seconds: YEAR / 12 },
    { label: "Weeks", seconds: 7 * DAY },
    { label: "Days", seconds: DAY },
    { label: "Hours", seconds: 3600 },
    { label: "Minutes", seconds: 60 },
    { label: "Seconds", seconds: 1 },
    { label: "Nanoseconds", seconds: 0.000000001}
  ],

  Biological: [
    { label: "Breaths", seconds: 4 },             // ~15 rpm
    { label: "Air inhaled (Liters)", seconds: 8.64 },
    { label: "Blinks",seconds: 3.5 },           // ~17 blinks/min
    { label: "Heartbeats", seconds: 0.8 },           // ~75 bpm
    { label: "Blood pumped (Liters)", seconds: 12 },        // ~7200 L/day
    { label: "Dead and replaced cells", seconds: 0.0000099},
    { label: "Liquid drank (Liters)", seconds: DAY/2.25},
    { label: "Food eaten (kilograms)", seconds: DAY/1.2},
    { label: "Calories burned (kcal)", seconds: DAY / 2100 },
    { label: "Hair grown (cm)", seconds: 2010000 },    // ~0.43 mm/day
    { label: "Nail grown (cm)", seconds: 8640000 },    // ~0.1 mm/day
    { label: "Toilet visits", seconds: DAY / 5 },
    { label: "Dog years",  seconds: NaN },
  ],

   Everyday: [
    { label: "Steps taken", seconds: DAY / 6000 },
    { label: "Kilometers walked", seconds: DAY / 4 },
    { label: "Showers", seconds: DAY / 0.55 },
    { label: "Songs played", seconds: DAY / 20 },
    { label: "Words spoken", seconds: DAY / 11000 },
    { label: "Curses spoken", seconds: DAY / 40},
    { label: "Laughs", seconds: DAY / 13 },
    { label: "Sneezes", seconds: DAY / 0.5 },
    { label: "Yawns", seconds: DAY / 7.2},
  ],

  Nerdy: [
    { label: "Smartphone unlocks",seconds: DAY / 36 },
    { label: "Photos taken", seconds: DAY / 12.5 },
    { label: "Videos taken", seconds: DAY / 0.3 },
    { label: "Keystrokes", seconds: DAY / 12000 },
    { label: "Mouse clicks", seconds: DAY / 4000 },
    { label: "Notifications", seconds: DAY / 100 },
    { label: "Gigabytes downloaded", seconds: DAY / 8},
    { label: "Gigabytes uploaded", seconds: DAY / 0.75 },
    { label: "Mined Bitcoin blocks",  seconds: 600 },
    { label: "Chained Ethereum blocks", seconds: 12 },
    { label: "Eye processed frames", seconds: 0.022222 },
  ],

  Cosmic: [
    { label: "Sun equatorial rotations", seconds: 24.5 * DAY},
    { label: "Lunar cycles",  seconds: 29.530588 * DAY },
    { label: "Venus days", seconds: 243 * DAY},
    { label: "Venus years", seconds: 225 * DAY},
    { label: "Martian days",  seconds: 88775 },
    { label: "Martian years", seconds: 687 * DAY},
    { label: "Jovian days", seconds: 35700},
    { label: "Jovian years",  seconds: 11.862615 * YEAR },
    { label: "Halley comet orbits", seconds: 76 * YEAR },
    { label: "Kms in equatorial rotations", seconds: 1 / 0.4651 }, // ≈2.150 s/km
    { label: "Kms in solar orbit", seconds: 1 / 29.78 },  // ~0.0336 s/km
    { label: "Kms in galactic motion", seconds: 1 / 220 },    // ~0.00455 s/km
    { label: "Kms in Local Group motion ", seconds: 1 / 620 },   // ≈ 0.00161 s/km
  ],

  Eons: [
    { label: "Universe age portion", seconds: 13.9e9 * YEAR },
    { label: "Earth age portion", seconds: 4.54e9 * YEAR },
    { label: "Life on Earth portion", seconds: 3.7e9 * YEAR},
    { label: "Complex life portion", seconds: 650e6 * YEAR},
    { label: "Galactic year portion", seconds: 230e6 * YEAR },
    { label: "Fire controlled portion", seconds: 1.5e6 * YEAR},
    { label: "Homo sapiens portion", seconds: 300_000 * YEAR },
    { label: "Written history portion", seconds: 5200 * YEAR}
  ],
};
