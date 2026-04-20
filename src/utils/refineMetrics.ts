/**
 * src/utils/refineMetrics.ts
 * Given a MetricRow and a UserProfile, narrows the estimate range.
 * If the profile has no relevant data, returns the original range unchanged.
 */
import type { UnitRow } from "../components/AgeTable";
import type { UserProfile } from "../context/UserProfileContext";

export type RefinedRange = {
  base: number;   // seconds-per-unit (possibly overridden)
  low: number;    // multiplier
  high: number;   // multiplier
};

/**
 * Refine a metric row's range based on the user profile.
 * Returns the (possibly narrowed) range factors + adjusted base seconds.
 */
export function refineRange(row: UnitRow, profile: UserProfile): RefinedRange {
  const defaultLow  = row.rangeFactor?.low  ?? 1;
  const defaultHigh = row.rangeFactor?.high ?? 1;
  let base = row.seconds;
  let low  = defaultLow;
  let high = defaultHigh;

  const label = row.label;

  // ── Heartbeats ─────────────────────────────────────────
  if (label === "Heartbeats" && profile.restingHeartRate) {
    // Default base assumes 75 bpm → 0.8 s/beat
    // Adjust base to user's resting HR
    base = 60 / profile.restingHeartRate;
    // Narrow range: ±10% around their resting rate
    low  = 0.9;
    high = 1.15; // active HR is higher
  }

  // ── Breaths ────────────────────────────────────────────
  if (label === "Breaths" && profile.restingHeartRate) {
    // Rough correlation: lower HR → lower resp rate
    // Default: 15 rpm → 4 s/breath
    const estimatedRpm = profile.restingHeartRate / 5; // very rough
    base = 60 / estimatedRpm;
    low  = 0.85;
    high = 1.2;
  }

  // ── Steps / Kilometers walked ──────────────────────────
  if ((label === "Steps taken" || label === "Kilometers walked") && profile.activityLevel) {
    const factors: Record<string, { low: number; high: number; baseMul: number }> = {
      sedentary: { low: 0.6, high: 1.0, baseMul: 0.5 },
      moderate:  { low: 0.8, high: 1.3, baseMul: 1.0 },
      active:    { low: 1.0, high: 1.8, baseMul: 1.6 },
    };
    const f = factors[profile.activityLevel];
    if (f) {
      low  = f.low;
      high = f.high;
      // Adjust base: default assumes ~6000 steps/day
      if (label === "Steps taken") {
        const stepsPerDay = 6000 * f.baseMul;
        base = 86400 / stepsPerDay;
      }
    }
  }

  // ── Calories burned ────────────────────────────────────
  if (label === "Calories burned (kcal)" && (profile.weight || profile.activityLevel)) {
    let kcalPerDay = 2100;
    if (profile.weight) {
      // Very rough BMR estimate (Mifflin simplified, unisex average)
      kcalPerDay = 10 * profile.weight + 800;
    }
    if (profile.activityLevel === "sedentary") kcalPerDay *= 0.85;
    if (profile.activityLevel === "active")    kcalPerDay *= 1.25;
    base = 86400 / kcalPerDay;
    low  = 0.85;
    high = 1.15;
  }

  // ── Smartphone unlocks ─────────────────────────────────
  if (label === "Smartphone unlocks" && profile.screenHoursPerDay != null) {
    // More screen time → more unlocks. Default 36/day at ~4h screen
    const ratio = profile.screenHoursPerDay / 4;
    const unlocksPerDay = 36 * Math.max(0.3, ratio);
    base = 86400 / unlocksPerDay;
    low  = 0.7;
    high = 1.3;
  }

  return { base, low, high };
}

