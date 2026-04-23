import { describe, expect, it } from "vitest";

import {
  absoluteLogPercent,
  absoluteLogRatio,
  formatLogExponentLabel,
  roundedLogExponent,
} from "../utils/temporalScale";

describe("temporalScale helpers", () => {
  const phenomenaScale = { minLog: -44, maxLog: 75 } as const;

  it("maps absolute-log domain bounds to normalized ratios", () => {
    expect(absoluteLogRatio(1e-44, phenomenaScale)).toBeCloseTo(0, 10);
    expect(absoluteLogRatio(1e75, phenomenaScale)).toBeCloseTo(1, 10);
  });

  it("supports inverted absolute-log positioning for top-first rulers", () => {
    expect(absoluteLogRatio(1e75, { ...phenomenaScale, invert: true })).toBeCloseTo(0, 10);
    expect(absoluteLogRatio(1e-44, { ...phenomenaScale, invert: true })).toBeCloseTo(1, 10);
  });

  it("clamps absolute-log percentages outside the configured range", () => {
    expect(absoluteLogPercent(1e-50, phenomenaScale)).toBe(0);
    expect(absoluteLogPercent(1e80, phenomenaScale)).toBe(100);
  });

  it("supports offset cosmic scales without branching in consumers", () => {
    const cosmicScale = {
      minLog: Math.log10(0.01),
      maxLog: Math.log10(13800 + 1),
      inputOffset: 0.001,
    } as const;

    expect(absoluteLogPercent(0, cosmicScale)).toBe(0);
    expect(absoluteLogPercent(13_800, cosmicScale)).toBeGreaterThan(99.99);
    expect(absoluteLogPercent(4_600, cosmicScale)).toBeGreaterThan(0);
    expect(absoluteLogPercent(4_600, cosmicScale)).toBeLessThan(100);
  });

  it("formats and rounds logarithmic exponents consistently", () => {
    expect(roundedLogExponent(1e-34)).toBe(-34);
    expect(roundedLogExponent(3_600)).toBe(4);
    expect(roundedLogExponent(0)).toBeNull();
    expect(formatLogExponentLabel(-34, "s")).toBe("10^-34 s");
    expect(formatLogExponentLabel(6)).toBe("10^6");
  });
});

