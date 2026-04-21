import { describe, expect, it } from "vitest";

import { getProfileCompleteness } from "../utils/profileCompleteness";

describe("getProfileCompleteness", () => {
  it("reports an empty optional profile", () => {
    const result = getProfileCompleteness({});

    expect(result.isEmpty).toBe(true);
    expect(result.isComplete).toBe(false);
    expect(result.providedCount).toBe(0);
    expect(result.totalCount).toBe(6);
    expect(result.missingLabels).toContain("height");
  });

  it("reports a fully populated optional profile", () => {
    const result = getProfileCompleteness({
      restingHeartRate: 64,
      height: 178,
      weight: 72,
      activityLevel: "moderate",
      sleepHoursPerDay: 7.5,
      screenHoursPerDay: 4,
    });

    expect(result.isEmpty).toBe(false);
    expect(result.isComplete).toBe(true);
    expect(result.providedCount).toBe(6);
    expect(result.missingLabels).toHaveLength(0);
  });
});

