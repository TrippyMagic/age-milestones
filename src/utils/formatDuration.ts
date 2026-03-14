/**
 * src/utils/formatDuration.ts
 * Human-readable duration formatting and ratio descriptions.
 * Used by the Timescales components.
 */

const MIN  =         60;
const HOUR =       3_600;
const DAY  =      86_400;
const YEAR = 365.25 * DAY;
const KYR  = 1_000   * YEAR;
const MYR  = 1_000   * KYR;
const GYR  = 1_000   * MYR;

/** Format a duration in seconds into the most readable unit. */
export const formatDuration = (s: number): string => {
  const a = Math.abs(s);
  if (a === 0)           return "0 s";
  if (a < 1e-30)         return `${s.toExponential(2)} s`;
  if (a < 1e-12)         return `${(a * 1e15).toPrecision(3)} fs`;     // femtoseconds
  if (a < 1e-9)          return `${(a * 1e12).toPrecision(3)} ps`;     // picoseconds
  if (a < 1e-6)          return `${(a * 1e9).toPrecision(3)} ns`;      // nanoseconds
  if (a < 1e-3)          return `${(a * 1e6).toPrecision(3)} μs`;      // microseconds
  if (a < 1)             return `${(a * 1e3).toPrecision(3)} ms`;      // milliseconds
  if (a < MIN)           return `${a.toPrecision(3)} s`;
  if (a < HOUR)          return `${(a / MIN).toPrecision(3)} min`;
  if (a < DAY)           return `${(a / HOUR).toPrecision(3)} hr`;
  if (a < YEAR)          return `${(a / DAY).toPrecision(3)} days`;
  if (a < KYR)           return `${(a / YEAR).toPrecision(3)} yr`;
  if (a < MYR)           return `${(a / KYR).toPrecision(3)} kyr`;
  if (a < GYR)           return `${(a / MYR).toPrecision(3)} Myr`;
  if (a < GYR * 1_000)   return `${(a / GYR).toPrecision(3)} Gyr`;
  return `${s.toExponential(2)} s`;
};

/**
 * Format a geological time value in millions of years ago (Mya).
 * Examples: 4600 → "4.60 Ga",  252 → "252 Ma",  0.3 → "300 ka",  0 → "Present"
 */
export const formatMya = (mya: number): string => {
  if (mya === 0) return "Present";
  if (mya >= 1000) return `${(mya / 1000).toPrecision(3)} Ga`;
  if (mya >= 1)   return `${mya.toPrecision(3)} Ma`;
  if (mya > 0)    return `${(mya * 1000).toPrecision(3)} ka`;
  return "Present";
};

/**
 * Format a geological duration (startMya − endMya) as a human-readable string.
 * Examples:  600 Mya → "600 Myr",  2.58 Mya → "2.58 Myr"
 */
export const formatMyaDuration = (startMya: number, endMya: number): string => {
  const dur = startMya - endMya;
  if (dur <= 0) return "—";
  if (dur >= 1000) return `${(dur / 1000).toPrecision(3)} Gyr`;
  if (dur >= 1)   return `${dur.toPrecision(3)} Myr`;
  return `${(dur * 1000).toPrecision(3)} kyr`;
};

/**
 * Format a ratio between two durations for human reading.
 * Pass the larger value as `big` and smaller as `small`.
 */
export const formatRatioValue = (big: number, small: number): string => {
  if (small === 0) return "∞";
  const r = big / small;
  if (r < 1_000)     return `${r.toPrecision(3)}×`;
  if (r < 1e6)       return `${(r / 1e3).toPrecision(3)} thousand×`;
  if (r < 1e9)       return `${(r / 1e6).toPrecision(3)} million×`;
  if (r < 1e12)      return `${(r / 1e9).toPrecision(3)} billion×`;
  if (r < 1e15)      return `${(r / 1e12).toPrecision(3)} trillion×`;
  const p = Math.round(Math.log10(r));
  return `10^${p}×`;
};

